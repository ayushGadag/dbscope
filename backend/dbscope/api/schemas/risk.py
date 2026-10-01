"""
Pydantic schemas for DBScope Risk Assessment feature.
Defines request and structured response models for risk evaluation reports.
"""

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field

from dbscope.api.schemas.impact import ImpactAnalysisResponse


class RiskAssessmentRequest(BaseModel):
    """
    Request payload for database change risk assessment.
    Accepts:
    - Pre-computed impact analysis report (for direct risk assessment without re-analysis), OR
    - Raw SQL migration statement, OR
    - Direct changed_object ('table.column'),
    along with optional database connection credentials and source repository options.
    """
    sql: Optional[str] = Field(None, description="Proposed SQL migration statement (e.g. 'ALTER TABLE users DROP COLUMN email;').")
    migration: Optional[str] = Field(None, description="Alias for 'sql' parameter.")
    changed_object: Optional[str] = Field(None, description="Direct target database object in 'table.column' format (e.g. 'users.email').")
    impact_report: Optional[Dict[str, Any]] = Field(None, description="Pre-computed Impact Analysis result to assess directly.")
    connection_url: Optional[str] = Field(None, description="Optional PostgreSQL connection URL.")
    host: Optional[str] = Field(None, description="Optional PostgreSQL host.")
    port: Optional[int] = Field(5432, description="Optional PostgreSQL port.")
    database: Optional[str] = Field(None, description="Optional PostgreSQL database name.")
    username: Optional[str] = Field(None, description="Optional PostgreSQL username.")
    password: Optional[str] = Field(None, description="Optional PostgreSQL password.")
    schema_name: Optional[str] = Field("public", description="Database schema name to inspect.")
    github_url: Optional[str] = Field(None, description="Optional public GitHub repository URL to analyze.")


class RiskAssessmentResponse(BaseModel):
    """
    Structured risk assessment report.
    Answers: 'HOW SERIOUS is the impact of this database change?'
    Provides deterministic risk score out of 10, impact and likelihood breakdown,
    categorical risk level, recommended action, and transparent explainability reasons.
    """
    risk_score: float = Field(..., description="Overall calculated risk score on a 0.0 to 10.0 scale.")
    impact_score: int = Field(..., description="Deterministic Impact rating on a 1 to 5 scale.")
    likelihood_score: int = Field(..., description="Deterministic Likelihood rating on a 1 to 5 scale.")
    risk_level: str = Field(..., description="Risk category: LOW (0.0–2.9), MEDIUM (3.0–5.9), HIGH (6.0–7.9), CRITICAL (8.0–10.0).")
    recommended_action: str = Field(..., description="Recommended workflow action: ALLOW (for LOW) or REVIEW (for MEDIUM, HIGH, CRITICAL).")
    affected_components: List[str] = Field(default_factory=list, description="Aggregated affected application components across ORM, schemas, and routes.")
    affected_layers: List[str] = Field(default_factory=list, description="Affected system layers (e.g. DATABASE, ORM_MODEL, PYDANTIC_SCHEMA, FASTAPI_ROUTE).")
    reasons: List[str] = Field(default_factory=list, description="Evidence-grounded explanatory justifications for the assigned scores.")
    operation: str = Field(..., description="Migration operation detected.")
    database_object: str = Field(..., description="Primary affected database object ('table.column').")
    table: str = Field(..., description="Target database table name.")
    column: Optional[str] = Field(None, description="Target database column name.")
    dependency_count: int = Field(..., description="Total count of affected application code dependencies.")
    impact_factors: List[str] = Field(default_factory=list, description="Specific deterministic factors driving the Impact score.")
    likelihood_factors: List[str] = Field(default_factory=list, description="Specific deterministic factors driving the Likelihood score.")
    limitations: List[str] = Field(default_factory=list, description="Documented boundary limitations of the risk evaluation.")
    impact_analysis: Optional[Dict[str, Any]] = Field(None, description="Underlying Impact Analysis result for complete traceability.")
