import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base
from app.db_types import FlexibleJSON


class Idea(Base):
    __tablename__ = "ideas"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    categoryId: Mapped[str | None] = mapped_column(String(100), nullable=True)
    departmentId: Mapped[str | None] = mapped_column(String(100), nullable=True)
    authorId: Mapped[str | None] = mapped_column(String(100), nullable=True)
    authorName: Mapped[str | None] = mapped_column(String(120), nullable=True)
    votes: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    progressStatus: Mapped[str] = mapped_column(String(50), nullable=False, default="draft")
    aiReviewed: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    createdAt: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)
    voters: Mapped[list] = mapped_column(FlexibleJSON, nullable=False, default=list)
    comments: Mapped[list] = mapped_column(FlexibleJSON, nullable=False, default=list)
    devilQuestions: Mapped[list] = mapped_column(FlexibleJSON, nullable=False, default=list)
    devilAnswers: Mapped[list] = mapped_column(FlexibleJSON, nullable=False, default=list)
    devilSkipped: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    aiPackageId: Mapped[str | None] = mapped_column(String(100), nullable=True)
    strategicAnalysis: Mapped[dict | None] = mapped_column(FlexibleJSON, nullable=True, default=None)