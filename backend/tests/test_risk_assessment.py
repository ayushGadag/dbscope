"""
Comprehensive tests for DBScope Risk Assessment feature.
Covers:
1. DROP COLUMN with multiple dependencies (User.email, UserResponse.email, GET /users/{id})
2. DROP COLUMN with no dependencies
3. ADD COLUMN with no application dependency
4. ADD COLUMN with dependencies
5. ALTER COLUMN with dependencies
6. RENAME COLUMN (with dependencies and without dependencies)
7. Different dependency counts (0, 1, 2, 3, 5, 6+)
8. Different numbers of affected application layers (1, 2, 3, 4 layers)
9. Risk score calculation precision and math formula ((Impact * Likelihood) / 2.5)
10. Risk level threshold boundaries (0.0, 2.9, 3.0, 5.9, 6.0, 7.9, 8.0, 10.0)
11. Recommended action rules (LOW -> ALLOW; MEDIUM/HIGH/CRITICAL -> REVIEW)
12. No / invalid impact information and error handling
13. Direct pre-computed impact report assessment (no re-analysis needed)
14. Explainability verification: reasons, impact_factors, likelihood_factors, limitations
15. Architectural safety: migration SQL is analysis-only and never executed
"""

import pytest
from fastapi.testclient import TestClient

from dbscope.api.main import app
from dbscope.risk.service import (
    DEFAULT_RISK_THRESHOLDS,
    RecommendedAction,
    RiskAssessmentService,
    RiskLevel,
)

client = TestClient(app)


class TestRiskAssessmentService:
    """Unit and integration tests for RiskAssessmentService."""

    @pytest.fixture
    def service(self):
        """Provide RiskAssessmentService with default configuration."""
        return RiskAssessmentService()

    # -------------------------------------------------------------------------
    # 1. DROP COLUMN with multiple dependencies
    # -------------------------------------------------------------------------

    def test_drop_column_with_multiple_dependencies_service(self, service):
        """Verify DROP users.email with 3 dependencies yields Critical risk (8.0/10)."""
        sql = "ALTER TABLE users DROP COLUMN email;"
        result = service.analyze(sql=sql)

        assert result["operation"] == "DROP_COLUMN"
        assert result["database_object"] == "users.email"
        assert result["table"] == "users"
        assert result["column"] == "email"
        assert result["dependency_count"] == 3

        # Deterministic scoring:
        # Base Impact 3 + Layer Mod (+1 for 4 layers) + Blast Radius (+1 for 3 deps) = 5
        # Base Likelihood 3 (for 3 deps) + Route Exposure (+1) = 4
        # Risk Score = (5 * 4) / 2.5 = 8.0
        assert result["impact_score"] == 5
        assert result["likelihood_score"] == 4
        assert result["risk_score"] == 8.0
        assert result["risk_level"] == RiskLevel.CRITICAL.value
        assert result["recommended_action"] == RecommendedAction.REVIEW.value

        # Affected components and layers
        assert "User.email" in result["affected_components"]
        assert "UserResponse.email" in result["affected_components"]
        assert "GET /users/{id}" in result["affected_components"]
        assert "DATABASE" in result["affected_layers"]
        assert "FASTAPI_ROUTE" in result["affected_layers"]

        # Explainability
        assert any("Destructive operation" in r for r in result["reasons"])
        assert any("3 application component" in r for r in result["reasons"])
        assert any("Direct API exposure" in r for r in result["reasons"])
        assert any("8.0/10" in r for r in result["reasons"])
        assert len(result["limitations"]) > 0

    def test_drop_column_with_multiple_dependencies_api(self):
        """Verify POST /api/risk/analyze for DROP COLUMN with multiple dependencies."""
        res = client.post("/api/risk/analyze", json={"sql": "ALTER TABLE users DROP COLUMN email;"})
        assert res.status_code == 200
        data = res.json()

        assert data["risk_score"] == 8.0
        assert data["impact_score"] == 5
        assert data["likelihood_score"] == 4
        assert data["risk_level"] == "CRITICAL"
        assert data["recommended_action"] == "REVIEW"
        assert len(data["affected_components"]) == 3
        assert len(data["reasons"]) >= 4

    # -------------------------------------------------------------------------
    # 2. DROP COLUMN with no dependencies
    # -------------------------------------------------------------------------

    def test_drop_column_with_no_dependencies_service(self, service):
        """Verify DROP unreferenced column yields Low risk (0.8/10, ALLOW)."""
        sql = "ALTER TABLE users DROP COLUMN unreferenced_field;"
        result = service.analyze(sql=sql)

        assert result["operation"] == "DROP_COLUMN"
        assert result["dependency_count"] == 0
        assert result["affected_components"] == []

        # Impact = 2 (base 2 for drop with 0 deps)
        # Likelihood = 1 (0 deps)
        # Score = (2 * 1) / 2.5 = 0.8
        assert result["impact_score"] == 2
        assert result["likelihood_score"] == 1
        assert result["risk_score"] == 0.8
        assert result["risk_level"] == RiskLevel.LOW.value
        assert result["recommended_action"] == RecommendedAction.ALLOW.value

        assert any("no application code references" in r for r in result["reasons"])

    def test_drop_column_with_no_dependencies_api(self):
        """Verify POST /api/risk/analyze for DROP COLUMN without dependencies."""
        res = client.post("/api/risk/analyze", json={"sql": "ALTER TABLE users DROP COLUMN unreferenced_field;"})
        assert res.status_code == 200
        data = res.json()

        assert data["risk_score"] == 0.8
        assert data["impact_score"] == 2
        assert data["likelihood_score"] == 1
        assert data["risk_level"] == "LOW"
        assert data["recommended_action"] == "ALLOW"

    # -------------------------------------------------------------------------
    # 3. ADD COLUMN with no application dependency
    # -------------------------------------------------------------------------

    def test_add_column_no_dependency_service(self, service):
        """Verify ADD COLUMN with 0 dependencies yields minimal Low risk (0.4/10, ALLOW)."""
        sql = "ALTER TABLE users ADD COLUMN age INTEGER;"
        result = service.analyze(sql=sql)

        assert result["operation"] == "ADD_COLUMN"
        assert result["dependency_count"] == 0
        assert result["affected_components"] == []

        # Impact = 1 (base 1 for add with 0 deps)
        # Likelihood = 1 (0 deps)
        # Score = (1 * 1) / 2.5 = 0.4
        assert result["impact_score"] == 1
        assert result["likelihood_score"] == 1
        assert result["risk_score"] == 0.4
        assert result["risk_level"] == RiskLevel.LOW.value
        assert result["recommended_action"] == RecommendedAction.ALLOW.value

        assert any("Non-destructive operation" in r for r in result["reasons"])

    def test_add_column_no_dependency_api(self):
        """Verify POST /api/risk/analyze for ADD COLUMN without dependencies."""
        res = client.post("/api/risk/analyze", json={"sql": "ALTER TABLE users ADD COLUMN age INTEGER;"})
        assert res.status_code == 200
        data = res.json()

        assert data["risk_score"] == 0.4
        assert data["impact_score"] == 1
        assert data["likelihood_score"] == 1
        assert data["risk_level"] == "LOW"
        assert data["recommended_action"] == "ALLOW"

    # -------------------------------------------------------------------------
    # 4. ADD COLUMN with dependencies
    # -------------------------------------------------------------------------

    def test_add_column_with_dependencies(self, service):
        """Verify ADD COLUMN touching existing application components."""
        impact_report = {
            "operation": "ADD_COLUMN",
            "database_object": "users.email",
            "table": "users",
            "column": "email",
            "dependency_count": 3,
            "affected_orm_models": ["User.email"],
            "affected_pydantic_schemas": ["UserResponse.email"],
            "affected_fastapi_routes": ["GET /users/{id}"],
            "impact_categories": ["DATABASE", "ORM_MODEL", "PYDANTIC_SCHEMA", "FASTAPI_ROUTE"],
        }
        result = service.assess_risk(impact_report)

        # Base Impact 2 + Layer Mod 1 + Blast Radius 1 = 4
        # Base Likelihood 3 + Route Mod 1 = 4
        # Score = (4 * 4) / 2.5 = 6.4 (HIGH)
        assert result["impact_score"] == 4
        assert result["likelihood_score"] == 4
        assert result["risk_score"] == 6.4
        assert result["risk_level"] == "HIGH"
        assert result["recommended_action"] == "REVIEW"

    # -------------------------------------------------------------------------
    # 5. ALTER COLUMN with dependencies
    # -------------------------------------------------------------------------

    def test_alter_column_with_dependencies_service(self, service):
        """Verify ALTER COLUMN with 3 dependencies yields High risk (6.4/10, REVIEW)."""
        sql = "ALTER TABLE users ALTER COLUMN email TYPE VARCHAR(100);"
        result = service.analyze(sql=sql)

        assert result["operation"] == "ALTER_COLUMN"
        assert result["dependency_count"] == 3

        # Base Impact 2 + Layer Mod 1 + Blast Radius 1 = 4
        # Base Likelihood 3 + Route Mod 1 = 4
        # Score = (4 * 4) / 2.5 = 6.4
        assert result["impact_score"] == 4
        assert result["likelihood_score"] == 4
        assert result["risk_score"] == 6.4
        assert result["risk_level"] == RiskLevel.HIGH.value
        assert result["recommended_action"] == RecommendedAction.REVIEW.value

        assert any("Schema modification" in r for r in result["reasons"])

    def test_alter_column_with_dependencies_api(self):
        """Verify POST /api/risk/analyze for ALTER COLUMN with dependencies."""
        res = client.post(
            "/api/risk/analyze",
            json={"sql": "ALTER TABLE users ALTER COLUMN email TYPE VARCHAR(100);"},
        )
        assert res.status_code == 200
        data = res.json()

        assert data["risk_score"] == 6.4
        assert data["impact_score"] == 4
        assert data["likelihood_score"] == 4
        assert data["risk_level"] == "HIGH"
        assert data["recommended_action"] == "REVIEW"

    # -------------------------------------------------------------------------
    # 6. RENAME COLUMN
    # -------------------------------------------------------------------------

    def test_rename_column_with_dependencies_service(self, service):
        """Verify RENAME COLUMN with dependencies yields Critical risk (8.0/10, REVIEW)."""
        sql = "ALTER TABLE users RENAME COLUMN email TO user_email;"
        result = service.analyze(sql=sql)

        assert result["operation"] == "RENAME_COLUMN"
        assert result["dependency_count"] == 3

        # Base Impact 3 + Layer Mod 1 + Blast Radius 1 = 5
        # Base Likelihood 3 + Route Mod 1 = 4
        # Score = (5 * 4) / 2.5 = 8.0
        assert result["impact_score"] == 5
        assert result["likelihood_score"] == 4
        assert result["risk_score"] == 8.0
        assert result["risk_level"] == RiskLevel.CRITICAL.value
        assert result["recommended_action"] == RecommendedAction.REVIEW.value

        assert any("Identifier modification" in r for r in result["reasons"])

    def test_rename_column_without_dependencies(self, service):
        """Verify RENAME COLUMN with 0 dependencies yields Low risk (0.8/10, ALLOW)."""
        impact_report = {
            "operation": "RENAME_COLUMN",
            "database_object": "users.old_unused",
            "table": "users",
            "column": "old_unused",
            "dependency_count": 0,
            "affected_orm_models": [],
            "affected_pydantic_schemas": [],
            "affected_fastapi_routes": [],
            "impact_categories": ["DATABASE"],
        }
        result = service.assess_risk(impact_report)

        # Base Impact 2, Likelihood 1 -> Score = 0.8
        assert result["impact_score"] == 2
        assert result["likelihood_score"] == 1
        assert result["risk_score"] == 0.8
        assert result["risk_level"] == "LOW"
        assert result["recommended_action"] == "ALLOW"

    # -------------------------------------------------------------------------
    # 7. Different dependency counts
    # -------------------------------------------------------------------------

    def test_dependency_count_zero(self, service):
        """0 dependencies -> Likelihood 1."""
        report = {
            "operation": "DROP_COLUMN",
            "database_object": "orders.col",
            "table": "orders",
            "dependency_count": 0,
            "impact_categories": ["DATABASE"],
        }
        res = service.assess_risk(report)
        assert res["likelihood_score"] == 1
        assert res["risk_score"] == 0.8
        assert res["risk_level"] == "LOW"

    def test_dependency_count_one_no_routes(self, service):
        """1 dependency (e.g. ORM only, no routes) -> Likelihood 2, Impact 3."""
        report = {
            "operation": "DROP_COLUMN",
            "database_object": "orders.ref",
            "table": "orders",
            "column": "ref",
            "dependency_count": 1,
            "affected_orm_models": ["Order.ref"],
            "impact_categories": ["DATABASE", "ORM_MODEL"],
        }
        res = service.assess_risk(report)
        # Impact: Base 3 + 0 + 0 = 3
        # Likelihood: Base 2 + 0 = 2
        # Score = (3 * 2) / 2.5 = 2.4 (LOW)
        assert res["impact_score"] == 3
        assert res["likelihood_score"] == 2
        assert res["risk_score"] == 2.4
        assert res["risk_level"] == "LOW"
        assert res["recommended_action"] == "ALLOW"

    def test_dependency_count_two_no_routes(self, service):
        """2 dependencies (ORM + Schema, no routes) -> Likelihood 3, Impact 3."""
        report = {
            "operation": "DROP_COLUMN",
            "database_object": "orders.code",
            "table": "orders",
            "column": "code",
            "dependency_count": 2,
            "affected_orm_models": ["Order.code"],
            "affected_pydantic_schemas": ["OrderOut.code"],
            "impact_categories": ["DATABASE", "ORM_MODEL", "PYDANTIC_SCHEMA"],
        }
        res = service.assess_risk(report)
        # Impact: Base 3 + 0 + 0 = 3
        # Likelihood: Base 3 + 0 = 3
        # Score = (3 * 3) / 2.5 = 3.6 (MEDIUM)
        assert res["impact_score"] == 3
        assert res["likelihood_score"] == 3
        assert res["risk_score"] == 3.6
        assert res["risk_level"] == "MEDIUM"
        assert res["recommended_action"] == "REVIEW"

    def test_dependency_count_six_plus(self, service):
        """6+ dependencies -> Blast Radius +2 (clamped to 5), Likelihood 5 -> 10.0 (CRITICAL)."""
        report = {
            "operation": "DROP_COLUMN",
            "database_object": "orders.status",
            "table": "orders",
            "column": "status",
            "dependency_count": 6,
            "affected_orm_models": ["Order.status", "OrderArchive.status"],
            "affected_pydantic_schemas": ["OrderResponse.status", "OrderSummary.status"],
            "affected_fastapi_routes": ["GET /orders/{id}", "GET /orders/summary"],
            "impact_categories": ["DATABASE", "ORM_MODEL", "PYDANTIC_SCHEMA", "FASTAPI_ROUTE"],
        }
        res = service.assess_risk(report)
        # Impact: Base 3 + Layer Mod 1 + Blast Radius 2 = 6 -> clamped to 5
        # Likelihood: Base 5 + Route Mod 1 = 6 -> clamped to 5
        # Score = (5 * 5) / 2.5 = 10.0 (Max CRITICAL)
        assert res["impact_score"] == 5
        assert res["likelihood_score"] == 5
        assert res["risk_score"] == 10.0
        assert res["risk_level"] == "CRITICAL"
        assert res["recommended_action"] == "REVIEW"

    # -------------------------------------------------------------------------
    # 8. Different numbers of affected application layers
    # -------------------------------------------------------------------------

    def test_layer_spread_one_layer(self, service):
        """Only DATABASE layer affected."""
        report = {
            "operation": "ALTER_COLUMN",
            "database_object": "users.notes",
            "table": "users",
            "dependency_count": 0,
            "impact_categories": ["DATABASE"],
        }
        res = service.assess_risk(report)
        assert len(res["affected_layers"]) == 1
        assert res["impact_score"] == 1
        assert res["likelihood_score"] == 1
        assert res["risk_score"] == 0.4

    def test_layer_spread_four_layers(self, service):
        """All 4 layers affected triggers layer modifier (+1 Impact)."""
        report = {
            "operation": "ALTER_COLUMN",
            "database_object": "users.email",
            "table": "users",
            "column": "email",
            "dependency_count": 3,
            "affected_orm_models": ["User.email"],
            "affected_pydantic_schemas": ["UserResponse.email"],
            "affected_fastapi_routes": ["GET /users/{id}"],
            "impact_categories": ["DATABASE", "ORM_MODEL", "PYDANTIC_SCHEMA", "FASTAPI_ROUTE"],
        }
        res = service.assess_risk(report)
        assert len(res["affected_layers"]) == 4
        # Base 2 + 1 (layers) + 1 (blast radius 3) = 4
        assert res["impact_score"] == 4
        assert res["likelihood_score"] == 4
        assert res["risk_score"] == 6.4

    # -------------------------------------------------------------------------
    # 9. Risk score calculation precision and math formula
    # -------------------------------------------------------------------------

    @pytest.mark.parametrize(
        "impact,likelihood,expected_score",
        [
            (1, 1, 0.4),
            (1, 2, 0.8),
            (2, 1, 0.8),
            (2, 2, 1.6),
            (3, 1, 1.2),
            (3, 2, 2.4),
            (3, 3, 3.6),
            (4, 2, 3.2),
            (4, 3, 4.8),
            (4, 4, 6.4),
            (5, 1, 2.0),
            (5, 2, 4.0),
            (5, 3, 6.0),
            (5, 4, 8.0),
            (5, 5, 10.0),
        ],
    )
    def test_risk_score_formula_precision(self, impact, likelihood, expected_score):
        """Verify (Impact * Likelihood) / 2.5 rounded to 1 decimal place."""
        computed = round((impact * likelihood) / 2.5, 1)
        assert computed == expected_score

    # -------------------------------------------------------------------------
    # 10. Risk level threshold boundaries
    # -------------------------------------------------------------------------

    @pytest.mark.parametrize(
        "score,expected_level,expected_action",
        [
            (0.0, RiskLevel.LOW, RecommendedAction.ALLOW),
            (1.5, RiskLevel.LOW, RecommendedAction.ALLOW),
            (2.9, RiskLevel.LOW, RecommendedAction.ALLOW),  # Upper bound of LOW
            (3.0, RiskLevel.MEDIUM, RecommendedAction.REVIEW),  # Lower bound of MEDIUM
            (4.5, RiskLevel.MEDIUM, RecommendedAction.REVIEW),
            (5.9, RiskLevel.MEDIUM, RecommendedAction.REVIEW),  # Upper bound of MEDIUM
            (6.0, RiskLevel.HIGH, RecommendedAction.REVIEW),  # Lower bound of HIGH
            (7.0, RiskLevel.HIGH, RecommendedAction.REVIEW),
            (7.9, RiskLevel.HIGH, RecommendedAction.REVIEW),  # Upper bound of HIGH
            (8.0, RiskLevel.CRITICAL, RecommendedAction.REVIEW),  # Lower bound of CRITICAL
            (9.5, RiskLevel.CRITICAL, RecommendedAction.REVIEW),
            (10.0, RiskLevel.CRITICAL, RecommendedAction.REVIEW),  # Upper bound of CRITICAL
        ],
    )
    def test_threshold_boundaries(self, service, score, expected_level, expected_action):
        """Verify centralized threshold mapping across all boundary conditions."""
        level, action = service.determine_risk_level_and_action(score)
        assert level == expected_level
        assert action == expected_action

    # -------------------------------------------------------------------------
    # 11. Recommended action rules
    # -------------------------------------------------------------------------

    def test_recommended_action_allow_only_for_low(self, service):
        """Ensure ALLOW is only recommended for LOW risk level; all others require REVIEW."""
        assert service.determine_risk_level_and_action(0.4)[1] == RecommendedAction.ALLOW
        assert service.determine_risk_level_and_action(2.9)[1] == RecommendedAction.ALLOW
        assert service.determine_risk_level_and_action(3.0)[1] == RecommendedAction.REVIEW
        assert service.determine_risk_level_and_action(6.0)[1] == RecommendedAction.REVIEW
        assert service.determine_risk_level_and_action(8.0)[1] == RecommendedAction.REVIEW

    # -------------------------------------------------------------------------
    # 12. No / invalid impact information and error handling
    # -------------------------------------------------------------------------

    def test_invalid_impact_report_non_dict(self, service):
        """Non-dictionary input raises ValueError."""
        with pytest.raises(ValueError, match="non-empty dictionary"):
            service.assess_risk("not_a_dict")  # type: ignore

        with pytest.raises(ValueError, match="non-empty dictionary"):
            service.assess_risk(None)  # type: ignore

    def test_invalid_impact_report_empty_dict(self, service):
        """Empty dictionary raises ValueError."""
        with pytest.raises(ValueError, match="non-empty dictionary"):
            service.assess_risk({})

    def test_invalid_impact_report_missing_operation(self, service):
        """Missing operation raises ValueError."""
        with pytest.raises(ValueError, match="missing required fields"):
            service.assess_risk({"database_object": "users.email"})

    def test_invalid_impact_report_missing_database_object(self, service):
        """Missing database_object raises ValueError."""
        with pytest.raises(ValueError, match="missing required fields"):
            service.assess_risk({"operation": "DROP_COLUMN"})

    def test_api_empty_payload_returns_400(self):
        """POST /api/risk/analyze with empty JSON payload returns 400 Bad Request."""
        res = client.post("/api/risk/analyze", json={})
        assert res.status_code == 400
        assert "either" in res.json()["detail"].lower()

    def test_api_empty_sql_returns_400(self):
        """POST /api/risk/analyze with empty sql returns 400 Bad Request."""
        res = client.post("/api/risk/analyze", json={"sql": "   "})
        assert res.status_code == 400
        assert "empty" in res.json()["detail"].lower()

    def test_api_unsupported_sql_returns_422(self):
        """POST /api/risk/analyze with unsupported SQL statement returns 422 Unprocessable Entity."""
        res = client.post("/api/risk/analyze", json={"sql": "CREATE TABLE test (id INT);"})
        assert res.status_code == 422
        assert "unsupported" in res.json()["detail"].lower()

    def test_api_invalid_impact_report_returns_400(self):
        """POST /api/risk/analyze with malformed impact_report returns 400 Bad Request."""
        res = client.post("/api/risk/analyze", json={"impact_report": {"invalid_field": 123}})
        assert res.status_code == 400
        assert "missing required fields" in res.json()["detail"].lower()

    # -------------------------------------------------------------------------
    # 13. Direct pre-computed impact report assessment
    # -------------------------------------------------------------------------

    def test_api_with_direct_impact_report(self):
        """POST /api/risk/analyze accepts pre-computed impact report without re-analysis."""
        report = {
            "operation": "DROP_COLUMN",
            "database_object": "users.email",
            "table": "users",
            "column": "email",
            "dependency_count": 3,
            "affected_orm_models": ["User.email"],
            "affected_pydantic_schemas": ["UserResponse.email"],
            "affected_fastapi_routes": ["GET /users/{id}"],
            "impact_categories": ["DATABASE", "ORM_MODEL", "PYDANTIC_SCHEMA", "FASTAPI_ROUTE"],
        }
        res = client.post("/api/risk/analyze", json={"impact_report": report})
        assert res.status_code == 200
        data = res.json()

        assert data["risk_score"] == 8.0
        assert data["risk_level"] == "CRITICAL"
        assert data["recommended_action"] == "REVIEW"
        assert data["affected_components"] == [
            "User.email",
            "UserResponse.email",
            "GET /users/{id}",
        ]

    # -------------------------------------------------------------------------
    # 14. Direct Changed Object Input
    # -------------------------------------------------------------------------

    def test_service_with_direct_changed_object(self, service):
        """Verify analyze can be invoked with changed_object directly."""
        result = service.analyze(changed_object="users.email")
        assert result["risk_score"] == 8.0
        assert result["risk_level"] == "CRITICAL"
        assert result["recommended_action"] == "REVIEW"

    def test_api_with_direct_changed_object(self):
        """Verify POST /api/risk/analyze with changed_object."""
        res = client.post("/api/risk/analyze", json={"changed_object": "users.email"})
        assert res.status_code == 200
        data = res.json()
        assert data["risk_score"] == 8.0
        assert data["risk_level"] == "CRITICAL"

    # -------------------------------------------------------------------------
    # 15. Custom Threshold Configuration
    # -------------------------------------------------------------------------

    def test_custom_thresholds_configuration(self):
        """Verify service allows customizing risk level thresholds."""
        custom_thresholds = [
            (5.0, RiskLevel.LOW, RecommendedAction.ALLOW),
            (10.0, RiskLevel.HIGH, RecommendedAction.REVIEW),
        ]
        custom_service = RiskAssessmentService(thresholds=custom_thresholds)
        level, action = custom_service.determine_risk_level_and_action(4.0)
        assert level == RiskLevel.LOW
        assert action == RecommendedAction.ALLOW
