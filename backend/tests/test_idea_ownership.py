from uuid import uuid4

from app.models.user import User
from app.schemas.idea import IdeaCreate, IdeaOwnerUpdate
from app.services.auth_service import auth_service
from app.services.idea_service import idea_service


def test_delete_idea_forbidden_for_non_owner(authenticated_client, auth_headers, db, test_user):
    other = User(
        id=uuid4(),
        name="Other User",
        email="other.owner@test.local",
        passwordHash=auth_service.hash_password("password123"),
        departmentId="dept-ops",
        role="employee",
    )
    db.add(other)
    db.commit()
    db.refresh(other)

    idea = idea_service.create_idea(
        db,
        IdeaCreate(
            title="Not yours",
            description="Owned by someone else.",
            categoryId="cat-product",
            authorId=str(other.id),
            authorName=other.name,
        ),
    )

    response = authenticated_client.delete(
        f"/ideas/{idea.id}",
        headers=auth_headers,
    )
    assert response.status_code == 403


def test_owner_can_update_and_delete(authenticated_client, auth_headers, db, test_user):
    idea = idea_service.create_idea(
        db,
        IdeaCreate(
            title="My idea",
            description="Original body.",
            categoryId="cat-product",
            authorId=str(test_user.id),
            authorName=test_user.name,
        ),
    )

    update_response = authenticated_client.put(
        f"/ideas/{idea.id}",
        headers=auth_headers,
        json={
            "title": "My updated idea",
            "description": "Revised description.",
            "categoryId": "cat-efficiency",
        },
    )
    assert update_response.status_code == 200
    body = update_response.json()
    assert body["title"] == "My updated idea"
    assert body["votes"] == 0

    delete_response = authenticated_client.delete(
        f"/ideas/{idea.id}",
        headers=auth_headers,
    )
    assert delete_response.status_code == 204
    assert idea_service.get_idea(db, idea.id) is None
