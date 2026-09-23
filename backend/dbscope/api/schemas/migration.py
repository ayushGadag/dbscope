"""
Pydantic schemas for migration analysis endpoints.
"""

from typing import Optional
from pydantic import BaseModel, Field


class MigrationAnalyzeRequest(BaseModel):
    """Request payload for migration statement analysis."""
    sql: str = Field(..., description="Raw SQL migration statement to analyze.")


class MigrationAnalyzeResponse(BaseModel):
    """Structured response detailing the detected database change operation."""
    operation: Optional[str] = Field(None, description="Type of operation detected, e.g. DROP_COLUMN.")
    table: Optional[str] = Field(None, description="Target database table name.")
    column: Optional[str] = Field(None, description="Target column name.")
    data_type: Optional[str] = Field(None, description="Data type specified in ADD COLUMN.")
    clause: Optional[str] = Field(None, description="Clause specified in ALTER COLUMN.")
    new_type: Optional[str] = Field(None, description="Target data type extracted from ALTER COLUMN clause.")
    old_column: Optional[str] = Field(None, description="Original column name in RENAME COLUMN.")
    new_column: Optional[str] = Field(None, description="Renamed column name in RENAME COLUMN.")
    message: Optional[str] = Field(None, description="Status or error message when migration is unsupported.")
