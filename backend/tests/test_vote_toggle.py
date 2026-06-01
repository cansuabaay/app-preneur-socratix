from uuid import uuid4

from app.models.user import User
from app.schemas.idea import IdeaCreate
from app.services.auth_service import auth_service
from app.services.idea_service import idea_service


def _register_and_token(client, name: str, email: str) -> tuple[dict[str, str], User]:
    password = "password123"
    response = client.post(
        "/auth/register",
        json={
            "name": name,
            "email": email,
            "password": password,
            "departmentId": "dept-rd",
        },
    )
    assert response.status_code == 201
    body = response.json()
    token = body["accessToken"]
    user = body["user"]
    return {"Authorization": f"Bearer {token}"}, user


def test_vote_toggle_add_and_remove(authenticated_client, auth_headers, db, test_user):
    other = User(
        id=uuid4(),
        name="Cansu Abay",
        email="cansu.vote@test.local",
        passwordHash=auth_service.hash_password("password123"),
        departmentId="dept-rd",
        role="employee",
    )
    db.add(other)
    db.commit()

    idea = idea_service.create_idea(
        db,
        IdeaCreate(
            title="Cansu's idea",
            description="Vote target.",
            categoryId="cat-product",
            authorId=str(other.id),
            authorName=other.name,
        ),
    )

    vote = authenticated_client.post(f"/ideas/{idea.id}/vote", headers=auth_headers)
    assert vote.status_code == 200
    body = vote.json()
    assert body["voted"] is True
    assert body["voteCount"] == 1
    assert len(body["voters"]) == 1
    assert body["voters"][0]["id"] == str(test_user.id)
    assert body["voters"][0]["name"] == test_user.name

    unvote = authenticated_client.post(f"/ideas/{idea.id}/vote", headers=auth_headers)
    assert unvote.status_code == 200
    body2 = unvote.json()
    assert body2["voted"] is False
    assert body2["voteCount"] == 0
    assert body2["voters"] == []


def test_vote_requires_auth(client, db, test_user):
    idea = idea_service.create_idea(
        db,
        IdeaCreate(
            title="Public idea",
            description="No anonymous votes.",
            categoryId="cat-product",
            authorId=str(test_user.id),
            authorName=test_user.name,
        ),
    )

    response = client.post(f"/ideas/{idea.id}/vote")
    assert response.status_code == 401


def test_vote_no_duplicate(client, db):
    voter_headers, voter = _register_and_token(client, "Ömer Muslu", "omer.vote@test.local")
    _, owner = _register_and_token(client, "Cansu Abay", "cansu.owner2@test.local")

    idea = idea_service.create_idea(
        db,
        IdeaCreate(
            title="Shared idea",
            description="One vote per user.",
            categoryId="cat-product",
            authorId=owner["id"],
            authorName=owner["name"],
        ),
    )

    first = client.post(f"/ideas/{idea.id}/vote", headers=voter_headers)
    second = client.post(f"/ideas/{idea.id}/vote", headers=voter_headers)

    assert first.status_code == 200
    assert first.json()["voted"] is True
    assert first.json()["voteCount"] == 1

    assert second.status_code == 200
    assert second.json()["voted"] is False
    assert second.json()["voteCount"] == 0


def test_list_ideas_returns_normalized_voters(authenticated_client, auth_headers, db, test_user):
    idea = idea_service.create_idea(
        db,
        IdeaCreate(
            title="Legacy voters",
            description="Normalize on read.",
            categoryId="cat-product",
            authorId=str(test_user.id),
            authorName=test_user.name,
        ),
    )
    idea.voters = [str(test_user.id)]
    idea.votes = 99
    db.commit()

    listed = authenticated_client.get("/ideas/", headers=auth_headers)
    assert listed.status_code == 200
    match = next(i for i in listed.json() if i["id"] == str(idea.id))
    assert match["votes"] == 1
    assert match["voters"] == [
        {"id": str(test_user.id), "name": test_user.name}
    ]
