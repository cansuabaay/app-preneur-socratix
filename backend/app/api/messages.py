from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.schemas.auth import UserResponse
from app.schemas.message import MessageCreate, MessageResponse
from app.services.auth_service import get_current_user
from app.services.message_service import message_service

router = APIRouter(prefix="/messages", tags=["messages"])


@router.get("/users", response_model=List[UserResponse])
def list_message_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Registered users except the current user (for starting chats)."""
    return message_service.list_users_except(db, current_user.id)


@router.post("", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
def send_message(
    payload: MessageCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if payload.receiverId == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot message yourself.",
        )

    if not message_service.user_exists(db, payload.receiverId):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Recipient not found.",
        )

    return message_service.send_message(db, current_user.id, payload)


@router.get("/{user_id}", response_model=List[MessageResponse])
def get_conversation(
    user_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Select another user to view a conversation.",
        )

    if not message_service.user_exists(db, user_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found.",
        )

    return message_service.get_conversation(db, current_user.id, user_id)
