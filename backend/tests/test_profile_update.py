from uuid import uuid4

from app.models.user import User
from app.services.auth_service import auth_service


def test_update_me_profile(authenticated_client, auth_headers, db, test_user):
    response = authenticated_client.put(
        "/auth/me",
        headers=auth_headers,
        json={
            "name": "Cansu Abay",
            "departmentId": "dept-fin",
            "bio": "Innovation lead.",
        },
    )
    assert response.status_code == 200
    body = response.json()
    assert body["name"] == "Cansu Abay"
    assert body["departmentId"] == "dept-fin"
    assert body["bio"] == "Innovation lead."
    assert body["email"] == test_user.email

    db.refresh(test_user)
    assert test_user.name == "Cansu Abay"
    assert test_user.bio == "Innovation lead."


def test_update_me_cannot_change_email_or_role(authenticated_client, auth_headers, db, test_user):
    original_email = test_user.email
    original_role = test_user.role

    response = authenticated_client.put(
        "/auth/me",
        headers=auth_headers,
        json={"name": "Updated Name"},
    )
    assert response.status_code == 200

    db.refresh(test_user)
    assert test_user.email == original_email
    assert test_user.role == original_role


def test_update_me_requires_auth(client, db, test_user):
    response = client.put(
        "/auth/me",
        json={"name": "Hacker"},
    )
    assert response.status_code == 401


def test_me_returns_avatar_and_bio(authenticated_client, auth_headers, db, test_user):
    test_user.avatarUrl = "https://cdn.example/u.png"
    test_user.bio = "Hello"
    db.commit()

    response = authenticated_client.get("/auth/me", headers=auth_headers)
    assert response.status_code == 200
    body = response.json()
    assert body["avatarUrl"] == "https://cdn.example/u.png"
    assert body["bio"] == "Hello"


def test_users_are_isolated(authenticated_client, auth_headers, db, test_user):
    other = User(
        id=uuid4(),
        name="Ömer Muslu",
        email="omer.profile@test.local",
        passwordHash=auth_service.hash_password("password123"),
        departmentId="dept-rd",
        role="employee",
        bio="Ömer bio",
    )
    db.add(other)
    db.commit()

    authenticated_client.put(
        "/auth/me",
        headers=auth_headers,
        json={"name": "Cansu Only", "bio": "Cansu bio"},
    )

    me = authenticated_client.get("/auth/me", headers=auth_headers).json()
    assert me["name"] == "Cansu Only"
    assert me["bio"] == "Cansu bio"

    db.refresh(other)
    assert other.name == "Ömer Muslu"
    assert other.bio == "Ömer bio"
