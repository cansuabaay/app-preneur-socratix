from app.services.ai_service import IMPROVE_FALLBACK, ai_service


def test_improve_idea_fallback_without_api_key(monkeypatch):
    monkeypatch.setenv("OPENAI_API_KEY", "")
    result, used_live_ai = ai_service.improve_idea(
        "Smart onboarding",
        "Reduce time-to-value for enterprise buyers.",
        "cat-customer",
    )
    assert used_live_ai is False
    assert result["improvements"] == IMPROVE_FALLBACK["improvements"]
    assert result["summary"] == IMPROVE_FALLBACK["summary"]


def test_ai_improve_endpoint_requires_auth(client):
    response = client.post(
        "/ideas/ai-improve",
        json={
            "title": "Test idea",
            "description": "A detailed description for testing.",
            "categoryId": "cat-product",
        },
    )
    assert response.status_code == 401


def test_ai_improve_authenticated_returns_suggestions(
    authenticated_client, auth_headers
):
    response = authenticated_client.post(
        "/ideas/ai-improve",
        headers=auth_headers,
        json={
            "title": "Packaging take-back",
            "description": "Collect packaging during field visits for recycling.",
            "categoryId": "cat-sustainability",
        },
    )
    assert response.status_code == 200
    body = response.json()
    assert isinstance(body["improvements"], list)
    assert len(body["improvements"]) >= 1
    assert isinstance(body["similarWarnings"], list)
    assert isinstance(body["summary"], str)
