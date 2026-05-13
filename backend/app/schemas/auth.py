from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class UserRegister(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    email: str = Field(min_length=5, max_length=255)
    password: str = Field(min_length=6, max_length=100)
    departmentId: str | None = None


class UserLogin(BaseModel):
    email: str
    password: str


class UserResponse(BaseModel):
    id: UUID
    name: str
    email: str
    departmentId: str | None = None
    role: str
    createdAt: datetime

    class Config:
        from_attributes = True


class AuthResponse(BaseModel):
    accessToken: str
    tokenType: str = "bearer"
    user: UserResponse


class ForgotPasswordRequest(BaseModel):
    email: str = Field(min_length=5, max_length=255)


class ForgotPasswordResponse(BaseModel):
    message: str
    resetToken: str | None = None


class ResetPasswordRequest(BaseModel):
    email: str = Field(min_length=5, max_length=255)
    token: str = Field(min_length=8, max_length=500)
    newPassword: str = Field(min_length=6, max_length=100)