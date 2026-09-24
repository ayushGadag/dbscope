from typing import Optional
from fastapi import APIRouter, HTTPException, Query, status

from dbscope.analysis_service import UnifiedAnalysisService
from dbscope.api.schemas.dependencies import (
    DependencyExtractRequest,
    DependencyExtractResponse,
    DependencyGraphRequest,
    DependencyGraphResponse,
    UnifiedAnalysisRequest,
    UnifiedAnalysisResponse,
)
from dbscope.dependencies.extractor import DependencyExtractor
from dbscope.migration_parser import parse_migration
from dbscope.source.connector import get_active_source_dir

router = APIRouter(prefix="/api/dependencies", tags=["Dependencies"])


@router.post(
    "/extract",
    response_model=DependencyExtractResponse,
    responses={
        200: {"description": "Dependencies extracted successfully"},
        400: {"description": "Invalid changed_object parameter format"},
    },
)
def extract_dependencies(request: DependencyExtractRequest):
    """
    Extract application code dependencies affected by a database column change.

    Safety:
    - Pure static AST inspection.
    - Never executes or modifies application source code.
    """
    extractor = DependencyExtractor(source_dir=get_active_source_dir())
    try:
        result = extractor.extract_dependencies(request.changed_object)
        return result
    except ValueError as ve:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(ve),
        )


@router.get(
    "/graph",
    response_model=DependencyGraphResponse,
    responses={
        200: {"description": "Dependency graph returned successfully"},
        400: {"description": "Invalid changed_object parameter format"},
    },
)
@router.post(
    "/graph",
    response_model=DependencyGraphResponse,
    responses={
        200: {"description": "Dependency graph returned successfully"},
        400: {"description": "Invalid changed_object parameter format"},
    },
)
def get_dependency_graph(
    request: Optional[DependencyGraphRequest] = None,
    changed_object: Optional[str] = Query(None, description="Database object in table.column format"),
):
    """
    Generate structured graph data (nodes, edges, summary) mapping database objects
    to application code references (SQLAlchemy models, Pydantic schemas, FastAPI routes).

    Accepts:
    - Target changed_object directly (e.g. 'users.email')
    - OR proposed migration SQL (e.g. 'ALTER TABLE users DROP COLUMN email;')
    - Optional database credentials / schema configuration
    - Optional GitHub repository URL or application source configuration
    """
    service = UnifiedAnalysisService()

    # Determine target changed_object
    req_obj = request.changed_object if request else None
    req_sql = (request.sql if request else None) or (request.migration if request else None)
    github_url = request.github_url if request else None

    # Resolve from migration SQL if provided
    if req_sql and req_sql.strip():
        parsed = parse_migration(req_sql)
        if not parsed:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Unsupported migration statement. DBScope supports ALTER TABLE DROP/ADD/ALTER/RENAME COLUMN.",
            )
        tbl = parsed.get("table") or "users"
        col = parsed.get("column") or parsed.get("old_column") or parsed.get("new_column") or "email"
        target = f"{tbl}.{col}"
    else:
        target = req_obj or changed_object or "users.email"

    try:
        result = service.analyze(
            sql=req_sql,
            changed_object=target,
            connection_url=request.connection_url if request else None,
            host=request.host if request else None,
            port=request.port if request else 5432,
            database=request.database if request else None,
            username=request.username if request else None,
            password=request.password if request else None,
            schema_name=(request.schema_name if request else None) or "public",
            github_url=github_url,
        )
        return result["graph"]
    except ValueError as ve:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(ve),
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Graph generation error: {str(e)}",
        )


@router.post(
    "/unified",
    response_model=UnifiedAnalysisResponse,
    responses={
        200: {"description": "Unified analysis completed successfully"},
        400: {"description": "Invalid SQL migration or request parameters"},
        422: {"description": "Unsupported SQL migration operation"},
    },
)
def analyze_unified(request: UnifiedAnalysisRequest):
    """
    Perform unified change impact analysis:
    1. Static DDL migration parsing
    2. Read-only PostgreSQL schema verification
    3. Static Python AST dependency extraction
    4. Graph dataset generation (nodes, edges, summary)
    5. Potential impact assessment & migration recommendations
    """
    sql = request.sql
    if not sql or not sql.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="SQL migration statement cannot be empty.",
        )

    # 1. Parse migration
    parsed_migration = parse_migration(sql)
    if parsed_migration is None:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Unsupported migration operation. DBScope currently supports ALTER TABLE DROP/ADD/ALTER/RENAME COLUMN.",
        )

    service = UnifiedAnalysisService()

    try:
        analysis_result = service.analyze(
            sql=sql,
            connection_url=request.connection_url,
            host=request.host,
            port=request.port,
            database=request.database,
            username=request.username,
            password=request.password,
            schema_name=request.schema_name or "public",
            github_url=request.github_url,
        )
        return analysis_result
    except ValueError as ve:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(ve),
        )
