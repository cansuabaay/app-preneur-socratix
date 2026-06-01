from uuid import uuid4

from app.models.user import User
from app.schemas.idea import IdeaCreate
from app.services.auth_service import auth_service
from app.services.idea_service import idea_service


def _auth_headers(user: User) -> dict[str, str]:
    token = auth_service.create_access_token(user)
    return {"Authorization": f"Bearer {token}"}


def _create_user(db, name: str, email: str) -> User:
    user = User(
        id=uuid4(),
        name=name,
        email=email,
        passwordHash=auth_service.hash_password("password123"),
        departmentId="dept-rd",
        role="employee",
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def test_other_user_does_not_see_draft_in_list(client, db):
    user_a = _create_user(db, "User A", "user.a.draft@test.local")
    user_b = _create_user(db, "User B", "user.b.draft@test.local")

    draft = idea_service.create_idea(
        db,
        IdeaCreate(
            title="Private draft",
            description="Only A should list this while draft.",
            categoryId="cat-product",
            authorId=str(user_a.id),
            authorName=user_a.name,
        ),
    )
    assert draft.progressStatus == "draft"

    response = client.get("/ideas", headers=_auth_headers(user_b))
    assert response.status_code == 200
    ids = {item["id"] for item in response.json()}
    assert str(draft.id) not in ids


def test_owner_sees_own_draft(client, db):
    user_a = _create_user(db, "User A", "user.a.own-draft@test.local")

    draft = idea_service.create_idea(
        db,
        IdeaCreate(
            title="My draft",
            description="Visible to me in the feed.",
            categoryId="cat-product",
            authorId=str(user_a.id),
            authorName=user_a.name,
        ),
    )

    response = client.get("/ideas", headers=_auth_headers(user_a))
    assert response.status_code == 200
    match = next(i for i in response.json() if i["id"] == str(draft.id))
    assert match["progressStatus"] == "draft"


def test_submitted_ideas_visible_to_everyone(client, db):
    user_a = _create_user(db, "User A", "user.a.submitted@test.local")
    user_b = _create_user(db, "User B", "user.b.submitted@test.local")

    submitted = idea_service.create_idea(
        db,
        IdeaCreate(
            title="Public idea",
            description="Everyone can see this.",
            categoryId="cat-product",
            authorId=str(user_a.id),
            authorName=user_a.name,
            progressStatus="submitted",
        ),
    )

    response = client.get("/ideas", headers=_auth_headers(user_b))
    assert response.status_code == 200
    ids = {item["id"] for item in response.json()}
    assert str(submitted.id) in ids


def test_other_user_get_draft_returns_403(client, db):
    user_a = _create_user(db, "User A", "user.a.get-draft@test.local")
    user_b = _create_user(db, "User B", "user.b.get-draft@test.local")

    draft = idea_service.create_idea(
        db,
        IdeaCreate(
            title="Hidden draft",
            description="Direct access blocked for non-owners.",
            categoryId="cat-product",
            authorId=str(user_a.id),
            authorName=user_a.name,
        ),
    )

    response = client.get(f"/ideas/{draft.id}", headers=_auth_headers(user_b))
    assert response.status_code == 403


def test_list_ideas_requires_auth(client):
    response = client.get("/ideas")
    assert response.status_code == 401
