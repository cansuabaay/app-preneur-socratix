from uuid import uuid4

from app.models.user import User
from app.services.auth_service import auth_service
from app.services.message_service import message_service


def test_send_and_get_conversation(authenticated_client, auth_headers, db, test_user):
    other = User(
        id=uuid4(),
        name="Cansu Abay",
        email="cansu.messages@test.local",
        passwordHash=auth_service.hash_password("password123"),
        departmentId="dept-rd",
        role="employee",
    )
    db.add(other)
    db.commit()
    db.refresh(other)

    send_response = authenticated_client.post(
        "/messages",
        headers=auth_headers,
        json={"receiverId": str(other.id), "content": "Hello from Ömer"},
    )
    assert send_response.status_code == 201
    assert send_response.json()["content"] == "Hello from Ömer"

    convo = authenticated_client.get(
        f"/messages/{other.id}",
        headers=auth_headers,
    )
    assert convo.status_code == 200
    messages = convo.json()
    assert len(messages) == 1
    assert messages[0]["senderId"] == str(test_user.id)


def test_cannot_read_unrelated_user_conversation_as_third_party(
    authenticated_client, auth_headers, db, test_user
):
    user_a = User(
        id=uuid4(),
        name="User A",
        email="user.a.messages@test.local",
        passwordHash=auth_service.hash_password("password123"),
        departmentId="dept-ops",
        role="employee",
    )
    user_b = User(
        id=uuid4(),
        name="User B",
        email="user.b.messages@test.local",
        passwordHash=auth_service.hash_password("password123"),
        departmentId="dept-fin",
        role="employee",
    )
    db.add_all([user_a, user_b])
    db.commit()

    from app.schemas.message import MessageCreate

    message_service.send_message(
        db,
        user_a.id,
        MessageCreate(receiverId=user_b.id, content="Private between A and B"),
    )

    response = authenticated_client.get(
        f"/messages/{user_b.id}",
        headers=auth_headers,
    )
    assert response.status_code == 200
    assert response.json() == []
