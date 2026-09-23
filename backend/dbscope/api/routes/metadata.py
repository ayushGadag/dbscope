"""
PostgreSQL schema metadata inspection API route.
"""

from fastapi import APIRouter, HTTPException, status

from dbscope.api.schemas.metadata import InspectSchemaRequest, SchemaMetadataResponse
from dbscope.metadata.service import PostgresMetadataService

router = APIRouter(prefix="/api/metadata", tags=["Metadata"])


@router.post(
    "/inspect",
    response_model=SchemaMetadataResponse,
    responses={
        200: {"description": "Schema metadata inspected successfully"},
        400: {"description": "Missing connection URL or invalid request"},
        503: {"description": "PostgreSQL database unreachable or driver unavailable"},
    },
)
def inspect_database_schema(request: InspectSchemaRequest):
    """
    Inspect PostgreSQL database schema in a strictly READ-ONLY manner.

    Safety:
    - Never executes migration SQL.
    - Never modifies database state (no DDL/DML).
    - Queries exclusively PostgreSQL information_schema catalogs.
    - Masks passwords in all error messages.
    """
    if not request.connection_url or not request.connection_url.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Database connection URL is required for live schema inspection.",
        )

    service = PostgresMetadataService(connection_url=request.connection_url.strip())
    try:
        schema = request.schema_name or "public"
        result = service.inspect_schema(schema_name=schema)
        return {
            "tables": result.get("tables", []),
            "schema_name": schema,
        }
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except RuntimeError as re:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(re))
