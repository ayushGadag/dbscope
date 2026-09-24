"""
Source-code connector package for DBScope.
"""

from dbscope.source.connector import (
    collect_python_files,
    fetch_github_repository,
    get_active_source_dir,
    set_active_source_dir,
    validate_and_extract_zip,
)

__all__ = [
    "collect_python_files",
    "fetch_github_repository",
    "get_active_source_dir",
    "set_active_source_dir",
    "validate_and_extract_zip",
]
