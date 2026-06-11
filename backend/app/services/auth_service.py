from datetime import datetime, timedelta, timezone
from uuid import UUID

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from app.config import ACCESS_TOKEN_EXPIRE_MINUTES, ALGORITHM, SECRET_KEY
from app.constants.innovation_roles import DEFAULT_INNOVATION_ROLE
from app.database import get_db
from app.models.user import User
from app.schemas.auth import UserLogin, UserProfileUpdate, UserRegister

pwd_context = CryptContext(
    schemes=["pbkdf2_sha256"],
    deprecated="auto"
)
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


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

        job_title = payload.jobTitle.strip() if payload.jobTitle else None

        user = User(
            name=payload.name.strip(),
            email=email,
            passwordHash=self.hash_password(payload.password),
            departmentId=payload.departmentId,
            jobTitle=job_title or None,
            innovationRole=DEFAULT_INNOVATION_ROLE,
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

    def update_profile(
        self, db: Session, user: User, payload: UserProfileUpdate
    ) -> User:
        data = payload.model_dump(exclude_unset=True)
        allowed = {"name", "departmentId", "jobTitle", "bio"}

        for field, value in data.items():
            if field not in allowed:
                continue
            if field == "name" and value is not None:
                value = value.strip()
                if not value:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Name cannot be empty.",
                    )
            if field == "jobTitle" and value is not None:
                value = value.strip() or None
            if field == "bio" and value is not None:
                value = value.strip() or None
            setattr(user, field, value)

        db.commit()
        db.refresh(user)
        return user


auth_service = AuthService()


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
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