from datetime import datetime
from uuid import UUID

from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.models.idea import Idea
from app.models.user import User
from app.schemas.idea import (
    CommentRequest,
    DevilRequest,
    IdeaCreate,
    IdeaOwnerUpdate,
    IdeaUpdate,
    VoteToggleResponse,
    VoterSummary,
)


def _parse_voter_id(entry) -> str | None:
    if isinstance(entry, dict):
        raw_id = entry.get("id")
    elif isinstance(entry, str):
        raw_id = entry
    else:
        return None
    if raw_id is None:
        return None
    try:
        return str(UUID(str(raw_id)))
    except (ValueError, TypeError):
        return None


def _normalize_voters(db: Session, raw_voters: list | None) -> list[dict[str, str]]:
    normalized: list[dict[str, str]] = []
    seen: set[str] = set()

    for entry in raw_voters or []:
        voter_id = _parse_voter_id(entry)
        if not voter_id or voter_id in seen:
            continue
        seen.add(voter_id)

        name = None
        if isinstance(entry, dict):
            name = entry.get("name")

        user = db.query(User).filter(User.id == UUID(voter_id)).first()
        if user:
            name = user.name
        elif not name:
            name = "User"

        normalized.append({"id": voter_id, "name": name})

    return normalized


def _normalize_progress_status(status: str | None) -> str:
    if status == "draft":
        return "draft"
    return "submitted"


class IdeaService:
    def _sync_idea_fields(self, db: Session, idea: Idea, *, persist: bool) -> None:
        before_voters = idea.voters
        before_votes = idea.votes
        before_status = idea.progressStatus

        voters = _normalize_voters(db, idea.voters)
        idea.voters = voters
        idea.votes = len(voters)
        idea.progressStatus = _normalize_progress_status(idea.progressStatus)

        changed = (
            before_voters != voters
            or before_votes != idea.votes
            or before_status != idea.progressStatus
        )
        if persist and changed:
            db.commit()
            db.refresh(idea)

    def list_ideas(self, db: Session, current_user: User) -> list[Idea]:
        user_id = str(current_user.id)
        ideas = (
            db.query(Idea)
            .filter(
                or_(
                    Idea.progressStatus != "draft",
                    Idea.authorId == user_id,
                )
            )
            .order_by(Idea.createdAt.desc())
            .all()
        )
        for idea in ideas:
            self._sync_idea_fields(db, idea, persist=True)
        return ideas

    def can_view_idea(self, idea: Idea, current_user: User) -> bool:
        if _normalize_progress_status(idea.progressStatus) != "draft":
            return True
        owner_id = str(idea.authorId or "").strip()
        return owner_id == str(current_user.id)

    def get_idea(self, db: Session, idea_id: UUID) -> Idea | None:
        idea = db.query(Idea).filter(Idea.id == idea_id).first()
        if idea:
            self._sync_idea_fields(db, idea, persist=True)
        return idea

    def create_idea(self, db: Session, payload: IdeaCreate) -> Idea:
        data = payload.model_dump(exclude_unset=True)
        data["title"] = data["title"].strip()
        data["description"] = data["description"].strip()
        data.setdefault("votes", 0)
        data.setdefault("progressStatus", "draft")
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

    def update_idea_by_owner(self, db: Session, idea: Idea, payload: IdeaOwnerUpdate) -> Idea:
        data = payload.model_dump(exclude_unset=True)
        allowed = {"title", "description", "categoryId"}

        for field, value in data.items():
            if field not in allowed:
                continue
            if isinstance(value, str) and field in {"title", "description"}:
                value = value.strip()
            setattr(idea, field, value)

        db.commit()
        db.refresh(idea)
        return idea

    def delete_idea(self, db: Session, idea: Idea) -> None:
        db.delete(idea)
        db.commit()

    def toggle_vote(
        self, db: Session, idea: Idea, current_user: User
    ) -> VoteToggleResponse:
        voters = _normalize_voters(db, idea.voters)
        user_id = str(current_user.id)
        existing = next((i for i, v in enumerate(voters) if v["id"] == user_id), None)

        if existing is not None:
            voters.pop(existing)
            voted = False
        else:
            voters.append({"id": user_id, "name": current_user.name})
            voted = True

        idea.voters = voters
        idea.votes = len(voters)
        db.commit()
        db.refresh(idea)

        summaries = [VoterSummary(**v) for v in voters]
        return VoteToggleResponse(
            voted=voted,
            voteCount=len(voters),
            voters=summaries,
        )

    def set_devil_questions(self, db: Session, idea: Idea, questions: list[str]) -> Idea:
        idea.devilQuestions = questions
        db.commit()
        db.refresh(idea)
        return idea

    def submit_devil(self, db: Session, idea: Idea, payload: DevilRequest) -> Idea:
        if payload.questions is not None:
            idea.devilQuestions = payload.questions

        idea.devilAnswers = payload.answers
        idea.devilSkipped = payload.skipped
        idea.progressStatus = "submitted"
        idea.aiReviewed = not payload.skipped

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