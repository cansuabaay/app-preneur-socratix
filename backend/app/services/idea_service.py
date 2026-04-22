from typing import List

from app.models.idea import Idea
from app.schemas.idea import IdeaCreate, IdeaResponse


class IdeaService:
    def __init__(self) -> None:
        self._ideas: List[Idea] = []
        self._next_id = 1

    def list_ideas(self) -> List[IdeaResponse]:
        sorted_ideas = sorted(self._ideas, key=lambda i: i.created_at, reverse=True)
        return [self._to_response(idea) for idea in sorted_ideas]

    def create_idea(self, payload: IdeaCreate) -> IdeaResponse:
        idea = Idea(
            id=self._next_id,
            title=payload.title.strip(),
            description=payload.description.strip(),
            votes=0,
        )
        self._ideas.append(idea)
        self._next_id += 1
        return self._to_response(idea)

    def vote_idea(self, idea_id: int) -> IdeaResponse:
        for idea in self._ideas:
            if idea.id == idea_id:
                idea.votes += 1
                return self._to_response(idea)
        raise ValueError("Idea not found")

    @staticmethod
    def _to_response(idea: Idea) -> IdeaResponse:
        return IdeaResponse(
            id=idea.id,
            title=idea.title,
            description=idea.description,
            votes=idea.votes,
            status=idea.status,
            created_at=idea.created_at,
            ai_suggestions=idea.ai_suggestions,
        )


idea_service = IdeaService()