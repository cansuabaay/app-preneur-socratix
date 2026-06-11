from app.services.ai_service import ai_service


def test_translate_batch_fallback_without_api_key(monkeypatch):
    monkeypatch.setenv("OPENAI_API_KEY", "")
    items = [
        {
            "id": "idea-1",
            "title": "Smart onboarding",
            "description": "Reduce time-to-value for enterprise buyers.",
        }
    ]
    result, used_live_ai = ai_service.translate_batch(items, "tr")
    assert used_live_ai is False
    assert len(result) == 1
    assert result[0]["title"] == items[0]["title"]
    assert result[0]["description"] == items[0]["description"]
    assert result[0]["translated"] is False


def test_translate_batch_requires_auth(client):
    response = client.post(
        "/ideas/translate-batch",
        json={
            "targetLang": "tr",
            "items": [
                {
                    "id": "idea-1",
                    "title": "Hello",
                    "description": "World",
                }
            ],
        },
    )
    assert response.status_code == 401


def test_translate_batch_authenticated(
    authenticated_client, auth_headers
):
    response = authenticated_client.post(
        "/ideas/translate-batch",
        headers=auth_headers,
        json={
            "targetLang": "tr",
            "items": [
                {
                    "id": "idea-1",
                    "title": "Packaging take-back",
                    "description": "Collect packaging during field visits.",
                }
            ],
        },
    )
    assert response.status_code == 200
    body = response.json()
    assert "items" in body
    assert len(body["items"]) == 1
    assert body["items"][0]["title"]
    assert body["items"][0]["description"]
