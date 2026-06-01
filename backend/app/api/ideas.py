from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.schemas.idea import (
    AiImproveRequest,
    AiImproveResponse,
    CommentRequest,
    DevilAdvocateResponse,
    DevilQuestionsResponse,
    DevilRequest,
    IdeaCreate,
    IdeaOwnerUpdate,
    IdeaResponse,
    VoteToggleResponse,
)
from app.services.ai_service import ai_service
from app.services.auth_service import get_current_user
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


def assert_idea_owner(idea, current_user: User) -> None:
    owner_id = str(idea.authorId or "").strip()
    user_id = str(current_user.id)
    if owner_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only modify your own ideas.",
        )


def assert_can_view_idea(idea, current_user: User) -> None:
    if not idea_service.can_view_idea(idea, current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You cannot view this draft idea.",
        )


@router.get("", response_model=List[IdeaResponse])
def list_ideas(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return idea_service.list_ideas(db, current_user)


@router.post("/ai-improve", response_model=AiImproveResponse)
def ai_improve(
    payload: AiImproveRequest,
    _: User = Depends(get_current_user),
):
    result, _ = ai_service.improve_idea(
        payload.title,
        payload.description,
        payload.categoryId,
    )
    return result


@router.get("/{idea_id}", response_model=IdeaResponse)
def get_idea(
    idea_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    idea = get_existing_idea(db, idea_id)
    assert_can_view_idea(idea, current_user)
    return idea


@router.post("", response_model=IdeaResponse, status_code=status.HTTP_201_CREATED)
def create_idea(payload: IdeaCreate, db: Session = Depends(get_db)):
    return idea_service.create_idea(db, payload)


@router.put("/{idea_id}", response_model=IdeaResponse)
def update_idea(
    idea_id: UUID,
    payload: IdeaOwnerUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    idea = get_existing_idea(db, idea_id)
    assert_idea_owner(idea, current_user)

    if not payload.model_dump(exclude_unset=True):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Provide at least one field to update.",
        )

    return idea_service.update_idea_by_owner(db, idea, payload)


@router.delete("/{idea_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_idea(
    idea_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    idea = get_existing_idea(db, idea_id)
    assert_idea_owner(idea, current_user)
    idea_service.delete_idea(db, idea)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/{idea_id}/vote", response_model=VoteToggleResponse)
def vote_idea(
    idea_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    idea = get_existing_idea(db, idea_id)
    return idea_service.toggle_vote(db, idea, current_user)


@router.post("/{idea_id}/devil-questions", response_model=DevilQuestionsResponse)
def generate_devil_questions(
    idea_id: UUID,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    idea = get_existing_idea(db, idea_id)
    questions, _ = ai_service.generate_devil_questions(
        idea.title,
        idea.description,
        idea.categoryId,
    )
    idea_service.set_devil_questions(db, idea, questions)
    return {"questions": questions}


@router.post("/{idea_id}/devil", response_model=IdeaResponse)
def submit_devil(
    idea_id: UUID,
    payload: DevilRequest,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    idea = get_existing_idea(db, idea_id)

    if not payload.skipped:
        expected = len(idea.devilQuestions or [])
        answers = payload.answers or []
        if expected and len(answers) < expected:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Answer all AI review questions before submitting.",
            )
        if expected and not all(str(a).strip() for a in answers[:expected]):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Each answer must be non-empty.",
            )

    return idea_service.submit_devil(db, idea, payload)


@router.post("/{idea_id}/devil-advocate", response_model=DevilAdvocateResponse)
def devil_advocate(
    idea_id: UUID,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    idea = get_existing_idea(db, idea_id)
    analysis, used_live_ai = ai_service.analyze_idea(
        idea.title,
        idea.description,
        idea.categoryId,
    )

    if used_live_ai:
        idea.aiReviewed = True
        db.commit()
        db.refresh(idea)

    return analysis


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