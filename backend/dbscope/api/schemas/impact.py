"""
Pydantic schemas for DBScope Impact Analysis feature.
Defines request and structured response models for impact reports.
"""

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field

from dbscope.api.schemas.dependencies import DependencyGraphResponse, DependencyItem


class ImpactAnalysisRequest(BaseModel):
    """
    Request payload for database change impact analysis.
    Accepts raw migration SQL or direct changed_object ('table.column'),
    along with optional database connection credentials and source repository options.
    """
    sql: Optional[str] = Field(None, description="Proposed SQL migration statement (e.g. 'ALTER TABLE users DROP COLUMN email;').")
    migration: Optional[str] = Field(None, description="Alias for 'sql' parameter.")
    changed_object: Optional[str] = Field(None, description="Direct target database object in 'table.column' format (e.g. 'users.email').")
    connection_url: Optional[str] = Field(None, description="Optional PostgreSQL connection URL.")
    host: Optional[str] = Field(None, description="Optional PostgreSQL host.")
    port: Optional[int] = Field(5432, description="Optional PostgreSQL port.")
    database: Optional[str] = Field(None, description="Optional PostgreSQL database name.")
    username: Optional[str] = Field(None, description="Optional PostgreSQL username.")
    password: Optional[str] = Field(None, description="Optional PostgreSQL password.")
    schema_name: Optional[str] = Field("public", description="Database schema name to inspect.")
    github_url: Optional[str] = Field(None, description="Optional public GitHub repository URL to analyze.")


class ImpactAnalysisResponse(BaseModel):
    """
    Structured impact analysis report.
    Answers: 'What application and database components are affected by this change?'
    Identifies and categorizes all impacted components and provides a human-readable explanation.
    """
    operation: str = Field(..., description="Migration operation detected (e.g., DROP_COLUMN, ADD_COLUMN, ALTER_COLUMN, RENAME_COLUMN).")
    database_object: str = Field(..., description="Primary affected database object in 'table.column' format.")
    changed_object: str = Field(..., description="Target database object (alias for database_object for API consistency).")
    table: str = Field(..., description="Target database table name.")
    column: Optional[str] = Field(None, description="Target database column name.")
    affected_tables: List[str] = Field(default_factory=list, description="List of affected database tables.")
    affected_columns: List[str] = Field(default_factory=list, description="List of affected database columns.")
    affected_orm_models: List[str] = Field(default_factory=list, description="List of affected SQLAlchemy ORM model attributes (e.g., 'User.email').")
    affected_pydantic_schemas: List[str] = Field(default_factory=list, description="List of affected Pydantic schema fields (e.g., 'UserResponse.email').")
    affected_fastapi_routes: List[str] = Field(default_factory=list, description="List of affected FastAPI endpoint routes (e.g., 'GET /users/{id}').")
    dependency_count: int = Field(..., description="Total count of affected application code dependencies.")
    impact_categories: List[str] = Field(default_factory=list, description="Categories of impacted layers (e.g., DATABASE, ORM_MODEL, PYDANTIC_SCHEMA, FASTAPI_ROUTE).")
    explanation: str = Field(..., description="Human-readable explanation describing the impact of this change across application layers.")
    dependencies: List[DependencyItem] = Field(default_factory=list, description="Detailed list of affected dependencies with source file and line locations.")
    graph: Optional[DependencyGraphResponse] = Field(None, description="Structured dependency graph representing the impact chain.")
    migration: Optional[Dict[str, Any]] = Field(None, description="Parsed migration statement details.")
