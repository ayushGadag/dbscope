"""
Dependency extraction API route.
"""

from fastapi import APIRouter, HTTPException, status

from dbscope.api.schemas.dependencies import (
    DependencyExtractRequest,
    DependencyExtractResponse,
)
from dbscope.dependencies.extractor import DependencyExtractor

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
    extractor = DependencyExtractor()
    try:
        result = extractor.extract_dependencies(request.changed_object)
        return result
    except ValueError as ve:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(ve),
        )
