from uuid import UUID

from sqlalchemy import and_, or_
from sqlalchemy.orm import Session

from app.models.message import Message
from app.models.user import User
from app.schemas.message import MessageCreate


class MessageService:
    def list_users_except(self, db: Session, current_user_id: UUID) -> list[User]:
        return (
            db.query(User)
            .filter(User.id != current_user_id)
            .order_by(User.name.asc())
            .all()
        )

    def get_conversation(
        self,
        db: Session,
        current_user_id: UUID,
        other_user_id: UUID,
    ) -> list[Message]:
        return (
            db.query(Message)
            .filter(
                or_(
                    and_(
                        Message.senderId == current_user_id,
                        Message.receiverId == other_user_id,
                    ),
                    and_(
                        Message.senderId == other_user_id,
                        Message.receiverId == current_user_id,
                    ),
                )
            )
            .order_by(Message.createdAt.asc())
            .all()
        )

    def send_message(
        self,
        db: Session,
        sender_id: UUID,
        payload: MessageCreate,
    ) -> Message:
        message = Message(
            senderId=sender_id,
            receiverId=payload.receiverId,
            content=payload.content.strip(),
            isRead=False,
        )
        db.add(message)
        db.commit()
        db.refresh(message)
        return message

    def user_exists(self, db: Session, user_id: UUID) -> bool:
        return db.query(User.id).filter(User.id == user_id).first() is not None


message_service = MessageService()
