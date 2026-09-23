"""
Unit & integration tests for Feature 1: Migration Analysis API.
Tests POST /api/migrations/analyze with various SQL inputs and response codes.
"""

import pytest
from fastapi.testclient import TestClient

from dbscope.api.main import app

client = TestClient(app)


class TestMigrationAnalysisAPI:
    """Test suite for /api/migrations/analyze endpoint."""

    def test_health_check(self):
        """Test GET /api/health endpoint."""
        response = client.get("/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert data["service"] == "dbscope-api"

    def test_valid_drop_column(self):
        """Test valid DROP COLUMN statement returns 200 with structured data."""
        payload = {"sql": "ALTER TABLE users DROP COLUMN email;"}
        response = client.post("/api/migrations/analyze", json=payload)

        assert response.status_code == 200
        data = response.json()
        assert data["operation"] == "DROP_COLUMN"
        assert data["table"] == "users"
        assert data["column"] == "email"

    def test_valid_add_column(self):
        """Test valid ADD COLUMN statement returns 200 with structured data."""
        payload = {"sql": "ALTER TABLE users ADD COLUMN age INTEGER;"}
        response = client.post("/api/migrations/analyze", json=payload)

        assert response.status_code == 200
        data = response.json()
        assert data["operation"] == "ADD_COLUMN"
        assert data["table"] == "users"
        assert data["column"] == "age"
        assert data["data_type"] == "INTEGER"

    def test_valid_alter_column(self):
        """Test valid ALTER COLUMN statement returns 200 with structured data."""
        payload = {"sql": "ALTER TABLE users ALTER COLUMN age TYPE BIGINT;"}
        response = client.post("/api/migrations/analyze", json=payload)

        assert response.status_code == 200
        data = response.json()
        assert data["operation"] == "ALTER_COLUMN"
        assert data["table"] == "users"
        assert data["column"] == "age"
        assert data["new_type"] == "BIGINT"
        assert data["clause"] == "TYPE BIGINT"

    def test_valid_rename_column(self):
        """Test valid RENAME COLUMN statement returns 200 with structured data."""
        payload = {"sql": "ALTER TABLE users RENAME COLUMN email TO email_address;"}
        response = client.post("/api/migrations/analyze", json=payload)

        assert response.status_code == 200
        data = response.json()
        assert data["operation"] == "RENAME_COLUMN"
        assert data["table"] == "users"
        assert data["old_column"] == "email"
        assert data["new_column"] == "email_address"

    def test_empty_sql_returns_400(self):
        """Test empty SQL string returns HTTP 400 Bad Request."""
        payload = {"sql": ""}
        response = client.post("/api/migrations/analyze", json=payload)

        assert response.status_code == 400
        assert "detail" in response.json()
        assert "empty" in response.json()["detail"].lower()

    def test_whitespace_sql_returns_400(self):
        """Test whitespace-only SQL string returns HTTP 400 Bad Request."""
        payload = {"sql": "    \n\t  "}
        response = client.post("/api/migrations/analyze", json=payload)

        assert response.status_code == 400
        assert "detail" in response.json()
        assert "empty" in response.json()["detail"].lower()

    def test_unsupported_ddl_returns_422(self):
        """Test unsupported DDL (CREATE TABLE) returns HTTP 422 with clear message."""
        payload = {"sql": "CREATE TABLE users (id INT);"}
        response = client.post("/api/migrations/analyze", json=payload)

        assert response.status_code == 422
        data = response.json()
        assert data["operation"] is None
        assert "unsupported" in data["message"].lower()

    def test_invalid_sql_returns_422(self):
        """Test arbitrary text returns HTTP 422 with clear message."""
        payload = {"sql": "random non-sql text here"}
        response = client.post("/api/migrations/analyze", json=payload)

        assert response.status_code == 422
        data = response.json()
        assert data["operation"] is None
        assert "unsupported" in data["message"].lower()

    def test_missing_sql_field_returns_422(self):
        """Test missing 'sql' key in body triggers Pydantic validation error (422)."""
        payload = {}
        response = client.post("/api/migrations/analyze", json=payload)

        assert response.status_code == 422
