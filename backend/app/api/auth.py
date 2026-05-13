from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.encoders import jsonable_encoder
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.config import PASSWORD_RESET_EXPOSE_TOKEN
from app.database import get_db
from app.models.user import User
from app.schemas.auth import (
    AuthResponse,
    ForgotPasswordRequest,
    ForgotPasswordResponse,
    ResetPasswordRequest,
    UserLogin,
    UserRegister,
    UserResponse,
)
from app.services.auth_service import auth_service, get_current_user

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=AuthResponse, status_code=201)
def register(payload: UserRegister, db: Session = Depends(get_db)):
    user = auth_service.register(db, payload)
    token = auth_service.create_access_token(user)

    return {
        "accessToken": token,
        "tokenType": "bearer",
        "user": user,
    }


@router.post("/login")
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    payload = UserLogin(
        email=form_data.username,
        password=form_data.password,
    )

    user = auth_service.login(db, payload)
    token = auth_service.create_access_token(user)

    return {
        "access_token": token,
        "token_type": "bearer",
        "accessToken": token,
        "tokenType": "bearer",
        "user": jsonable_encoder(user),
    }


@router.post("/forgot-password", response_model=ForgotPasswordResponse)
def forgot_password(payload: ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = auth_service.get_user_by_email(db, auth_service.normalize_email(payload.email))
    generic = {
        "message": "If this email is registered, you will receive reset instructions.",
        "resetToken": None,
    }
    if not user:
        return generic

    token = auth_service.issue_password_reset_token(db, user)
    if PASSWORD_RESET_EXPOSE_TOKEN:
        return {
            "message": "Use the reset token below to set a new password (development mode).",
            "resetToken": token,
        }
    return generic


@router.post("/reset-password")
def reset_password(payload: ResetPasswordRequest, db: Session = Depends(get_db)):
    ok = auth_service.reset_password_with_token(
        db,
        payload.email,
        payload.token,
        payload.newPassword,
    )
    if not ok:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset request",
        )
    return {"message": "Password updated. You can sign in."}


@router.get("/me", response_model=UserResponse)
def me(current_user: User = Depends(get_current_user)):
    return current_user