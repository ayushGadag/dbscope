"""
Tests for DBScope Source-Code and PostgreSQL Connectors, Unified Dependency Analysis, and Security.
"""

import io
import zipfile
from pathlib import Path
from unittest.mock import MagicMock, patch

import pytest
from fastapi.testclient import TestClient

from dbscope.api.main import app
from dbscope.dependencies.extractor import DependencyExtractor
from dbscope.metadata.service import PostgresMetadataService, build_connection_url
from dbscope.source.connector import (
    collect_python_files,
    fetch_github_repository,
    parse_github_url,
    validate_and_extract_zip,
)

client = TestClient(app)


class TestPostgresConnector:
    """Test suite for real PostgreSQL connection layer and security."""

    def test_build_connection_url(self):
        """Verify safe construction of connection URL with encoded credentials."""
        url = build_connection_url(
            host="127.0.0.1",
            port=5432,
            database="mydb",
            username="postgres",
            password="my@secret:pass",
        )
        assert "postgresql://postgres:my%40secret%3Apass@127.0.0.1:5432/mydb" == url

    def test_build_connection_url_without_password(self):
        """Verify URL construction when password is omitted."""
        url = build_connection_url(
            host="localhost",
            port=5432,
            database="testdb",
            username="user1",
        )
        assert url == "postgresql://user1@localhost:5432/testdb"

    def test_test_connection_api_missing_params(self):
        """Missing connection params returns 400 Bad Request."""
        res = client.post("/api/metadata/test-connection", json={})
        assert res.status_code == 400
        assert "required" in res.json()["detail"].lower()

    def test_test_connection_api_masks_password_on_failure(self):
        """Connection failure returns 503 and masks password completely."""
        secret = "p@ssword999!"
        payload = {
            "host": "127.0.0.1",
            "port": 59998,
            "database": "dummy",
            "username": "appuser",
            "password": secret,
        }
        res = client.post("/api/metadata/test-connection", json=payload)
        assert res.status_code == 503
        detail = res.json()["detail"]
        assert secret not in detail
        assert "appuser:****@127.0.0.1" in detail

    @patch("dbscope.metadata.service.PostgresMetadataService._get_driver")
    def test_test_connection_success_mock(self, mock_get_driver):
        """Successful connection test returns 200 with server version and read-only enforcement."""
        mock_driver = MagicMock()
        mock_conn = MagicMock()
        mock_cursor = MagicMock()
        mock_cursor.fetchone.return_value = ["PostgreSQL 16.2 on x86_64-pc-linux-gnu"]

        mock_conn.__enter__.return_value = mock_conn
        mock_conn.cursor.return_value.__enter__.return_value = mock_cursor
        mock_driver.connect.return_value = mock_conn
        mock_get_driver.return_value = ("psycopg", mock_driver)

        service = PostgresMetadataService(connection_url="postgresql://user:pass@localhost:5432/mydb")
        result = service.test_connection()

        assert result["success"] is True
        assert "PostgreSQL 16.2" in result["server_version"]
        assert result["database"] == "mydb"


class TestSourceCodeConnector:
    """Test suite for ZIP safety, Zip Slip protection, and GitHub ingestion."""

    def test_zip_extraction_success(self, tmp_path):
        """Verify normal Python files extract cleanly from a valid ZIP."""
        buf = io.BytesIO()
        with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as zf:
            zf.writestr("app/models.py", "class User:\n    email = 'str'\n")
            zf.writestr("app/schemas.py", "class UserResponse:\n    email: str\n")
            zf.writestr("README.md", "# Sample App\n")

        py_files = validate_and_extract_zip(buf.getvalue(), tmp_path)
        assert len(py_files) == 2
        collected = collect_python_files(tmp_path)
        assert len(collected) == 2

    def test_zip_slip_path_traversal_blocked(self, tmp_path):
        """Verify path traversal attack (Zip Slip) is rejected with ValueError."""
        buf = io.BytesIO()
        with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as zf:
            zf.writestr("../evil.py", "print('hacked')")

        with pytest.raises(ValueError, match="path traversal"):
            validate_and_extract_zip(buf.getvalue(), tmp_path)

    def test_zip_empty_raises_value_error(self, tmp_path):
        """Empty ZIP content raises ValueError."""
        with pytest.raises(ValueError, match="empty"):
            validate_and_extract_zip(b"", tmp_path)

    def test_parse_github_url_valid(self):
        """Parse valid GitHub URLs properly."""
        parsed = parse_github_url("https://github.com/myorg/myapp.git")
        assert parsed["owner"] == "myorg"
        assert parsed["repo"] == "myapp"
        assert parsed["clean_url"] == "https://github.com/myorg/myapp"

    def test_parse_github_url_invalid(self):
        """Invalid GitHub URL format raises descriptive ValueError."""
        with pytest.raises(ValueError, match="Invalid GitHub URL"):
            parse_github_url("https://gitlab.com/user/repo")

    @patch("subprocess.run")
    def test_fetch_github_repo_private_auth_required(self, mock_run, tmp_path):
        """Private repository requiring authentication returns clear error."""
        mock_proc = MagicMock()
        mock_proc.returncode = 128
        mock_proc.stderr = "fatal: Authentication failed for 'https://github.com/private/repo/'"
        mock_run.return_value = mock_proc

        with pytest.raises(ValueError, match="requires authentication"):
            fetch_github_repository("https://github.com/private/repo", tmp_path)


class TestUnifiedAnalysisAPI:
    """Test suite for /api/dependencies/graph and /api/dependencies/unified endpoints."""

    def test_get_dependency_graph_endpoint(self):
        """Verify /api/dependencies/graph returns structured nodes and edges."""
        res = client.post("/api/dependencies/graph", json={"changed_object": "users.email"})
        assert res.status_code == 200
        data = res.json()

        assert data["changed_object"] == "users.email"
        assert len(data["nodes"]) >= 4
        assert len(data["edges"]) >= 3

        node_types = [n["type"].upper() for n in data["nodes"]]
        assert "DATABASE" in node_types
        assert "TABLE" in node_types
        assert "COLUMN" in node_types
        assert "ORM_MODEL" in node_types
        assert "summary" in data
        assert data["summary"]["total_nodes"] == 6
        assert data["summary"]["total_edges"] == 5

    def test_unified_analysis_drop_column(self):
        """Verify /api/dependencies/unified with DROP COLUMN statement."""
        payload = {
            "sql": "ALTER TABLE users DROP COLUMN email;",
        }
        res = client.post("/api/dependencies/unified", json=payload)
        assert res.status_code == 200
        data = res.json()

        assert data["migration"]["operation"] == "DROP_COLUMN"
        assert data["migration"]["table"] == "users"
        assert data["migration"]["column"] == "email"

        assert data["database_verification"]["table_exists"] is True
        assert len(data["application_dependencies"]) >= 1

        assert data["potential_impact"]["severity"] == "High"
        assert "graph" in data
        assert len(data["graph"]["nodes"]) >= 4

    def test_unified_analysis_add_column(self):
        """Verify /api/dependencies/unified with ADD COLUMN statement."""
        payload = {
            "sql": "ALTER TABLE users ADD COLUMN age INTEGER;",
        }
        res = client.post("/api/dependencies/unified", json=payload)
        assert res.status_code == 200
        data = res.json()

        assert data["migration"]["operation"] == "ADD_COLUMN"
        assert data["migration"]["table"] == "users"
        assert data["migration"]["column"] == "age"
        assert data["potential_impact"]["severity"] == "Low"

    def test_unified_analysis_invalid_sql(self):
        """Empty or unsupported SQL returns proper error codes."""
        res_empty = client.post("/api/dependencies/unified", json={"sql": ""})
        assert res_empty.status_code == 400

        res_unsupported = client.post("/api/dependencies/unified", json={"sql": "SELECT * FROM users;"})
        assert res_unsupported.status_code == 422


class TestSourceUploadAPI:
    """Test suite for /api/source/upload-zip and /api/source/github endpoints."""

    def test_upload_zip_api(self):
        """Test uploading a valid ZIP archive via REST API."""
        buf = io.BytesIO()
        with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as zf:
            zf.writestr("models.py", "class User:\n    email = 'text'\n")

        files = {"file": ("test_repo.zip", buf.getvalue(), "application/zip")}
        res = client.post("/api/source/upload-zip", files=files)

        assert res.status_code == 200
        data = res.json()
        assert data["success"] is True
        assert data["files_count"] >= 1
        assert "test_repo.zip" in data["filename"]

        # Reset active source dir to prevent test pollution
        from dbscope.source.connector import set_active_source_dir
        set_active_source_dir(None)

    def test_upload_non_zip_rejected(self):
        """Uploading non-zip file is rejected with 400."""
        files = {"file": ("test.txt", b"plain text", "text/plain")}
        res = client.post("/api/source/upload-zip", files=files)
        assert res.status_code == 400
        assert "only .zip" in res.json()["detail"].lower()
