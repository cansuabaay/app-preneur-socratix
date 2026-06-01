from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from fastapi.encoders import jsonable_encoder

from app.database import get_db
from app.models.user import User
from app.schemas.auth import (
    AuthResponse,
    UserLogin,
    UserProfileUpdate,
    UserRegister,
    UserResponse,
)
from app.services.auth_service import auth_service, get_current_user
from app.services.avatar_service import avatar_service, ensure_avatar_dir

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


@router.get("/me", response_model=UserResponse)
def me(current_user: User = Depends(get_current_user)):
    return current_user


@router.post("/me/avatar", response_model=UserResponse)
async def upload_avatar(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ensure_avatar_dir()
    return await avatar_service.save_avatar(db, current_user, file)


@router.delete("/me/avatar", response_model=UserResponse)
def remove_avatar(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return avatar_service.remove_avatar(db, current_user)


@router.put("/me", response_model=UserResponse)
def update_me(
    payload: UserProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not payload.model_dump(exclude_unset=True):
        raise HTTPException(
            status_code=400,
            detail="Provide at least one field to update.",
        )
    return auth_service.update_profile(db, current_user, payload)