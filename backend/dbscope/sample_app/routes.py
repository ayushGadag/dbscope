"""
Sample FastAPI routes consuming Pydantic schemas and ORM models.
"""

from fastapi import APIRouter
from dbscope.sample_app.schemas import UserResponse

router = APIRouter()


@router.get("/users/{id}", response_model=UserResponse)
def get_user(id: int):
    """Retrieve user details by ID."""
    return {"id": id, "name": "Alice", "email": "alice@example.com"}
