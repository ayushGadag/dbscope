"""
FastAPI route for DBScope Impact Analysis.
Provides the POST /api/impact/analyze endpoint.
"""

from fastapi import APIRouter, HTTPException, status

from dbscope.api.schemas.impact import ImpactAnalysisRequest, ImpactAnalysisResponse
from dbscope.impact.service import ImpactAnalysisService
from dbscope.migration_parser import parse_migration

router = APIRouter(prefix="/api/impact", tags=["Impact Analysis"])


@router.post(
    "/analyze",
    response_model=ImpactAnalysisResponse,
    responses={
        200: {"description": "Impact analysis completed successfully"},
        400: {"description": "Invalid input format or missing required parameters"},
        422: {"description": "Unsupported SQL migration operation"},
    },
)
def analyze_impact(request: ImpactAnalysisRequest):
    """
    Perform database change impact analysis:
    - Parses migration statement or accepts target database object.
    - Traces affected SQLAlchemy ORM models, Pydantic schemas, and FastAPI routes.
    - Generates evidence dependency graph.
    - Categorizes impacted layers and provides a human-readable explanation.

    Safety:
    - Read-only static AST inspection and metadata verification.
    - Never executes migration SQL against PostgreSQL.
    """
    sql = request.sql or request.migration
    changed_object = request.changed_object

    # Input validation
    if request.sql is not None and not request.sql.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="SQL migration statement cannot be empty.",
        )

    if request.migration is not None and not request.migration.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="SQL migration statement cannot be empty.",
        )

    if not sql and not changed_object:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Either 'sql' migration statement or 'changed_object' must be provided.",
        )

    if sql is not None:
        parsed = parse_migration(sql)
        if parsed is None:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Unsupported migration statement. DBScope currently supports ALTER TABLE <table> DROP/ADD/ALTER/RENAME COLUMN.",
            )

    service = ImpactAnalysisService()
    try:
        result = service.analyze(
            sql=sql,
            changed_object=changed_object,
            connection_url=request.connection_url,
            host=request.host,
            port=request.port,
            database=request.database,
            username=request.username,
            password=request.password,
            schema_name=request.schema_name or "public",
            github_url=request.github_url,
        )
        return result
    except ValueError as ve:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(ve),
        )
