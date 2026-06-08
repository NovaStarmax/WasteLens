import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class UserCreate(BaseModel):
    username: str
    password: str
    role: str = "user"


class UserResponse(BaseModel):
    id: uuid.UUID
    username: str
    role: str
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)
