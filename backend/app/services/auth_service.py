from datetime import datetime, timedelta, timezone
from uuid import UUID

import secrets

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from app.config import ACCESS_TOKEN_EXPIRE_MINUTES, ALGORITHM, SECRET_KEY
from app.database import get_db
from app.models.password_reset_token import PasswordResetToken
from app.models.user import User
from app.schemas.auth import UserLogin, UserRegister

pwd_context = CryptContext(
    schemes=["pbkdf2_sha256"],
    deprecated="auto"
)
# HTTP Bearer (paste JWT from /auth/login → accessToken). Clearer for Swagger than OAuth2 flow.
http_bearer = HTTPBearer(auto_error=True, scheme_name="Bearer")


class AuthService:
    def hash_password(self, password: str) -> str:
        return pwd_context.hash(password)

    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        return pwd_context.verify(plain_password, hashed_password)

    def normalize_email(self, email: str) -> str:
        return email.strip().lower()

    def create_access_token(self, user: User) -> str:
        expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)

        payload = {
            "sub": str(user.id),
            "email": user.email,
            "exp": expire,
        }

        return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

    def get_user_by_email(self, db: Session, email: str) -> User | None:
        return db.query(User).filter(User.email == self.normalize_email(email)).first()

    def get_user_by_id(self, db: Session, user_id: UUID) -> User | None:
        return db.query(User).filter(User.id == user_id).first()

    def register(self, db: Session, payload: UserRegister) -> User:
        email = self.normalize_email(payload.email)

        existing_user = self.get_user_by_email(db, email)
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Email already registered",
            )

        user = User(
            name=payload.name.strip(),
            email=email,
            passwordHash=self.hash_password(payload.password),
            departmentId=payload.departmentId,
            role="employee",
        )

        db.add(user)
        db.commit()
        db.refresh(user)

        return user

    def login(self, db: Session, payload: UserLogin) -> User:
        user = self.get_user_by_email(db, payload.email)

        if not user or not self.verify_password(payload.password, user.passwordHash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password",
            )

        return user

    def issue_password_reset_token(self, db: Session, user: User) -> str:
        raw = secrets.token_urlsafe(32)
        expires = datetime.utcnow() + timedelta(hours=1)

        db.query(PasswordResetToken).filter(PasswordResetToken.userId == user.id).delete(
            synchronize_session=False
        )
        row = PasswordResetToken(userId=user.id, token=raw, expiresAt=expires)
        db.add(row)
        db.commit()
        return raw

    def reset_password_with_token(
        self, db: Session, email: str, token: str, new_password: str
    ) -> bool:
        user = self.get_user_by_email(db, self.normalize_email(email))
        if not user:
            return False

        row = (
            db.query(PasswordResetToken)
            .filter(
                PasswordResetToken.userId == user.id,
                PasswordResetToken.token == token.strip(),
            )
            .first()
        )
        if not row:
            return False
        if row.expiresAt < datetime.utcnow():
            db.delete(row)
            db.commit()
            return False

        user.passwordHash = self.hash_password(new_password)
        db.delete(row)
        db.commit()
        return True


auth_service = AuthService()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(http_bearer),
    db: Session = Depends(get_db),
) -> User:
    token = credentials.credentials
    credentials_error = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
    )

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")

        if not user_id:
            raise credentials_error

        user = auth_service.get_user_by_id(db, UUID(user_id))

        if not user:
            raise credentials_error

        return user

    except (JWTError, ValueError):
        raise credentials_error