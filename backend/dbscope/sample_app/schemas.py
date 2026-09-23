"""
Sample Pydantic schemas for serialization and request/response models.
"""

from pydantic import BaseModel


class UserResponse(BaseModel):
    """Pydantic schema representing serialized user response."""
    id: int
    name: str
    email: str
