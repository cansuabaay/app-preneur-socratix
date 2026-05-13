from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class IdeaBase(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = Field(default=None, min_length=1, max_length=5000)
    categoryId: str | None = None
    departmentId: str | None = None
    authorId: str | None = None
    authorName: str | None = None
    progressStatus: str | None = None
    aiReviewed: bool | None = None
    voters: list[Any] | None = None
    comments: list[Any] | None = None
    devilQuestions: list[Any] | None = None
    devilAnswers: list[Any] | None = None
    devilSkipped: bool | None = None
    aiPackageId: str | None = None


class IdeaCreate(IdeaBase):
    title: str = Field(min_length=1, max_length=200)
    description: str = Field(min_length=1, max_length=5000)


class IdeaUpdate(IdeaBase):
    pass


class VoteRequest(BaseModel):
    userId: str | None = None


class DevilRequest(BaseModel):
    answers: list[Any] = Field(default_factory=list)
    questions: list[Any] | None = None
    skipped: bool = False


class CommentRequest(BaseModel):
    authorId: str | None = None
    authorName: str | None = None
    body: str = Field(min_length=1, max_length=2000)


class IdeaResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    title: str
    description: str
    categoryId: str | None = None
    departmentId: str | None = None
    authorId: str | None = None
    authorName: str | None = None
    votes: int
    progressStatus: str
    aiReviewed: bool
    createdAt: datetime
    voters: list[Any] = Field(default_factory=list)
    comments: list[Any] = Field(default_factory=list)
    devilQuestions: list[Any] = Field(default_factory=list)
    devilAnswers: list[Any] = Field(default_factory=list)
    devilSkipped: bool
    aiPackageId: str | None = None