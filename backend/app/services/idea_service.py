from datetime import datetime
from uuid import UUID

from sqlalchemy.orm import Session

from app.models.idea import Idea
from app.schemas.idea import CommentRequest, DevilRequest, IdeaCreate, IdeaUpdate, VoteRequest


class IdeaService:
    def list_ideas(self, db: Session) -> list[Idea]:
        return db.query(Idea).order_by(Idea.createdAt.desc()).all()

    def get_idea(self, db: Session, idea_id: UUID) -> Idea | None:
        return db.query(Idea).filter(Idea.id == idea_id).first()

    def create_idea(self, db: Session, payload: IdeaCreate) -> Idea:
        data = payload.model_dump(exclude_unset=True)
        data["title"] = data["title"].strip()
        data["description"] = data["description"].strip()
        data.setdefault("votes", 0)
        data.setdefault("progressStatus", "devils_advocate")
        data.setdefault("aiReviewed", False)
        data.setdefault("voters", [])
        data.setdefault("comments", [])
        data.setdefault("devilQuestions", [])
        data.setdefault("devilAnswers", [])
        data.setdefault("devilSkipped", False)

        idea = Idea(**data)
        db.add(idea)
        db.commit()
        db.refresh(idea)
        return idea

    def update_idea(self, db: Session, idea: Idea, payload: IdeaUpdate) -> Idea:
        data = payload.model_dump(exclude_unset=True)
        for field, value in data.items():
            if isinstance(value, str) and field in {"title", "description"}:
                value = value.strip()
            setattr(idea, field, value)
        db.commit()
        db.refresh(idea)
        return idea

    def delete_idea(self, db: Session, idea: Idea) -> None:
        db.delete(idea)
        db.commit()

    def vote_idea(self, db: Session, idea: Idea, payload: VoteRequest | None = None) -> Idea:
        user_id = payload.userId if payload else None
        voters = list(idea.voters or [])

        if user_id and user_id not in voters:
            voters.append(user_id)
            idea.voters = voters

        idea.votes = (idea.votes or 0) + 1

        db.commit()
        db.refresh(idea)
        return idea

    def submit_devil(self, db: Session, idea: Idea, payload: DevilRequest) -> Idea:
        if payload.questions is not None:
            idea.devilQuestions = payload.questions

        idea.devilAnswers = payload.answers
        idea.devilSkipped = payload.skipped
        idea.progressStatus = "published"

        db.commit()
        db.refresh(idea)
        return idea

    def add_comment(self, db: Session, idea: Idea, payload: CommentRequest) -> Idea:
        comments = list(idea.comments or [])

        comments.append(
            {
                "id": f"c-{int(datetime.utcnow().timestamp() * 1000)}",
                "authorId": payload.authorId,
                "authorName": payload.authorName or "Colleague",
                "body": payload.body.strip(),
                "createdAt": datetime.utcnow().isoformat(),
            }
        )

        idea.comments = comments

        db.commit()
        db.refresh(idea)
        return idea


idea_service = IdeaService()