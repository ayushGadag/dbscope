"""
Unit & integration tests for Feature 3: Dependency Extraction Prototype.
Tests AST extraction of ORM models, Pydantic schemas, and FastAPI routes for changed database columns.
"""

import pytest
from fastapi.testclient import TestClient

from dbscope.api.main import app
from dbscope.dependencies.extractor import DependencyExtractor

client = TestClient(app)


class TestDependencyExtractor:
    """Test suite for DependencyExtractor service."""

    @pytest.fixture
    def extractor(self):
        """Provide a DependencyExtractor instance targeting the sample_app."""
        return DependencyExtractor()

    def test_extract_users_email_orm_model(self, extractor):
        """Verify that users.email detects SQLAlchemy User.email model attribute."""
        result = extractor.extract_dependencies("users.email")

        assert result["changed_object"] == "users.email"
        orm_deps = [d for d in result["dependencies"] if d["type"] == "orm_model"]

        assert len(orm_deps) == 1
        assert orm_deps[0]["name"] == "User.email"
        assert orm_deps[0]["file"] == "models.py"
        assert isinstance(orm_deps[0]["line"], int)

    def test_extract_users_email_pydantic_schema(self, extractor):
        """Verify that users.email detects Pydantic UserResponse.email schema field."""
        result = extractor.extract_dependencies("users.email")

        pydantic_deps = [d for d in result["dependencies"] if d["type"] == "pydantic_schema"]

        assert len(pydantic_deps) == 1
        assert pydantic_deps[0]["name"] == "UserResponse.email"
        assert pydantic_deps[0]["file"] == "schemas.py"
        assert isinstance(pydantic_deps[0]["line"], int)

    def test_extract_users_email_fastapi_route(self, extractor):
        """Verify that users.email traces through to GET /users/{id} route."""
        result = extractor.extract_dependencies("users.email")

        route_deps = [d for d in result["dependencies"] if d["type"] == "fastapi_route"]

        assert len(route_deps) == 1
        assert route_deps[0]["name"] == "GET /users/{id}"
        assert route_deps[0]["file"] == "routes.py"
        assert isinstance(route_deps[0]["line"], int)

    def test_extract_all_three_layers(self, extractor):
        """Verify the full 3-tier ripple effect: Model -> Schema -> Route."""
        result = extractor.extract_dependencies("users.email")
        dep_names = [d["name"] for d in result["dependencies"]]

        assert "User.email" in dep_names
        assert "UserResponse.email" in dep_names
        assert "GET /users/{id}" in dep_names

    def test_unknown_column_returns_empty_dependencies(self, extractor):
        """Querying a non-existent column returns an empty dependency list."""
        result = extractor.extract_dependencies("users.non_existent_col")

        assert result["changed_object"] == "users.non_existent_col"
        assert result["dependencies"] == []

    def test_unknown_table_returns_empty_dependencies(self, extractor):
        """Querying an unknown table returns an empty dependency list."""
        result = extractor.extract_dependencies("orders.tracking_code")

        assert result["changed_object"] == "orders.tracking_code"
        assert result["dependencies"] == []

    def test_empty_input_raises_value_error(self, extractor):
        """Empty or whitespace input raises ValueError."""
        with pytest.raises(ValueError, match="empty"):
            extractor.extract_dependencies("")

        with pytest.raises(ValueError, match="empty"):
            extractor.extract_dependencies("   ")

    def test_invalid_format_raises_value_error(self, extractor):
        """Input without dot separator raises descriptive ValueError."""
        with pytest.raises(ValueError, match="table.column"):
            extractor.extract_dependencies("users")

        with pytest.raises(ValueError, match="table.column"):
            extractor.extract_dependencies("users.")


class TestDependencyAPI:
    """Test suite for /api/dependencies/extract endpoint."""

    def test_extract_api_success(self):
        """Verify valid API call returns 200 and structured dependencies."""
        payload = {"changed_object": "users.email"}
        response = client.post("/api/dependencies/extract", json=payload)

        assert response.status_code == 200
        data = response.json()
        assert data["changed_object"] == "users.email"
        assert len(data["dependencies"]) == 3

        types = [d["type"] for d in data["dependencies"]]
        assert "orm_model" in types
        assert "pydantic_schema" in types
        assert "fastapi_route" in types

    def test_extract_api_unknown_column(self):
        """Verify API call for unreferenced column returns 200 with empty list."""
        payload = {"changed_object": "users.unknown_col"}
        response = client.post("/api/dependencies/extract", json=payload)

        assert response.status_code == 200
        data = response.json()
        assert data["dependencies"] == []

    def test_extract_api_invalid_format_returns_400(self):
        """Verify API call with invalid format returns 400 Bad Request."""
        payload = {"changed_object": "just_users"}
        response = client.post("/api/dependencies/extract", json=payload)

        assert response.status_code == 400
        assert "table.column" in response.json()["detail"].lower()

    def test_extract_api_empty_returns_400(self):
        """Verify API call with empty string returns 400 Bad Request."""
        payload = {"changed_object": ""}
        response = client.post("/api/dependencies/extract", json=payload)

        assert response.status_code == 400
        assert "empty" in response.json()["detail"].lower()
