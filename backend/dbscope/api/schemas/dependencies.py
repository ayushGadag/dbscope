"""
Pydantic schemas for dependency extraction and graph generation API.
"""

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class DependencyItem(BaseModel):
    """An individual identified code dependency."""
    name: str = Field(..., description="Identifier of the dependent component (e.g. 'User.email' or 'GET /users/{id}').")
    type: str = Field(..., description="Component type: 'orm_model', 'pydantic_schema', or 'fastapi_route'.")
    file: str = Field(..., description="Source file where dependency is defined.")
    line: int = Field(..., description="Line number of definition.")
    relationship: Optional[str] = Field(None, description="Relationship description.")
    description: Optional[str] = Field(None, description="Detailed explanation of component.")


class DependencyExtractRequest(BaseModel):
    """Request payload for dependency extraction."""
    changed_object: str = Field(..., description="Target database object in 'table.column' format (e.g. 'users.email').")


class DependencyExtractResponse(BaseModel):
    """Response payload detailing affected code dependencies."""
    changed_object: str = Field(..., description="Database object analyzed.")
    dependencies: List[DependencyItem] = Field(default_factory=list, description="List of detected code dependencies.")


class GraphNode(BaseModel):
    """Node in the interactive dependency graph."""
    id: str = Field(..., description="Unique node ID (e.g. 'db:postgresql', 'table:users', 'column:users.email', 'orm:User.email').")
    label: str = Field(..., description="Display label.")
    type: str = Field(..., description="Node category type (DATABASE, TABLE, COLUMN, ORM_MODEL, PYDANTIC_SCHEMA, FASTAPI_ROUTE).")
    source: Optional[str] = Field(None, description="Origin source file or catalog.")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Metadata dictionary for the node.")
    category: Optional[str] = Field(None, description="Human-readable category.")
    relationship: Optional[str] = Field(None, description="Relationship to surrounding nodes.")
    blastRadius: Optional[str] = Field("High", description="Impact radius level (Root, High, Medium, Low).")
    accentColor: Optional[str] = Field(None, description="Color code for UI rendering.")
    x: Optional[float] = Field(None, description="X coordinate.")
    y: Optional[float] = Field(None, description="Y coordinate.")
    file: Optional[str] = Field(None, description="Source file if applicable.")
    line: Optional[int] = Field(None, description="Source line if applicable.")
    description: Optional[str] = Field(None, description="Details description.")


class GraphEdge(BaseModel):
    """Edge connecting two dependency nodes."""
    id: str = Field(..., description="Unique edge ID.")
    source: str = Field(..., description="Source node ID.")
    target: str = Field(..., description="Target node ID.")
    relationship: str = Field(..., description="Relationship description.")


class GraphSummary(BaseModel):
    """Summary metrics of the dependency graph."""
    total_nodes: int = Field(..., description="Total count of nodes in the graph.")
    total_edges: int = Field(..., description="Total count of directed edges in the graph.")


class DependencyGraphResponse(BaseModel):
    """Structured graph representation with nodes, edges, and summary metrics."""
    changed_object: str = Field(..., description="Database object analyzed.")
    nodes: List[GraphNode] = Field(default_factory=list, description="Graph nodes.")
    edges: List[GraphEdge] = Field(default_factory=list, description="Graph edges.")
    summary: Optional[GraphSummary] = Field(None, description="Graph summary count metrics.")


class DependencyGraphRequest(BaseModel):
    """
    Request payload for dependency graph generation.
    Supports either direct changed_object or migration SQL, plus optional DB config and source inputs.
    """
    changed_object: Optional[str] = Field(None, description="Target database object in 'table.column' format (e.g. 'users.email').")
    sql: Optional[str] = Field(None, description="Optional SQL migration statement (e.g. 'ALTER TABLE users DROP COLUMN email;').")
    migration: Optional[str] = Field(None, description="Alias for SQL migration statement.")
    connection_url: Optional[str] = Field(None, description="Optional PostgreSQL connection URL.")
    host: Optional[str] = Field(None, description="Host.")
    port: Optional[int] = Field(5432, description="Port.")
    database: Optional[str] = Field(None, description="Database name.")
    username: Optional[str] = Field(None, description="Username.")
    password: Optional[str] = Field(None, description="Password.")
    schema_name: Optional[str] = Field("public", description="Schema name.")
    source_type: Optional[str] = Field(None, description="Source type ('sample', 'active', 'github', 'zip').")
    github_url: Optional[str] = Field(None, description="Optional public GitHub repository URL.")


class UploadSourceZipResponse(BaseModel):
    """Response from uploading and extracting application source ZIP."""
    success: bool
    filename: str
    size: str
    files_count: int
    status: str
    message: str


class ScanGitHubRequest(BaseModel):
    """Request payload for linking/scanning a public GitHub repository."""
    url: str = Field(..., description="GitHub repository URL (e.g. https://github.com/owner/repo).")


class ScanGitHubResponse(BaseModel):
    """Response from scanning a public GitHub repository."""
    success: bool
    repo_name: str
    branch: str
    url: str
    files_count: int
    status: str
    message: str


class UnifiedAnalysisRequest(BaseModel):
    """Request for comprehensive analysis across migration, metadata, and dependencies."""
    sql: str = Field(..., description="Proposed SQL migration statement.")
    connection_url: Optional[str] = Field(None, description="Optional PostgreSQL connection URL.")
    host: Optional[str] = Field(None, description="Host.")
    port: Optional[int] = Field(5432, description="Port.")
    database: Optional[str] = Field(None, description="Database name.")
    username: Optional[str] = Field(None, description="Username.")
    password: Optional[str] = Field(None, description="Password.")
    schema_name: Optional[str] = Field("public", description="Schema name.")
    github_url: Optional[str] = Field(None, description="Optional GitHub repository URL to clone and analyze.")


class UnifiedAnalysisResponse(BaseModel):
    """Comprehensive analysis combining migration, DB verification, AST dependencies, and graph."""
    migration: Dict[str, Any]
    database_verification: Dict[str, Any]
    application_dependencies: List[DependencyItem]
    potential_impact: Dict[str, Any]
    graph: DependencyGraphResponse
    is_live_db: bool = False
