import uuid
from datetime import datetime

from sqlalchemy import DateTime, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.constants.innovation_roles import DEFAULT_INNOVATION_ROLE
from app.database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    passwordHash: Mapped[str] = mapped_column(String(255), nullable=False)
    departmentId: Mapped[str | None] = mapped_column(String(100), nullable=True)
    jobTitle: Mapped[str | None] = mapped_column(String(120), nullable=True)
    innovationRole: Mapped[str] = mapped_column(
        String(50), nullable=False, default=DEFAULT_INNOVATION_ROLE
    )
    avatarUrl: Mapped[str | None] = mapped_column(String(500), nullable=True)
    bio: Mapped[str | None] = mapped_column(Text, nullable=True)
    role: Mapped[str] = mapped_column(String(50), nullable=False, default="employee")
    createdAt: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)