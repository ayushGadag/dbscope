"""
PostgreSQL schema metadata inspection API route.
"""

from fastapi import APIRouter, HTTPException, status

from dbscope.api.schemas.metadata import (
    InspectSchemaRequest,
    SchemaMetadataResponse,
    TestConnectionRequest,
    TestConnectionResponse,
)
from dbscope.metadata.service import PostgresMetadataService

router = APIRouter(prefix="/api/metadata", tags=["Metadata"])


@router.post(
    "/test-connection",
    response_model=TestConnectionResponse,
    responses={
        200: {"description": "PostgreSQL connection tested successfully"},
        400: {"description": "Missing connection parameters"},
        503: {"description": "PostgreSQL unreachable or driver unavailable"},
    },
)
def test_database_connection(request: TestConnectionRequest):
    """
    Test PostgreSQL database connection in a strictly READ-ONLY manner.

    Safety:
    - Never executes migration SQL.
    - Never modifies database state (no DDL/DML).
    - Read-only transaction enforced.
    - Masks passwords in all error messages.
    - Never stores database credentials permanently.
    """
    has_url = bool(request.connection_url and request.connection_url.strip())
    has_params = bool(request.host and request.host.strip() and request.database and request.database.strip())

    if not has_url and not has_params:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Database connection parameters (host and database name, or connection URL) are required.",
        )

    service = PostgresMetadataService(
        connection_url=request.connection_url.strip() if request.connection_url else None,
        host=request.host.strip() if request.host else None,
        port=request.port or 5432,
        database=request.database.strip() if request.database else None,
        username=request.username.strip() if request.username else None,
        password=request.password,
    )

    try:
        result = service.test_connection()
        return result
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except RuntimeError as re:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(re))


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
    has_url = bool(request.connection_url and request.connection_url.strip())
    has_params = bool(request.host and request.host.strip() and request.database and request.database.strip())

    if not has_url and not has_params:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Database connection URL is required for live schema inspection.",
        )

    service = PostgresMetadataService(
        connection_url=request.connection_url.strip() if request.connection_url else None,
        host=request.host.strip() if request.host else None,
        port=request.port or 5432,
        database=request.database.strip() if request.database else None,
        username=request.username.strip() if request.username else None,
        password=request.password,
    )
    try:
        schema = request.schema_name or "public"
        result = service.inspect_schema(schema_name=schema)
        return {
            "tables": result.get("tables", []),
            "schema_name": schema,
            "schemas": result.get("schemas", [schema]),
            "total_tables": result.get("total_tables", len(result.get("tables", []))),
            "total_columns": result.get("total_columns", 0),
        }
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except RuntimeError as re:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(re))
