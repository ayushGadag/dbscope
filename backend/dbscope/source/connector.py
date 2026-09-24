"""
Application source-code connector for DBScope.
Supports safe ZIP archive extraction and public GitHub repository ingestion.
Enforces read-only static analysis and prevents path traversal (Zip Slip).
"""

import io
import os
import re
import shutil
import subprocess
import tempfile
import zipfile
from pathlib import Path
from typing import Any, Dict, List, Optional
import urllib.request
import urllib.error

# Module-level tracking of active source workspace
_ACTIVE_SOURCE_DIR: Optional[Path] = None

# Max allowable uncompressed ZIP size (50MB) to mitigate decompression bombs
MAX_UNCOMPRESSED_SIZE_BYTES = 50 * 1024 * 1024

# Folders to ignore during repository source scanning
IGNORED_DIRECTORIES = {
    ".git",
    "node_modules",
    "__pycache__",
    ".venv",
    "venv",
    "env",
    ".tox",
    "dist",
    "build",
    ".eggs",
    ".pytest_cache",
    ".mypy_cache",
    "site-packages",
}


def get_default_source_dir() -> Path:
    """Return default sample_app source directory."""
    return Path(__file__).resolve().parent.parent / "sample_app"


def get_active_source_dir() -> Path:
    """Return current active source directory, falling back to sample_app."""
    global _ACTIVE_SOURCE_DIR
    if _ACTIVE_SOURCE_DIR and _ACTIVE_SOURCE_DIR.exists():
        return _ACTIVE_SOURCE_DIR
    return get_default_source_dir()


def set_active_source_dir(path: Path) -> None:
    """Set the active source directory for dependency scanning."""
    global _ACTIVE_SOURCE_DIR
    _ACTIVE_SOURCE_DIR = path


def cleanup_source_dir(path: Optional[Path] = None) -> None:
    """Safely remove a temporary source directory."""
    global _ACTIVE_SOURCE_DIR
    target = path or _ACTIVE_SOURCE_DIR
    if target and target.exists() and target != get_default_source_dir():
        try:
            shutil.rmtree(target, ignore_errors=True)
        except Exception:
            pass
    if target == _ACTIVE_SOURCE_DIR:
        _ACTIVE_SOURCE_DIR = None


def validate_and_extract_zip(zip_bytes: bytes, target_dir: Path) -> List[Path]:
    """
    Safely extract a ZIP archive into target_dir with strict path traversal protection.

    Safety:
    - Verifies all paths stay inside target_dir (anti Zip-Slip).
    - Blocks path traversal (../, Windows drives, root paths).
    - Rejects symlink members.
    - Enforces max total extracted size limit.
    - Never executes extracted files.
    """
    if not zip_bytes:
        raise ValueError("Uploaded ZIP archive is empty.")

    target_dir.mkdir(parents=True, exist_ok=True)
    resolved_target = target_dir.resolve()

    try:
        archive = zipfile.ZipFile(io.BytesIO(zip_bytes))
    except zipfile.BadZipFile:
        raise ValueError("Invalid ZIP archive format.")

    total_uncompressed_size = 0
    extracted_files: List[Path] = []

    with archive:
        for member in archive.infolist():
            # Check uncompressed size limit
            total_uncompressed_size += member.file_size
            if total_uncompressed_size > MAX_UNCOMPRESSED_SIZE_BYTES:
                raise ValueError(
                    f"ZIP archive exceeds maximum allowable uncompressed size of {MAX_UNCOMPRESSED_SIZE_BYTES // (1024 * 1024)} MB."
                )

            # Prevent symlinks
            # Mode check: S_IFLNK is 0o120000
            if (member.external_attr >> 16) & 0o170000 == 0o120000:
                raise ValueError(f"Unsafe ZIP archive: symbolic link detected in member '{member.filename}'.")

            # Path traversal verification
            member_path = member.filename
            if member_path.startswith("/") or member_path.startswith("\\") or ":" in member_path:
                raise ValueError(f"Unsafe ZIP archive: absolute or drive path detected in '{member_path}'.")

            dest_path = (target_dir / member_path).resolve()
            try:
                dest_path.relative_to(resolved_target)
            except ValueError:
                raise ValueError(f"Security error: path traversal detected in ZIP member '{member_path}'.")

            # Ignore directories during individual extraction
            if member.is_dir():
                dest_path.mkdir(parents=True, exist_ok=True)
                continue

            dest_path.parent.mkdir(parents=True, exist_ok=True)
            with archive.open(member) as source_file, open(dest_path, "wb") as dest_file:
                shutil.copyfileobj(source_file, dest_file)

            if dest_path.suffix.lower() == ".py":
                extracted_files.append(dest_path)

    return extracted_files


def parse_github_url(url: str) -> Dict[str, str]:
    """
    Validate and parse a GitHub repository URL into owner and repository name.
    """
    if not url or not isinstance(url, str):
        raise ValueError("GitHub repository URL cannot be empty.")

    cleaned = url.strip()
    match = re.match(
        r"^https?:\/\/github\.com\/([a-zA-Z0-9_.-]+)\/([a-zA-Z0-9_.-]+?)(?:\.git)?(?:\/)?$",
        cleaned,
        re.IGNORECASE,
    )
    if not match:
        raise ValueError(
            "Invalid GitHub URL format. Please provide a standard GitHub URL, e.g. https://github.com/owner/repo"
        )

    owner, repo = match.group(1), match.group(2)
    return {
        "owner": owner,
        "repo": repo,
        "clean_url": f"https://github.com/{owner}/{repo}",
    }


def fetch_github_repository(repo_url: str, target_dir: Path) -> Dict[str, Any]:
    """
    Safely clone or download a public GitHub repository into a temporary directory.

    Safety:
    - Only accesses public repositories without credentials.
    - If repository requires authentication, returns clear error stating authentication is required.
    - Never stores credentials.
    - Never executes code from repository.
    """
    parsed = parse_github_url(repo_url)
    owner = parsed["owner"]
    repo = parsed["repo"]
    clean_url = parsed["clean_url"]

    target_dir.mkdir(parents=True, exist_ok=True)

    # First attempt: git shallow clone (fastest if git is available)
    try:
        result = subprocess.run(
            ["git", "clone", "--depth", "1", "--single-branch", clean_url, str(target_dir)],
            capture_output=True,
            text=True,
            timeout=15,
            check=False,
        )
        if result.returncode == 0:
            return {
                "owner": owner,
                "repo": repo,
                "url": clean_url,
                "method": "git_clone",
            }
        else:
            stderr = result.stderr.lower()
            if "authentication failed" in stderr or "could not read username" in stderr or "terminal prompts disabled" in stderr:
                raise ValueError(
                    "Repository is private or requires authentication. DBScope only analyzes publicly accessible repositories without credentials."
                )
            if "repository not found" in stderr:
                raise ValueError(
                    f"GitHub repository '{owner}/{repo}' not found or is private (authentication required)."
                )
    except FileNotFoundError:
        # Git executable not on PATH; proceed to HTTP zip download
        pass
    except subprocess.TimeoutExpired:
        raise RuntimeError("GitHub repository clone timed out after 15 seconds.")

    # Fallback attempt: Download archive zipball for public repositories
    archive_urls = [
        f"https://github.com/{owner}/{repo}/archive/refs/heads/main.zip",
        f"https://github.com/{owner}/{repo}/archive/refs/heads/master.zip",
    ]

    zip_bytes: Optional[bytes] = None
    last_error: Optional[Exception] = None

    req_headers = {"User-Agent": "DBScope-Scanner/1.0"}

    for a_url in archive_urls:
        try:
            req = urllib.request.Request(a_url, headers=req_headers)
            with urllib.request.urlopen(req, timeout=12) as response:
                if response.status == 200:
                    zip_bytes = response.read()
                    break
        except urllib.error.HTTPError as e:
            last_error = e
            if e.code in (401, 403):
                raise ValueError(
                    "Repository is private or requires authentication. DBScope only analyzes publicly accessible repositories without credentials."
                )
            if e.code == 404:
                continue
        except Exception as e:
            last_error = e

    if zip_bytes is None:
        if isinstance(last_error, urllib.error.HTTPError) and last_error.code == 404:
            raise ValueError(
                f"GitHub repository '{owner}/{repo}' not found or is private (authentication required)."
            )
        raise RuntimeError(
            f"Failed to access GitHub repository '{owner}/{repo}': {last_error or 'Could not download repository archive'}"
        )

    # Extract downloaded zipball
    validate_and_extract_zip(zip_bytes, target_dir)
    return {
        "owner": owner,
        "repo": repo,
        "url": clean_url,
        "method": "archive_download",
    }


def collect_python_files(root_dir: Path) -> List[Path]:
    """
    Collect all Python source files (.py) under root_dir, skipping ignored folders and binary files.
    """
    python_files: List[Path] = []
    if not root_dir.exists():
        return python_files

    for dirpath, dirnames, filenames in os.walk(root_dir):
        # Prune ignored directories in-place
        dirnames[:] = [d for d in dirnames if d not in IGNORED_DIRECTORIES]

        for fname in filenames:
            if fname.lower().endswith(".py"):
                fpath = Path(dirpath) / fname
                try:
                    # Ignore files larger than 2MB
                    if fpath.stat().st_size <= 2 * 1024 * 1024:
                        python_files.append(fpath)
                except OSError:
                    pass

    return python_files
