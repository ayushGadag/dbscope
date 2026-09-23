"""
Pydantic schemas for PostgreSQL schema inspection API.
"""

from typing import List, Optional
from pydantic import BaseModel, Field


class ColumnMetadata(BaseModel):
    """Metadata for an individual table column."""
    name: str = Field(..., description="Column name.")
    data_type: str = Field(..., description="Data type of the column.")
    is_nullable: bool = Field(True, description="Whether the column accepts null values.")
    is_primary_key: bool = Field(False, description="Whether the column is a primary key.")


class TableMetadata(BaseModel):
    """Metadata for a database table."""
    name: str = Field(..., description="Table name.")
    columns: List[ColumnMetadata] = Field(default_factory=list, description="List of columns.")


class InspectSchemaRequest(BaseModel):
    """Request payload for schema inspection."""
    connection_url: Optional[str] = Field(
        None,
        description="PostgreSQL connection URL. If omitted, returns an error stating database connection is required.",
    )
    schema_name: Optional[str] = Field(
        "public",
        description="Database schema to inspect (defaults to 'public').",
    )


class SchemaMetadataResponse(BaseModel):
    """Response containing inspected schema tables and columns."""
    tables: List[TableMetadata] = Field(default_factory=list, description="Discovered tables.")
    schema_name: str = Field("public", description="Inspected schema name.")
