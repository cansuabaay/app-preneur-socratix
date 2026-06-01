from io import BytesIO

from app.services.avatar_service import AVATAR_DIR

# Minimal valid 1x1 PNG
PNG_1X1 = (
    b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01"
    b"\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15\xc4\x89"
    b"\x00\x00\x00\nIDATx\x9cc\x00\x01\x00\x00\x05\x00\x01"
    b"\r\n-\xb4\x00\x00\x00\x00IEND\xaeB`\x82"
)


def test_upload_avatar(authenticated_client, auth_headers, db, test_user):
    files = {"file": ("avatar.png", BytesIO(PNG_1X1), "image/png")}
    response = authenticated_client.post(
        "/auth/me/avatar",
        headers=auth_headers,
        files=files,
    )
    assert response.status_code == 200
    body = response.json()
    assert body["avatarUrl"]
    assert body["avatarUrl"].startswith("/uploads/avatars/")

    db.refresh(test_user)
    assert test_user.avatarUrl == body["avatarUrl"]
    assert (AVATAR_DIR / body["avatarUrl"].split("/")[-1]).is_file()


def test_upload_avatar_rejects_large_file(authenticated_client, auth_headers):
    huge = b"\x00" * (5 * 1024 * 1024 + 1)
    files = {"file": ("big.png", BytesIO(huge), "image/png")}
    response = authenticated_client.post(
        "/auth/me/avatar",
        headers=auth_headers,
        files=files,
    )
    assert response.status_code == 400


def test_remove_avatar(authenticated_client, auth_headers, db, test_user):
    files = {"file": ("avatar.png", BytesIO(PNG_1X1), "image/png")}
    authenticated_client.post("/auth/me/avatar", headers=auth_headers, files=files)

    response = authenticated_client.delete("/auth/me/avatar", headers=auth_headers)
    assert response.status_code == 200
    assert response.json()["avatarUrl"] is None

    db.refresh(test_user)
    assert test_user.avatarUrl is None


def test_upload_requires_auth(client):
    files = {"file": ("avatar.png", BytesIO(PNG_1X1), "image/png")}
    response = client.post("/auth/me/avatar", files=files)
    assert response.status_code == 401
