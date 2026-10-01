"""
Comprehensive tests for DBScope Impact Analysis feature.
Covers:
- A: DROP COLUMN with ORM + Pydantic + FastAPI dependencies
- B: ADD COLUMN with no application dependency
- C: ALTER COLUMN with dependencies
- D: RENAME COLUMN
- E: Multiple affected dependencies
- F: No matching dependency
- G: Invalid / incomplete input handling
- H: No-risk-assessment verification (clean architectural separation)
"""

import io
from pathlib import Path
import zipfile
import pytest
from fastapi.testclient import TestClient

from dbscope.api.main import app
from dbscope.impact.service import ImpactAnalysisService

client = TestClient(app)


class TestImpactAnalysisService:
    """Unit and integration tests for ImpactAnalysisService."""

    @pytest.fixture
    def service(self):
        """Provide ImpactAnalysisService targeting the default sample_app."""
        return ImpactAnalysisService()

    # -------------------------------------------------------------------------
    # Test A: DROP COLUMN with ORM + Pydantic + FastAPI dependencies
    # -------------------------------------------------------------------------

    def test_drop_column_full_dependency_chain_service(self, service):
        """Verify DROP COLUMN users.email identifies ORM, Pydantic, and FastAPI route dependencies."""
        sql = "ALTER TABLE users DROP COLUMN email;"
        result = service.analyze(sql=sql)

        assert result["operation"] == "DROP_COLUMN"
        assert result["table"] == "users"
        assert result["column"] == "email"
        assert result["database_object"] == "users.email"
        assert result["changed_object"] == "users.email"

        assert "users" in result["affected_tables"]
        assert "email" in result["affected_columns"]

        assert result["affected_orm_models"] == ["User.email"]
        assert result["affected_pydantic_schemas"] == ["UserResponse.email"]
        assert result["affected_fastapi_routes"] == ["GET /users/{id}"]
        assert result["dependency_count"] == 3

        expected_categories = {"DATABASE", "ORM_MODEL", "PYDANTIC_SCHEMA", "FASTAPI_ROUTE"}
        assert set(result["impact_categories"]) == expected_categories

        assert "User.email" in result["explanation"]
        assert "UserResponse.email" in result["explanation"]
        assert "GET /users/{id}" in result["explanation"]

        assert result["graph"] is not None
        assert result["graph"]["summary"]["total_nodes"] == 6
        assert result["graph"]["summary"]["total_edges"] == 5

    def test_drop_column_full_dependency_chain_api(self):
        """Verify POST /api/impact/analyze with DROP COLUMN statement returns structured impact."""
        payload = {"sql": "ALTER TABLE users DROP COLUMN email;"}
        res = client.post("/api/impact/analyze", json=payload)

        assert res.status_code == 200
        data = res.json()

        assert data["operation"] == "DROP_COLUMN"
        assert data["database_object"] == "users.email"
        assert data["affected_orm_models"] == ["User.email"]
        assert data["affected_pydantic_schemas"] == ["UserResponse.email"]
        assert data["affected_fastapi_routes"] == ["GET /users/{id}"]
        assert data["dependency_count"] == 3
        assert "DATABASE" in data["impact_categories"]
        assert "ORM_MODEL" in data["impact_categories"]
        assert "PYDANTIC_SCHEMA" in data["impact_categories"]
        assert "FASTAPI_ROUTE" in data["impact_categories"]
        assert len(data["dependencies"]) == 3

    # -------------------------------------------------------------------------
    # Test B: ADD COLUMN with no application dependency
    # -------------------------------------------------------------------------

    def test_add_column_no_dependency_service(self, service):
        """Verify ADD COLUMN with unreferenced column indicates zero application dependencies."""
        sql = "ALTER TABLE users ADD COLUMN age INTEGER;"
        result = service.analyze(sql=sql)

        assert result["operation"] == "ADD_COLUMN"
        assert result["table"] == "users"
        assert result["column"] == "age"
        assert result["database_object"] == "users.age"

        assert result["affected_tables"] == ["users"]
        assert result["affected_columns"] == ["age"]
        assert result["affected_orm_models"] == []
        assert result["affected_pydantic_schemas"] == []
        assert result["affected_fastapi_routes"] == []
        assert result["dependency_count"] == 0

        assert result["impact_categories"] == ["DATABASE"]
        assert "No application dependencies were detected" in result["explanation"]
        assert "INTEGER" in result["explanation"]
        assert result["dependencies"] == []

    def test_add_column_no_dependency_api(self):
        """Verify POST /api/impact/analyze for ADD COLUMN returns clean no-dependency report."""
        payload = {"sql": "ALTER TABLE users ADD COLUMN age INTEGER;"}
        res = client.post("/api/impact/analyze", json=payload)

        assert res.status_code == 200
        data = res.json()

        assert data["operation"] == "ADD_COLUMN"
        assert data["database_object"] == "users.age"
        assert data["dependency_count"] == 0
        assert data["affected_orm_models"] == []
        assert data["affected_pydantic_schemas"] == []
        assert data["affected_fastapi_routes"] == []
        assert data["impact_categories"] == ["DATABASE"]
        assert "No application dependencies were detected" in data["explanation"]

    # -------------------------------------------------------------------------
    # Test C: ALTER COLUMN with dependencies
    # -------------------------------------------------------------------------

    def test_alter_column_with_dependencies_service(self, service):
        """Verify ALTER COLUMN detects affected ORM models, Pydantic schemas, and routes."""
        sql = "ALTER TABLE users ALTER COLUMN email TYPE VARCHAR(100);"
        result = service.analyze(sql=sql)

        assert result["operation"] == "ALTER_COLUMN"
        assert result["table"] == "users"
        assert result["column"] == "email"
        assert result["database_object"] == "users.email"

        assert result["affected_orm_models"] == ["User.email"]
        assert result["affected_pydantic_schemas"] == ["UserResponse.email"]
        assert result["affected_fastapi_routes"] == ["GET /users/{id}"]
        assert result["dependency_count"] == 3

        expected_categories = {"DATABASE", "ORM_MODEL", "PYDANTIC_SCHEMA", "FASTAPI_ROUTE"}
        assert set(result["impact_categories"]) == expected_categories
        assert "Altering column 'email' in table 'users'" in result["explanation"]
        assert "TYPE VARCHAR(100)" in result["explanation"]

    def test_alter_column_with_dependencies_api(self):
        """Verify POST /api/impact/analyze with ALTER COLUMN clause."""
        payload = {"sql": "ALTER TABLE users ALTER COLUMN email SET DATA TYPE VARCHAR(150);"}
        res = client.post("/api/impact/analyze", json=payload)

        assert res.status_code == 200
        data = res.json()

        assert data["operation"] == "ALTER_COLUMN"
        assert data["database_object"] == "users.email"
        assert data["dependency_count"] == 3
        assert "User.email" in data["affected_orm_models"]
        assert "UserResponse.email" in data["affected_pydantic_schemas"]
        assert "GET /users/{id}" in data["affected_fastapi_routes"]

    # -------------------------------------------------------------------------
    # Test D: RENAME COLUMN
    # -------------------------------------------------------------------------

    def test_rename_column_service(self, service):
        """Verify RENAME COLUMN traces dependencies referencing the old column name."""
        sql = "ALTER TABLE users RENAME COLUMN email TO user_email;"
        result = service.analyze(sql=sql)

        assert result["operation"] == "RENAME_COLUMN"
        assert result["table"] == "users"
        assert result["column"] == "email"
        assert result["database_object"] == "users.email"

        assert "email" in result["affected_columns"]
        assert "user_email" in result["affected_columns"]

        assert result["affected_orm_models"] == ["User.email"]
        assert result["affected_pydantic_schemas"] == ["UserResponse.email"]
        assert result["affected_fastapi_routes"] == ["GET /users/{id}"]
        assert result["dependency_count"] == 3

        assert "Renaming column 'email' to 'user_email'" in result["explanation"]
        assert "User.email" in result["explanation"]

    def test_rename_column_api(self):
        """Verify POST /api/impact/analyze for RENAME COLUMN."""
        payload = {"sql": "ALTER TABLE users RENAME COLUMN email TO user_email;"}
        res = client.post("/api/impact/analyze", json=payload)

        assert res.status_code == 200
        data = res.json()

        assert data["operation"] == "RENAME_COLUMN"
        assert data["database_object"] == "users.email"
        assert "email" in data["affected_columns"]
        assert "user_email" in data["affected_columns"]
        assert data["dependency_count"] == 3
        assert data["affected_orm_models"] == ["User.email"]
        assert data["affected_pydantic_schemas"] == ["UserResponse.email"]
        assert data["affected_fastapi_routes"] == ["GET /users/{id}"]

    # -------------------------------------------------------------------------
    # Test E: Multiple affected dependencies
    # -------------------------------------------------------------------------

    def test_multiple_affected_dependencies_across_models_and_routes(self, service, tmp_path):
        """Verify handling multiple ORM models, schemas, and routes referencing one column."""
        # Create a test codebase with multiple models and routes referencing orders.status
        models_code = """
from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import declarative_base

Base = declarative_base()

class Order(Base):
    __tablename__ = "orders"
    id = Column(Integer, primary_key=True)
    status = Column(String)

class OrderArchive(Base):
    __tablename__ = "orders"
    archive_id = Column(Integer, primary_key=True)
    status = Column(String)
"""
        schemas_code = """
from pydantic import BaseModel

class OrderResponse(BaseModel):
    id: int
    status: str

class OrderSummary(BaseModel):
    order_ref: str
    status: str
"""
        routes_code = """
from fastapi import APIRouter

router = APIRouter()

@router.get("/orders/{id}", response_model=OrderResponse)
def get_order(id: int):
    pass

@router.get("/orders/summary", response_model=OrderSummary)
def get_order_summary():
    pass
"""
        (tmp_path / "models.py").write_text(models_code, encoding="utf-8")
        (tmp_path / "schemas.py").write_text(schemas_code, encoding="utf-8")
        (tmp_path / "routes.py").write_text(routes_code, encoding="utf-8")

        result = service.analyze(
            sql="ALTER TABLE orders DROP COLUMN status;",
            source_dir=tmp_path,
        )

        assert result["operation"] == "DROP_COLUMN"
        assert result["database_object"] == "orders.status"

        assert len(result["affected_orm_models"]) == 2
        assert "Order.status" in result["affected_orm_models"]
        assert "OrderArchive.status" in result["affected_orm_models"]

        assert len(result["affected_pydantic_schemas"]) == 2
        assert "OrderResponse.status" in result["affected_pydantic_schemas"]
        assert "OrderSummary.status" in result["affected_pydantic_schemas"]

        assert len(result["affected_fastapi_routes"]) == 2
        assert "GET /orders/{id}" in result["affected_fastapi_routes"]
        assert "GET /orders/summary" in result["affected_fastapi_routes"]

        assert result["dependency_count"] == 6
        assert set(result["impact_categories"]) == {"DATABASE", "ORM_MODEL", "PYDANTIC_SCHEMA", "FASTAPI_ROUTE"}

    def test_multiple_affected_dependencies_via_zip(self, service):
        """Verify pipeline handles multi-dependency codebase delivered via in-memory ZIP bytes."""
        buf = io.BytesIO()
        with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as zf:
            zf.writestr(
                "models.py",
                "from sqlalchemy import Column, String\n"
                "class Product:\n    __tablename__ = 'products'\n    sku = Column(String)\n"
                "class InventoryItem:\n    __tablename__ = 'products'\n    sku = Column(String)\n",
            )
            zf.writestr(
                "schemas.py",
                "from pydantic import BaseModel\n"
                "class ProductOut(BaseModel):\n    sku: str\n",
            )
            zf.writestr(
                "routes.py",
                "from fastapi import APIRouter\n"
                "router = APIRouter()\n"
                "@router.get('/products/{sku}', response_model=ProductOut)\n"
                "def get_prod(sku: str): pass\n",
            )

        result = service.analyze(
            sql="ALTER TABLE products DROP COLUMN sku;",
            zip_bytes=buf.getvalue(),
        )

        assert result["dependency_count"] == 4
        assert "Product.sku" in result["affected_orm_models"]
        assert "InventoryItem.sku" in result["affected_orm_models"]
        assert "ProductOut.sku" in result["affected_pydantic_schemas"]
        assert "GET /products/{sku}" in result["affected_fastapi_routes"]

    # -------------------------------------------------------------------------
    # Test F: No matching dependency
    # -------------------------------------------------------------------------

    def test_no_matching_dependency_unknown_column(self, service):
        """Verify targeting an unreferenced column returns clean 0-dependency report."""
        sql = "ALTER TABLE users DROP COLUMN internal_secret_token;"
        result = service.analyze(sql=sql)

        assert result["operation"] == "DROP_COLUMN"
        assert result["database_object"] == "users.internal_secret_token"
        assert result["affected_orm_models"] == []
        assert result["affected_pydantic_schemas"] == []
        assert result["affected_fastapi_routes"] == []
        assert result["dependency_count"] == 0
        assert result["impact_categories"] == ["DATABASE"]
        assert "No application dependencies were detected" in result["explanation"]

    def test_no_matching_dependency_unknown_table(self, service):
        """Verify targeting an unknown table returns 0 application dependencies."""
        sql = "ALTER TABLE billing_transactions DROP COLUMN transaction_ref;"
        result = service.analyze(sql=sql)

        assert result["database_object"] == "billing_transactions.transaction_ref"
        assert result["dependency_count"] == 0
        assert result["affected_orm_models"] == []
        assert result["impact_categories"] == ["DATABASE"]

    # -------------------------------------------------------------------------
    # Test G: Invalid / incomplete input handling
    # -------------------------------------------------------------------------

    def test_empty_sql_raises_error(self, service):
        """Empty SQL raises descriptive ValueError."""
        with pytest.raises(ValueError, match="empty"):
            service.analyze(sql="")

        with pytest.raises(ValueError, match="empty"):
            service.analyze(sql="   ")

    def test_unsupported_sql_raises_error(self, service):
        """Non-DDL or unsupported statements raise descriptive ValueError."""
        with pytest.raises(ValueError, match="Unsupported migration"):
            service.analyze(sql="SELECT * FROM users;")

        with pytest.raises(ValueError, match="Unsupported migration"):
            service.analyze(sql="CREATE TABLE accounts (id INTEGER);")

    def test_no_input_raises_error(self, service):
        """Omitting both sql and changed_object raises ValueError."""
        with pytest.raises(ValueError, match="Either SQL"):
            service.analyze()

    def test_invalid_changed_object_format(self, service):
        """Malformed changed_object without table.column raises ValueError."""
        with pytest.raises(ValueError, match="table.column"):
            service.analyze(changed_object="users")

        with pytest.raises(ValueError, match="table.column"):
            service.analyze(changed_object="users.")

    def test_api_empty_payload_returns_400(self):
        """POST /api/impact/analyze with empty payload returns 400 Bad Request."""
        res = client.post("/api/impact/analyze", json={})
        assert res.status_code == 400
        assert "either" in res.json()["detail"].lower()

    def test_api_empty_sql_returns_400(self):
        """POST /api/impact/analyze with empty sql returns 400 Bad Request."""
        res = client.post("/api/impact/analyze", json={"sql": ""})
        assert res.status_code == 400
        assert "empty" in res.json()["detail"].lower()

    def test_api_unsupported_sql_returns_422(self):
        """POST /api/impact/analyze with unsupported SQL returns 422 Unprocessable Entity."""
        res = client.post("/api/impact/analyze", json={"sql": "SELECT * FROM users;"})
        assert res.status_code == 422
        assert "unsupported" in res.json()["detail"].lower()

    def test_api_invalid_changed_object_returns_400(self):
        """POST /api/impact/analyze with malformed changed_object returns 400 Bad Request."""
        res = client.post("/api/impact/analyze", json={"changed_object": "invalid_no_dot"})
        assert res.status_code == 400
        assert "table.column" in res.json()["detail"].lower()

    # -------------------------------------------------------------------------
    # Test H: Architectural Separation: No Risk Assessment in Impact Analysis
    # -------------------------------------------------------------------------

    def test_no_risk_assessment_fields_present(self, service):
        """Verify Impact Analysis strictly avoids risk scoring, risk levels, and severity classifications."""
        sql = "ALTER TABLE users DROP COLUMN email;"
        result = service.analyze(sql=sql)

        # Prohibited in Impact Analysis (belongs to future Risk Assessment phase)
        assert "risk_score" not in result
        assert "risk_level" not in result
        assert "severity" not in result
        assert "risk_formula" not in result

    def test_api_no_risk_assessment_fields(self):
        """Verify HTTP API response excludes risk assessment classifications."""
        res = client.post("/api/impact/analyze", json={"sql": "ALTER TABLE users DROP COLUMN email;"})
        assert res.status_code == 200
        data = res.json()

        assert "risk_score" not in data
        assert "risk_level" not in data
        assert "severity" not in data

    # -------------------------------------------------------------------------
    # Test I: Direct Changed Object Input
    # -------------------------------------------------------------------------

    def test_analyze_with_direct_changed_object(self, service):
        """Verify analyze can be invoked with direct changed_object ('users.email')."""
        result = service.analyze(changed_object="users.email")

        assert result["database_object"] == "users.email"
        assert result["table"] == "users"
        assert result["column"] == "email"
        assert result["dependency_count"] == 3
        assert "User.email" in result["affected_orm_models"]
        assert "UserResponse.email" in result["affected_pydantic_schemas"]
        assert "GET /users/{id}" in result["affected_fastapi_routes"]

    def test_api_with_direct_changed_object(self):
        """Verify POST /api/impact/analyze accepts changed_object parameter."""
        res = client.post("/api/impact/analyze", json={"changed_object": "users.email"})
        assert res.status_code == 200
        data = res.json()

        assert data["database_object"] == "users.email"
        assert data["dependency_count"] == 3
