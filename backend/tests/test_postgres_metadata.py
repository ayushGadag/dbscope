"""
Unit & integration tests for Feature 2: PostgreSQL Schema / Metadata Analyzer.
Tests metadata transformation, password sanitization, connection error handling, and API.
"""

import pytest
from fastapi.testclient import TestClient

from dbscope.api.main import app
from dbscope.metadata.service import (
    PostgresMetadataService,
    mask_connection_url,
    normalize_schema_metadata,
)

client = TestClient(app)


class TestPostgresMetadataService:
    """Test suite for PostgresMetadataService normalization and safety."""

    def test_mask_connection_url_with_password(self):
        """Verify that password is completely masked in connection URLs."""
        url = "postgresql://myuser:supersecret_pass123@localhost:5432/production_db"
        masked = mask_connection_url(url)

        assert "supersecret_pass123" not in masked
        assert masked == "postgresql://myuser:****@localhost:5432/production_db"

    def test_mask_connection_url_without_password(self):
        """Verify that URLs without password remain intact."""
        url = "postgresql://localhost:5432/production_db"
        assert mask_connection_url(url) == url

    def test_mask_connection_url_empty(self):
        """Verify empty connection string handling."""
        assert mask_connection_url("") == ""

    def test_normalize_schema_metadata_single_table(self):
        """Test transformation of raw catalog rows into structured table schema."""
        raw_columns = [
            {
                "table_name": "users",
                "column_name": "id",
                "data_type": "integer",
                "is_nullable": "NO",
                "ordinal_position": 1,
            },
            {
                "table_name": "users",
                "column_name": "name",
                "data_type": "character varying",
                "is_nullable": "YES",
                "ordinal_position": 2,
            },
            {
                "table_name": "users",
                "column_name": "email",
                "data_type": "character varying",
                "is_nullable": "YES",
                "ordinal_position": 3,
            },
            {
                "table_name": "users",
                "column_name": "created_at",
                "data_type": "timestamp without time zone",
                "is_nullable": "NO",
                "ordinal_position": 4,
            },
        ]

        raw_pks = [
            {"table_name": "users", "column_name": "id"}
        ]

        result = normalize_schema_metadata(raw_columns, raw_pks)

        assert "tables" in result
        assert len(result["tables"]) == 1

        users_table = result["tables"][0]
        assert users_table["name"] == "users"
        assert len(users_table["columns"]) == 4

        # Check id column
        col_id = users_table["columns"][0]
        assert col_id["name"] == "id"
        assert col_id["data_type"] == "integer"
        assert col_id["is_nullable"] is False
        assert col_id["is_primary_key"] is True

        # Check name column
        col_name = users_table["columns"][1]
        assert col_name["name"] == "name"
        assert col_name["data_type"] == "character varying"
        assert col_name["is_nullable"] is True
        assert col_name["is_primary_key"] is False

        # Check email column
        col_email = users_table["columns"][2]
        assert col_email["name"] == "email"
        assert col_email["data_type"] == "character varying"
        assert col_email["is_nullable"] is True
        assert col_email["is_primary_key"] is False

    def test_normalize_schema_metadata_multiple_tables(self):
        """Test transformation across multiple tables preserving grouping."""
        raw_columns = [
            {
                "table_name": "users",
                "column_name": "id",
                "data_type": "integer",
                "is_nullable": "NO",
                "ordinal_position": 1,
            },
            {
                "table_name": "orders",
                "column_name": "order_id",
                "data_type": "uuid",
                "is_nullable": "NO",
                "ordinal_position": 1,
            },
            {
                "table_name": "orders",
                "column_name": "amount",
                "data_type": "numeric",
                "is_nullable": "YES",
                "ordinal_position": 2,
            },
        ]

        raw_pks = [
            {"table_name": "users", "column_name": "id"},
            {"table_name": "orders", "column_name": "order_id"},
        ]

        result = normalize_schema_metadata(raw_columns, raw_pks)

        assert len(result["tables"]) == 2
        assert result["tables"][0]["name"] == "users"
        assert result["tables"][1]["name"] == "orders"
        assert len(result["tables"][1]["columns"]) == 2
        assert result["tables"][1]["columns"][0]["is_primary_key"] is True

    def test_service_raises_on_empty_url(self):
        """Service raises ValueError if connection URL is empty."""
        service = PostgresMetadataService("")
        with pytest.raises(ValueError, match="not provided"):
            service.inspect_schema()

    def test_service_safely_reports_driver_or_connection_failure(self):
        """Service reports connection failure without leaking credentials."""
        secret_pass = "topsecret987"
        url = f"postgresql://admin:{secret_pass}@nonexistent-host.local:5432/mydb"
        service = PostgresMetadataService(url)

        with pytest.raises(RuntimeError) as exc_info:
            service.inspect_schema()

        error_message = str(exc_info.value)
        # Ensure raw password is NOT present
        assert secret_pass not in error_message
        # Ensure masked version is present
        assert "admin:****@nonexistent-host.local" in error_message


class TestMetadataAPI:
    """Test suite for /api/metadata/inspect endpoint."""

    def test_inspect_missing_url_returns_400(self):
        """Missing connection_url returns 400 Bad Request."""
        response = client.post("/api/metadata/inspect", json={})
        assert response.status_code == 400
        assert "connection url" in response.json()["detail"].lower()

    def test_inspect_unreachable_db_returns_503_and_masks_password(self):
        """Attempting inspection on unreachable host returns 503 and masks password."""
        secret_pass = "mypassword123"
        payload = {
            "connection_url": f"postgresql://appuser:{secret_pass}@127.0.0.1:59999/dummy",
            "schema_name": "public",
        }
        response = client.post("/api/metadata/inspect", json=payload)

        assert response.status_code == 503
        detail = response.json()["detail"]
        assert secret_pass not in detail
        assert "appuser:****@127.0.0.1" in detail
