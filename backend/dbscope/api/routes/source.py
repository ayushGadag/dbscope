"""
Source code ingestion API routes for DBScope.
Provides safe ZIP upload extraction and public GitHub repository scanning.
"""

import tempfile
from pathlib import Path
from fastapi import APIRouter, File, HTTPException, UploadFile, status

from dbscope.api.schemas.dependencies import (
    ScanGitHubRequest,
    ScanGitHubResponse,
    UploadSourceZipResponse,
)
from dbscope.source.connector import (
    collect_python_files,
    fetch_github_repository,
    get_active_source_info,
    parse_github_url,
    reset_active_source,
    set_active_source,
    validate_and_extract_zip,
)

router = APIRouter(prefix="/api/source", tags=["Source Code"])


@router.get(
    "/active",
    responses={
        200: {"description": "Active source repository metadata"},
    },
)
def get_active_source():
    """
    Get the currently active source repository metadata (name, type, files count, URL).
    Enables frontend to synchronize state across reloads and server restarts.
    """
    return get_active_source_info()


@router.post(
    "/reset",
    responses={
        200: {"description": "Active source workspace reset to default"},
    },
)
def reset_source():
    """
    Reset the active source workspace back to the built-in reference sample_app.
    """
    state = reset_active_source(to_sample=True)
    return {
        "success": True,
        "message": "Active source reset to default sample_app reference.",
        "state": state,
    }


@router.post(
    "/upload-zip",
    response_model=UploadSourceZipResponse,
    responses={
        200: {"description": "ZIP archive validated and extracted safely"},
        400: {"description": "Invalid or unsafe ZIP archive"},
    },
)
async def upload_source_zip(file: UploadFile = File(...)):
    """
    Accept an uploaded application ZIP archive for static AST dependency extraction.

    Safety:
    - Path traversal (Zip-Slip) protection enforced.
    - Never executes extracted files.
    - Ignores binary, non-source, and ignored directories.
    - Extracted in an isolated temporary working directory.
    """
    if not file.filename or not file.filename.lower().endswith(".zip"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only .zip archive files are supported.",
        )

    try:
        content = await file.read()
        if not content:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Uploaded file is empty.",
            )

        temp_dir = Path(tempfile.mkdtemp(prefix="dbscope_upload_"))
        extracted_py_files = validate_and_extract_zip(content, temp_dir)
        total_py = len(collect_python_files(temp_dir))
        size_mb = f"{len(content) / (1024 * 1024):.2f} MB"

        set_active_source(
            path=temp_dir,
            source_type="zip",
            name=file.filename,
            files_count=total_py,
        )

        return {
            "success": True,
            "filename": file.filename,
            "size": size_mb,
            "files_count": total_py,
            "status": "Staged",
            "message": f"Successfully extracted and staged {total_py} Python source files for AST analysis.",
        }
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to process ZIP archive: {str(e)}",
        )


@router.post(
    "/github",
    response_model=ScanGitHubResponse,
    responses={
        200: {"description": "Public GitHub repository scanned successfully"},
        400: {"description": "Invalid repository URL or private authentication required"},
        503: {"description": "GitHub unreachable"},
    },
)
def scan_github_repository(request: ScanGitHubRequest):
    """
    Connect to a public GitHub repository and stage it for static AST dependency analysis.

    Safety:
    - Purely public access without storing credentials.
    - Clear rejection if repository requires private authentication.
    - Never executes application code.
    """
    try:
        parsed = parse_github_url(request.url)
        temp_dir = Path(tempfile.mkdtemp(prefix="dbscope_github_"))
        result = fetch_github_repository(request.url, temp_dir)
        total_py = len(collect_python_files(temp_dir))

        repo_name = f"{parsed['owner']}/{parsed['repo']}"
        set_active_source(
            path=temp_dir,
            source_type="github",
            name=repo_name,
            url=parsed["clean_url"],
            files_count=total_py,
        )

        return {
            "success": True,
            "repo_name": repo_name,
            "branch": "main",
            "url": parsed["clean_url"],
            "files_count": total_py,
            "status": "Linked",
            "message": f"Successfully ingested {repo_name}. {total_py} Python source files discovered.",
        }
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except RuntimeError as re:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(re))
