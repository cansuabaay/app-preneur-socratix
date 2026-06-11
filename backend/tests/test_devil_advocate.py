from uuid import uuid4

from app.models.idea import Idea
from app.schemas.idea import IdeaCreate
from app.services.ai_service import FALLBACK_RESPONSE, ai_service
from app.services.idea_service import idea_service


def test_analyze_idea_fallback_without_api_key(monkeypatch):
    monkeypatch.setenv("OPENAI_API_KEY", "")
    result, used_live_ai = ai_service.analyze_idea(
        {
            "title": "Circular packaging",
            "description": "Take back packaging from enterprise clients.",
            "categoryId": "cat-sustainability",
            "votes": 0,
            "challengeQa": [],
            "acceptedAiImprovements": [],
            "comments": [],
        }
    )
    assert used_live_ai is False
    assert result["risks"] == FALLBACK_RESPONSE["risks"]
    assert result["feasibilityScore"] == 5


def test_devil_advocate_returns_fallback_when_api_key_missing(
    authenticated_client, auth_headers, db
):
    idea = idea_service.create_idea(
        db,
        IdeaCreate(
            title="Smart inventory",
            description="Use sensors to reduce waste.",
            categoryId="cat-efficiency",
        ),
    )

    response = authenticated_client.post(
        f"/ideas/{idea.id}/devil-advocate",
        headers=auth_headers,
    )

    assert response.status_code == 200
    body = response.json()
    assert body["risks"] == FALLBACK_RESPONSE["risks"]
    assert body["summary"] == FALLBACK_RESPONSE["summary"]


def test_devil_advocate_404_when_idea_missing(authenticated_client, auth_headers):
    missing_id = uuid4()
    response = authenticated_client.post(
        f"/ideas/{missing_id}/devil-advocate",
        headers=auth_headers,
    )
    assert response.status_code == 404
    assert response.json()["detail"] == "Idea not found"


def test_devil_advocate_requires_authentication(client, db):
    idea = idea_service.create_idea(
        db,
        IdeaCreate(
            title="Anonymous access test",
            description="Should require JWT.",
            categoryId="cat-product",
        ),
    )

    response = client.post(f"/ideas/{idea.id}/devil-advocate")
    assert response.status_code == 401


def test_devil_advocate_authenticated_user_can_access(
    authenticated_client, auth_headers, db
):
    idea = idea_service.create_idea(
        db,
        IdeaCreate(
            title="Team collaboration hub",
            description="Centralize innovation feedback loops.",
            categoryId="cat-culture",
        ),
    )

    response = authenticated_client.post(
        f"/ideas/{idea.id}/devil-advocate",
        headers=auth_headers,
    )

    assert response.status_code == 200
    body = response.json()
    assert "risks" in body
    assert "strengths" in body
    assert "impactLevel" in body
    assert "recommendedNextStep" in body
    assert "validationSummary" in body
    assert "businessValueSummary" in body
    assert 1 <= body["feasibilityScore"] <= 10
    assert isinstance(body["summary"], str)

    db.refresh(idea)
    assert isinstance(idea, Idea)
    assert idea.strategicAnalysis is not None
    assert idea.strategicAnalysis.get("impactLevel")


def test_devil_advocate_returns_cached_analysis_without_regenerating(
    authenticated_client, auth_headers, db
):
    idea = idea_service.create_idea(
        db,
        IdeaCreate(
            title="Cached analysis idea",
            description="Persist strategic analysis between requests.",
            categoryId="cat-product",
        ),
    )
    idea.strategicAnalysis = {
        "impactLevel": "High",
        "impactScore": 8,
        "strengths": ["Strong fit"],
        "risks": ["Change management"],
        "validationSummary": "Challenge answers were thorough.",
        "recommendedNextStep": "Run a pilot.",
        "businessValueSummary": "High value.",
        "feasibilityScore": 8,
        "summary": "High value.",
    }
    db.commit()
    db.refresh(idea)

    response = authenticated_client.post(
        f"/ideas/{idea.id}/devil-advocate",
        headers=auth_headers,
        json={"targetLanguage": "en", "regenerate": False},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["cached"] is True
    assert body["impactLevel"] == "High"
    assert body["validationSummary"] == "Challenge answers were thorough."
