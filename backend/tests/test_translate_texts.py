from app.services.ai_service import ai_service


def test_translate_texts_fallback_without_api_key(monkeypatch):
    monkeypatch.setenv("OPENAI_API_KEY", "")
    items = [{"id": "q-0", "text": "What is the weakest assumption?"}]
    result, used_live_ai = ai_service.translate_texts_batch(items, "tr")
    assert used_live_ai is False
    assert len(result) == 1
    assert result[0]["text"] == items[0]["text"]
    assert result[0]["translated"] is False


def test_translate_texts_requires_auth(client):
    response = client.post(
        "/ideas/translate-texts",
        json={
            "targetLang": "en",
            "items": [{"id": "a-1", "text": "Merhaba"}],
        },
    )
    assert response.status_code == 401


def test_translate_texts_authenticated(authenticated_client, auth_headers):
    response = authenticated_client.post(
        "/ideas/translate-texts",
        headers=auth_headers,
        json={
            "targetLang": "en",
            "items": [{"id": "a-1", "text": "Kurumsal inovasyon fikri"}],
        },
    )
    assert response.status_code == 200
    body = response.json()
    assert len(body["items"]) == 1
    assert body["items"][0]["text"]
