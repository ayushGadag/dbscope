"""
Migration analysis API routes.
"""

from fastapi import APIRouter, HTTPException, status
from fastapi.responses import JSONResponse

from dbscope.api.schemas.migration import MigrationAnalyzeRequest, MigrationAnalyzeResponse
from dbscope.migration_parser import parse_migration

router = APIRouter(prefix="/api/migrations", tags=["Migrations"])


@router.post(
    "/analyze",
    response_model=MigrationAnalyzeResponse,
    responses={
        200: {
            "description": "Migration parsed successfully",
            "content": {
                "application/json": {
                    "example": {
                        "operation": "DROP_COLUMN",
                        "table": "users",
                        "column": "email",
                    }
                }
            },
        },
        400: {"description": "Empty or whitespace-only SQL provided"},
        422: {
            "description": "SQL statement is not a supported migration operation",
            "content": {
                "application/json": {
                    "example": {
                        "operation": None,
                        "message": "Unsupported migration operation",
                    }
                }
            },
        },
    },
)
def analyze_migration(request: MigrationAnalyzeRequest):
    """
    Analyze a SQL migration statement and return its structured representation.

    Safety:
    - Never executes the SQL migration statement.
    - Operates purely through regex-based static parsing.
    """
    raw_sql = request.sql
    if not raw_sql or not raw_sql.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="SQL statement cannot be empty.",
        )

    result = parse_migration(raw_sql)
    if result is None:
        # Return 422 Unprocessable Entity with structured failure explanation
        return JSONResponse(
            status_code=422,
            content={
                "operation": None,
                "message": "Unsupported migration operation",
            },
        )

    return JSONResponse(
        status_code=status.HTTP_200_OK,
        content=result,
    )
