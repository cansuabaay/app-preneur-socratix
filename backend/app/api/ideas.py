from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.idea import (
    CommentRequest,
    DevilRequest,
    IdeaCreate,
    IdeaResponse,
    IdeaUpdate,
    VoteRequest,
)
from app.services.idea_service import idea_service

router = APIRouter(prefix="/ideas", tags=["ideas"])


def get_existing_idea(db: Session, idea_id: UUID):
    idea = idea_service.get_idea(db, idea_id)
    if not idea:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Idea not found",
        )
    return idea


@router.get("", response_model=List[IdeaResponse])
def list_ideas(db: Session = Depends(get_db)):
    return idea_service.list_ideas(db)


@router.get("/{idea_id}", response_model=IdeaResponse)
def get_idea(idea_id: UUID, db: Session = Depends(get_db)):
    return get_existing_idea(db, idea_id)


@router.post("", response_model=IdeaResponse, status_code=status.HTTP_201_CREATED)
def create_idea(payload: IdeaCreate, db: Session = Depends(get_db)):
    return idea_service.create_idea(db, payload)


@router.put("/{idea_id}", response_model=IdeaResponse)
def update_idea(idea_id: UUID, payload: IdeaUpdate, db: Session = Depends(get_db)):
    idea = get_existing_idea(db, idea_id)
    return idea_service.update_idea(db, idea, payload)


@router.delete("/{idea_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_idea(idea_id: UUID, db: Session = Depends(get_db)):
    idea = get_existing_idea(db, idea_id)
    idea_service.delete_idea(db, idea)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/{idea_id}/vote", response_model=IdeaResponse)
def vote_idea(
    idea_id: UUID,
    payload: VoteRequest | None = None,
    db: Session = Depends(get_db),
):
    idea = get_existing_idea(db, idea_id)
    return idea_service.vote_idea(db, idea, payload)


@router.post("/{idea_id}/devil", response_model=IdeaResponse)
def submit_devil(idea_id: UUID, payload: DevilRequest, db: Session = Depends(get_db)):
    idea = get_existing_idea(db, idea_id)
    return idea_service.submit_devil(db, idea, payload)


@router.post("/{idea_id}/comments", response_model=IdeaResponse)
def add_comment(idea_id: UUID, payload: CommentRequest, db: Session = Depends(get_db)):
    idea = get_existing_idea(db, idea_id)
    return idea_service.add_comment(db, idea, payload)


@router.post("/{idea_id}/mentor")
def mentor_idea(idea_id: UUID) -> dict:
    return {
        "idea_id": str(idea_id),
        "message": "AI mentorluğu yakında.",
        "ai_suggestions": [],
    }