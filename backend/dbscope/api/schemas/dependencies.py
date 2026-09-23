"""
Pydantic schemas for dependency extraction API.
"""

from typing import List
from pydantic import BaseModel, Field


class DependencyItem(BaseModel):
    """An individual identified code dependency."""
    name: str = Field(..., description="Identifier of the dependent component (e.g. 'User.email' or 'GET /users/{id}').")
    type: str = Field(..., description="Component type: 'orm_model', 'pydantic_schema', or 'fastapi_route'.")
    file: str = Field(..., description="Source file where dependency is defined.")
    line: int = Field(..., description="Line number of definition.")


class DependencyExtractRequest(BaseModel):
    """Request payload for dependency extraction."""
    changed_object: str = Field(..., description="Target database object in 'table.column' format (e.g. 'users.email').")


class DependencyExtractResponse(BaseModel):
    """Response payload detailing affected code dependencies."""
    changed_object: str = Field(..., description="Database object analyzed.")
    dependencies: List[DependencyItem] = Field(default_factory=list, description="List of detected code dependencies.")
