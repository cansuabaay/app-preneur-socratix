from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class UserRegister(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    email: str = Field(min_length=5, max_length=255)
    password: str = Field(min_length=6, max_length=100)
    departmentId: str | None = None
    jobTitle: str | None = Field(default=None, max_length=120)


class UserLogin(BaseModel):
    email: str
    password: str


class UserProfileUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=120)
    departmentId: str | None = Field(default=None, max_length=100)
    jobTitle: str | None = Field(default=None, max_length=120)
    bio: str | None = Field(default=None, max_length=2000)


class UserResponse(BaseModel):
    id: UUID
    name: str
    email: str
    departmentId: str | None = None
    jobTitle: str | None = None
    innovationRole: str
    avatarUrl: str | None = None
    bio: str | None = None
    role: str
    createdAt: datetime

    class Config:
        from_attributes = True


class AuthResponse(BaseModel):
    accessToken: str
    tokenType: str = "bearer"
    user: UserResponse