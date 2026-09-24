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


class ForeignKeyMetadata(BaseModel):
    """Metadata for foreign key relationships."""
    column: str = Field(..., description="Local column name.")
    foreign_table: str = Field(..., description="Referenced foreign table name.")
    foreign_column: str = Field(..., description="Referenced foreign column name.")
    constraint_name: Optional[str] = Field(None, description="Constraint name.")


class ConstraintMetadata(BaseModel):
    """Metadata for table constraints."""
    name: str = Field(..., description="Constraint name.")
    type: str = Field(..., description="Constraint type (PRIMARY KEY, FOREIGN KEY, UNIQUE, CHECK).")
    column: Optional[str] = Field(None, description="Affected column name if applicable.")


class TableMetadata(BaseModel):
    """Metadata for a database table."""
    name: str = Field(..., description="Table name.")
    columns: List[ColumnMetadata] = Field(default_factory=list, description="List of columns.")
    foreign_keys: List[ForeignKeyMetadata] = Field(default_factory=list, description="List of foreign keys.")
    constraints: List[ConstraintMetadata] = Field(default_factory=list, description="List of table constraints.")


class TestConnectionRequest(BaseModel):
    """Request payload for testing PostgreSQL connection."""
    host: Optional[str] = Field(None, description="PostgreSQL host (e.g. localhost).")
    port: Optional[int] = Field(5432, description="PostgreSQL port (default 5432).")
    database: Optional[str] = Field(None, description="Database name.")
    username: Optional[str] = Field(None, description="Username.")
    password: Optional[str] = Field(None, description="Password (never logged or stored).")
    schema_name: Optional[str] = Field("public", description="Schema name.")
    connection_url: Optional[str] = Field(None, description="Optional raw connection URL.")


class TestConnectionResponse(BaseModel):
    """Response payload for connection test result."""
    success: bool = Field(..., description="Whether the connection succeeded.")
    message: str = Field(..., description="Summary status message.")
    details: str = Field(..., description="Detailed explanation.")
    database: Optional[str] = Field(None, description="Database name connected to.")
    server_version: Optional[str] = Field(None, description="PostgreSQL server version string.")


class InspectSchemaRequest(BaseModel):
    """Request payload for schema inspection."""
    connection_url: Optional[str] = Field(
        None,
        description="PostgreSQL connection URL. If omitted, returns an error stating database connection is required.",
    )
    host: Optional[str] = Field(None, description="PostgreSQL host.")
    port: Optional[int] = Field(5432, description="PostgreSQL port.")
    database: Optional[str] = Field(None, description="Database name.")
    username: Optional[str] = Field(None, description="Username.")
    password: Optional[str] = Field(None, description="Password (never logged or stored).")
    schema_name: Optional[str] = Field(
        "public",
        description="Database schema to inspect (defaults to 'public').",
    )


class SchemaMetadataResponse(BaseModel):
    """Response containing inspected schema tables and columns."""
    tables: List[TableMetadata] = Field(default_factory=list, description="Discovered tables.")
    schema_name: str = Field("public", description="Inspected schema name.")
    schemas: List[str] = Field(default_factory=list, description="All non-system schemas in database.")
    total_tables: int = Field(0, description="Total number of tables.")
    total_columns: int = Field(0, description="Total number of columns.")
