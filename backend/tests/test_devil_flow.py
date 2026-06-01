from app.schemas.idea import IdeaCreate
from app.services.ai_service import DEVIL_QUESTIONS_FALLBACK, ai_service
from app.services.idea_service import idea_service


def test_generate_devil_questions_fallback_without_api_key(monkeypatch):
    monkeypatch.setenv("OPENAI_API_KEY", "")
    questions, used_live_ai = ai_service.generate_devil_questions(
        "Circular packaging",
        "Take back packaging from enterprise clients.",
        "cat-sustainability",
    )
    assert used_live_ai is False
    assert questions == DEVIL_QUESTIONS_FALLBACK


def test_create_idea_defaults_to_draft(db):
    idea = idea_service.create_idea(
        db,
        IdeaCreate(
            title="Draft flow test",
            description="Ensures new ideas start as draft.",
            categoryId="cat-product",
        ),
    )
    assert idea.progressStatus == "draft"
    assert idea.aiReviewed is False
    assert idea.devilQuestions == []


def test_submit_devil_completed_sets_submitted_and_ai_reviewed(db):
    idea = idea_service.create_idea(
        db,
        IdeaCreate(
            title="Complete AI review",
            description="Full answer path.",
            categoryId="cat-efficiency",
        ),
    )
    idea_service.set_devil_questions(db, idea, DEVIL_QUESTIONS_FALLBACK)

    from app.schemas.idea import DevilRequest

    updated = idea_service.submit_devil(
        db,
        idea,
        DevilRequest(
            answers=["a1", "a2", "a3"],
            skipped=False,
        ),
    )
    assert updated.progressStatus == "submitted"
    assert updated.aiReviewed is True
    assert updated.devilSkipped is False


def test_submit_devil_skip_sets_submitted(db):
    idea = idea_service.create_idea(
        db,
        IdeaCreate(
            title="Skip devil",
            description="Skip path.",
            categoryId="cat-culture",
        ),
    )

    from app.schemas.idea import DevilRequest

    updated = idea_service.submit_devil(
        db,
        idea,
        DevilRequest(answers=[], skipped=True),
    )
    assert updated.progressStatus == "submitted"
    assert updated.devilSkipped is True
    assert updated.aiReviewed is False


def test_generate_devil_questions_endpoint(
    authenticated_client, auth_headers, db
):
    idea = idea_service.create_idea(
        db,
        IdeaCreate(
            title="API questions",
            description="Generate via endpoint.",
            categoryId="cat-risk",
        ),
    )

    response = authenticated_client.post(
        f"/ideas/{idea.id}/devil-questions",
        headers=auth_headers,
    )
    assert response.status_code == 200
    body = response.json()
    assert len(body["questions"]) == 3

    db.refresh(idea)
    assert len(idea.devilQuestions) == 3


def test_legacy_devils_advocate_status_normalized_on_read(db):
    idea = idea_service.create_idea(
        db,
        IdeaCreate(
            title="Legacy status",
            description="Old devil's advocate status in DB.",
            categoryId="cat-product",
        ),
    )
    idea.progressStatus = "devils_advocate"
    idea.aiReviewed = True
    db.commit()

    loaded = idea_service.get_idea(db, idea.id)
    assert loaded is not None
    assert loaded.progressStatus == "submitted"
    assert loaded.aiReviewed is True
