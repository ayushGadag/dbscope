"""
Comprehensive test suite for DBScope Graph Builder, Object Matching,
Unified Analysis Orchestration, and Graph API dataset generation.
"""

import io
from pathlib import Path
from unittest.mock import MagicMock, patch
import zipfile

import pytest
from fastapi.testclient import TestClient

from dbscope.analysis_service import UnifiedAnalysisService
from dbscope.api.main import app
from dbscope.dependencies.extractor import DependencyExtractor
from dbscope.dependencies.graph_builder import GraphBuilder

client = TestClient(app)


class TestGraphBuilder:
    """Test suite for the Graph Builder service."""

    @pytest.fixture
    def sample_dependencies(self):
        extractor = DependencyExtractor()
        return extractor.extract_dependencies("users.email")["dependencies"]

    def test_graph_builder_deterministic_6_node_chain(self, sample_dependencies):
        """
        Verify the exact sample dependency chain produces 6 nodes:
        PostgreSQL -> users -> users.email -> User.email -> UserResponse.email -> GET /users/{id}
        """
        builder = GraphBuilder(db_type="PostgreSQL")
        graph = builder.build_graph(
            changed_object="users.email",
            dependencies=sample_dependencies,
            db_name="testdb",
            table_exists=True,
            column_exists=True,
            data_type="varchar",
        )

        assert graph["changed_object"] == "users.email"
        nodes = graph["nodes"]
        assert len(nodes) == 6

        node_ids = [n["id"] for n in nodes]
        assert "db:postgresql" in node_ids
        assert "table:users" in node_ids
        assert "column:users.email" in node_ids
        assert "orm:User.email" in node_ids
        assert "schema:UserResponse.email" in node_ids
        assert "route:GET /users/{id}" in node_ids

        # Verify node types match the specification
        type_by_id = {n["id"]: n["type"] for n in nodes}
        assert type_by_id["db:postgresql"] == "DATABASE"
        assert type_by_id["table:users"] == "TABLE"
        assert type_by_id["column:users.email"] == "COLUMN"
        assert type_by_id["orm:User.email"] == "ORM_MODEL"
        assert type_by_id["schema:UserResponse.email"] == "PYDANTIC_SCHEMA"
        assert type_by_id["route:GET /users/{id}"] == "FASTAPI_ROUTE"

        # Verify labels
        label_by_id = {n["id"]: n["label"] for n in nodes}
        assert label_by_id["db:postgresql"] == "PostgreSQL"
        assert label_by_id["table:users"] == "users"
        assert label_by_id["column:users.email"] == "users.email"
        assert label_by_id["orm:User.email"] == "User.email"
        assert label_by_id["schema:UserResponse.email"] == "UserResponse.email"
        assert label_by_id["route:GET /users/{id}"] == "GET /users/{id}"

        # Verify metadata
        for n in nodes:
            assert "metadata" in n
            assert isinstance(n["metadata"], dict)

    def test_graph_builder_deterministic_5_edges_relationships(self, sample_dependencies):
        """
        Verify the exact sample dependency edges and relationships:
        1. PostgreSQL -> users: "contains table"
        2. users -> users.email: "contains column"
        3. users.email -> User.email: "maps to ORM attribute"
        4. User.email -> UserResponse.email: "represented by Pydantic field"
        5. UserResponse.email -> GET /users/{id}: "used by FastAPI response model"
        """
        builder = GraphBuilder()
        graph = builder.build_graph(
            changed_object="users.email",
            dependencies=sample_dependencies,
        )

        edges = graph["edges"]
        assert len(edges) == 5

        edge_map = {(e["source"], e["target"]): e["relationship"] for e in edges}

        assert ("db:postgresql", "table:users") in edge_map
        assert edge_map[("db:postgresql", "table:users")] == "contains table"

        assert ("table:users", "column:users.email") in edge_map
        assert edge_map[("table:users", "column:users.email")] == "contains column"

        assert ("column:users.email", "orm:User.email") in edge_map
        assert edge_map[("column:users.email", "orm:User.email")] == "maps to ORM attribute"

        assert ("orm:User.email", "schema:UserResponse.email") in edge_map
        assert edge_map[("orm:User.email", "schema:UserResponse.email")] == "represented by Pydantic field"

        assert ("schema:UserResponse.email", "route:GET /users/{id}") in edge_map
        assert edge_map[("schema:UserResponse.email", "route:GET /users/{id}")] == "used by FastAPI response model"

    def test_graph_builder_summary(self, sample_dependencies):
        """Verify summary metric counts."""
        builder = GraphBuilder()
        graph = builder.build_graph("users.email", sample_dependencies)

        assert "summary" in graph
        assert graph["summary"]["total_nodes"] == 6
        assert graph["summary"]["total_edges"] == 5

    def test_graph_builder_unreferenced_column(self):
        """Unreferenced column produces only database, table, and column nodes (3 nodes, 2 edges)."""
        builder = GraphBuilder()
        graph = builder.build_graph("users.unreferenced_field", dependencies=[])

        assert len(graph["nodes"]) == 3
        assert len(graph["edges"]) == 2
        assert graph["summary"]["total_nodes"] == 3
        assert graph["summary"]["total_edges"] == 2


class TestObjectMatching:
    """Test suite for connecting database objects to application code references."""

    def test_deterministic_matching_email(self):
        """Migration 'users.email' matches User.email, UserResponse.email, and GET /users/{id}."""
        extractor = DependencyExtractor()
        extracted = extractor.extract_dependencies("users.email")
        deps = extracted["dependencies"]

        names = [d["name"] for d in deps]
        assert "User.email" in names
        assert "UserResponse.email" in names
        assert "GET /users/{id}" in names

    def test_deterministic_matching_name(self):
        """Migration 'users.name' matches User.name and UserResponse.name, tracing to GET /users/{id}."""
        extractor = DependencyExtractor()
        extracted = extractor.extract_dependencies("users.name")
        deps = extracted["dependencies"]

        names = [d["name"] for d in deps]
        assert "User.name" in names
        assert "UserResponse.name" in names
        assert "GET /users/{id}" in names

    def test_no_false_positive_relationships(self):
        """Querying a non-existent column produces no phantom application references."""
        extractor = DependencyExtractor()
        extracted = extractor.extract_dependencies("users.nonexistent_column_xyz")
        assert extracted["dependencies"] == []


class TestUnifiedAnalysisService:
    """Test suite for UnifiedAnalysisService orchestration layer."""

    def test_unified_service_end_to_end_drop_column(self):
        """Full pipeline with DROP COLUMN migration."""
        service = UnifiedAnalysisService()
        result = service.analyze(sql="ALTER TABLE users DROP COLUMN email;")

        assert result["migration"]["operation"] == "DROP_COLUMN"
        assert result["migration"]["table"] == "users"
        assert result["migration"]["column"] == "email"

        assert result["database_verification"]["table_exists"] is True
        assert result["database_verification"]["column_exists"] is True

        assert len(result["application_dependencies"]) == 3
        assert result["potential_impact"]["severity"] == "High"

        graph = result["graph"]
        assert graph["summary"]["total_nodes"] == 6
        assert graph["summary"]["total_edges"] == 5

    def test_unified_service_add_column(self):
        """Full pipeline with ADD COLUMN migration."""
        service = UnifiedAnalysisService()
        result = service.analyze(sql="ALTER TABLE users ADD COLUMN phone VARCHAR(20);")

        assert result["migration"]["operation"] == "ADD_COLUMN"
        assert result["migration"]["table"] == "users"
        assert result["migration"]["column"] == "phone"
        assert result["potential_impact"]["severity"] == "Low"

    def test_unified_service_with_temporary_zip(self):
        """Pipeline safely analyzes source provided via ZIP archive in memory and cleans up."""
        buf = io.BytesIO()
        with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as zf:
            zf.writestr(
                "models.py",
                "from sqlalchemy import Column, String\nclass Customer:\n    __tablename__ = 'customers'\n    email = Column(String)\n",
            )
            zf.writestr(
                "schemas.py",
                "from pydantic import BaseModel\nclass CustomerResponse(BaseModel):\n    email: str\n",
            )

        service = UnifiedAnalysisService()
        result = service.analyze(
            sql="ALTER TABLE customers DROP COLUMN email;",
            zip_bytes=buf.getvalue(),
        )

        assert result["migration"]["table"] == "customers"
        assert result["migration"]["column"] == "email"
        assert len(result["application_dependencies"]) >= 1

        graph = result["graph"]
        node_labels = [n["label"] for n in graph["nodes"]]
        assert "Customer.email" in node_labels

    @patch("dbscope.metadata.service.PostgresMetadataService.inspect_schema")
    def test_unified_service_with_mocked_db_connection(self, mock_inspect):
        """Pipeline integrates live PostgreSQL schema inspection without requiring running DB server."""
        mock_inspect.return_value = {
            "tables": [
                {
                    "name": "users",
                    "columns": [
                        {"name": "id", "data_type": "integer"},
                        {"name": "email", "data_type": "character varying"},
                    ],
                }
            ]
        }

        service = UnifiedAnalysisService()
        result = service.analyze(
            sql="ALTER TABLE users DROP COLUMN email;",
            connection_url="postgresql://testuser:testpass@localhost:5432/testdb",
        )

        assert result["is_live_db"] is True
        assert result["database_verification"]["is_live_db"] is True
        assert result["database_verification"]["table_exists"] is True
        assert result["database_verification"]["column_exists"] is True


class TestGraphAPIEndpoint:
    """Test suite for /api/dependencies/graph API endpoint."""

    def test_graph_endpoint_with_changed_object(self):
        """POST /api/dependencies/graph with changed_object."""
        res = client.post("/api/dependencies/graph", json={"changed_object": "users.email"})
        assert res.status_code == 200
        data = res.json()

        assert data["changed_object"] == "users.email"
        assert data["summary"]["total_nodes"] == 6
        assert data["summary"]["total_edges"] == 5

    def test_graph_endpoint_with_sql_migration(self):
        """POST /api/dependencies/graph with proposed SQL migration statement."""
        res = client.post(
            "/api/dependencies/graph",
            json={"sql": "ALTER TABLE users DROP COLUMN email;"},
        )
        assert res.status_code == 200
        data = res.json()

        assert data["changed_object"] == "users.email"
        assert data["summary"]["total_nodes"] == 6
        assert data["summary"]["total_edges"] == 5

    def test_graph_endpoint_with_migration_alias(self):
        """POST /api/dependencies/graph with 'migration' alias field."""
        res = client.post(
            "/api/dependencies/graph",
            json={"migration": "ALTER TABLE users DROP COLUMN email;"},
        )
        assert res.status_code == 200
        data = res.json()

        assert data["changed_object"] == "users.email"
        assert data["summary"]["total_nodes"] == 6
        assert data["summary"]["total_edges"] == 5

    def test_get_graph_endpoint(self):
        """GET /api/dependencies/graph?changed_object=users.email."""
        res = client.get("/api/dependencies/graph?changed_object=users.email")
        assert res.status_code == 200
        data = res.json()

        assert data["changed_object"] == "users.email"
        assert data["summary"]["total_nodes"] == 6
        assert data["summary"]["total_edges"] == 5

    def test_graph_endpoint_never_exposes_passwords(self):
        """Database passwords provided in request are never returned in graph response."""
        secret_pwd = "SuperSecretDbPassword#999"
        res = client.post(
            "/api/dependencies/graph",
            json={
                "changed_object": "users.email",
                "host": "localhost",
                "database": "proddb",
                "username": "dbuser",
                "password": secret_pwd,
            },
        )
        assert res.status_code == 200
        response_text = res.text
        assert secret_pwd not in response_text
