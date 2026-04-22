from typing import List

from fastapi import APIRouter, HTTPException, status

from app.schemas.idea import IdeaCreate, IdeaResponse
from app.services.idea_service import idea_service

router = APIRouter(prefix="/ideas", tags=["ideas"])


@router.get("", response_model=List[IdeaResponse])
def list_ideas() -> List[IdeaResponse]:
    return idea_service.list_ideas()


@router.post("", response_model=IdeaResponse, status_code=status.HTTP_201_CREATED)
def create_idea(payload: IdeaCreate) -> IdeaResponse:
    return idea_service.create_idea(payload)


@router.post("/{idea_id}/mentor")
def mentor_idea(idea_id: int) -> dict:
    """AI mentorluğu için yer tutucu — sonraki fazda gerçek LLM entegrasyonu yapılacak."""
    return {"idea_id": idea_id, "message": "AI mentorluğu yakında.", "ai_suggestions": []}


@router.post("/{idea_id}/vote", response_model=IdeaResponse)
def vote_idea(idea_id: int) -> IdeaResponse:
    try:
        return idea_service.vote_idea(idea_id)
    except ValueError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error