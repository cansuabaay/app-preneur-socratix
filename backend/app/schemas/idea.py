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
    strategicAnalysis: dict[str, Any] | None = None


class IdeaCreate(IdeaBase):
    title: str = Field(min_length=1, max_length=200)
    description: str = Field(min_length=1, max_length=5000)


class IdeaUpdate(IdeaBase):
    pass


class IdeaOwnerUpdate(BaseModel):
    """Fields idea owners may change via PUT /ideas/{id}."""

    title: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = Field(default=None, min_length=1, max_length=5000)
    categoryId: str | None = None


class VoterSummary(BaseModel):
    id: str
    name: str
    avatarUrl: str | None = None


class VoteToggleResponse(BaseModel):
    voted: bool
    voteCount: int
    voters: list[VoterSummary] = Field(default_factory=list)


class ReviewAnswerItem(BaseModel):
    question: str = ""
    answer: str = ""


class DevilRequest(BaseModel):
    answers: list[Any] = Field(default_factory=list)
    questions: list[Any] | None = None
    reviewAnswers: list[ReviewAnswerItem] | None = None
    skipped: bool = False


class CommentRequest(BaseModel):
    authorId: str | None = None
    authorName: str | None = None
    body: str = Field(min_length=1, max_length=2000)


class DevilAdvocateResponse(BaseModel):
    impactLevel: str = ""
    impactScore: int = Field(default=5, ge=1, le=10)
    strengths: list[str] = Field(default_factory=list)
    risks: list[str] = Field(default_factory=list)
    validationSummary: str = ""
    recommendedNextStep: str = ""
    businessValueSummary: str = ""
    improvementSuggestions: list[str] = Field(default_factory=list)
    feasibilityScore: int = Field(default=5, ge=1, le=10)
    summary: str = ""
    cached: bool = False


class AiLanguageRequest(BaseModel):
    targetLanguage: str = Field(default="en", pattern="^(en|tr)$")


class StrategicAnalysisRequest(BaseModel):
    targetLanguage: str = Field(default="en", pattern="^(en|tr)$")
    regenerate: bool = False


class AiImproveRequest(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    description: str = Field(min_length=1, max_length=5000)
    categoryId: str | None = None
    targetLanguage: str = Field(default="en", pattern="^(en|tr)$")


class SimilarWarningItem(BaseModel):
    title: str = ""
    detail: str = ""


class ImprovementSuggestionItem(BaseModel):
    category: str = ""
    title: str = ""
    detail: str = ""


class AiImproveResponse(BaseModel):
    improvements: list[ImprovementSuggestionItem] = Field(default_factory=list)
    similarWarnings: list[SimilarWarningItem] = Field(default_factory=list)
    summary: str = ""


class DevilQuestionsResponse(BaseModel):
    questions: list[str] = Field(default_factory=list)


class TranslateBatchItem(BaseModel):
    id: str = Field(min_length=1, max_length=100)
    title: str = Field(min_length=1, max_length=200)
    description: str = Field(min_length=1, max_length=5000)


class TranslateBatchRequest(BaseModel):
    targetLang: str = Field(pattern="^(en|tr)$")
    items: list[TranslateBatchItem] = Field(min_length=1, max_length=30)


class TranslatedIdeaItem(BaseModel):
    id: str
    title: str
    description: str
    translated: bool = False


class TranslateBatchResponse(BaseModel):
    items: list[TranslatedIdeaItem] = Field(default_factory=list)
    usedLiveAi: bool = False


class TranslateTextItem(BaseModel):
    id: str = Field(min_length=1, max_length=100)
    text: str = Field(min_length=1, max_length=5000)


class TranslateTextsRequest(BaseModel):
    targetLang: str = Field(pattern="^(en|tr)$")
    items: list[TranslateTextItem] = Field(min_length=1, max_length=50)


class TranslatedTextItem(BaseModel):
    id: str
    text: str
    translated: bool = False


class TranslateTextsResponse(BaseModel):
    items: list[TranslatedTextItem] = Field(default_factory=list)
    usedLiveAi: bool = False


class IdeaResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    title: str
    description: str
    categoryId: str | None = None
    departmentId: str | None = None
    authorId: str | None = None
    authorName: str | None = None
    authorAvatarUrl: str | None = None
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
    strategicAnalysis: dict[str, Any] | None = None