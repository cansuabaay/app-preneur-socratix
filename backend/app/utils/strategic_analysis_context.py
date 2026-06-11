import re
from typing import Any

from app.models.idea import Idea

REFINEMENT_SPLIT = re.compile(r"\n\n\[AI refinement\]\s*", re.IGNORECASE)


def _pair_question(entry: Any, fallback: str = "") -> str:
    if isinstance(entry, dict):
        return str(entry.get("question") or entry.get("text") or fallback or "").strip()
    return str(fallback or "").strip()


def _pair_answer(entry: Any) -> str:
    if isinstance(entry, dict):
        return str(entry.get("answer") or "").strip()
    return str(entry or "").strip()


def build_strategic_analysis_context(idea: Idea) -> dict[str, Any]:
    raw_description = str(idea.description or "").strip()
    segments = REFINEMENT_SPLIT.split(raw_description)
    description_body = (segments[0] if segments else raw_description).strip()
    accepted_improvements = [chunk.strip() for chunk in segments[1:] if chunk.strip()]

    challenge_qa: list[dict[str, str]] = []
    devil_answers = idea.devilAnswers or []
    devil_questions = idea.devilQuestions or []
    for index, entry in enumerate(devil_answers):
        answer = _pair_answer(entry)
        if not answer:
            continue
        question = _pair_question(entry, str(devil_questions[index] if index < len(devil_questions) else ""))
        challenge_qa.append({"question": question, "answer": answer})

    comments: list[dict[str, str]] = []
    for entry in idea.comments or []:
        if not isinstance(entry, dict):
            continue
        body = str(entry.get("body") or "").strip()
        if not body:
            continue
        comments.append(
            {
                "author": str(entry.get("authorName") or "Colleague").strip(),
                "body": body,
            }
        )

    voters = idea.voters or []
    voter_names = []
    for voter in voters:
        if isinstance(voter, dict):
            name = str(voter.get("name") or "").strip()
            if name:
                voter_names.append(name)

    return {
        "title": str(idea.title or "").strip(),
        "description": raw_description,
        "descriptionBody": description_body,
        "categoryId": idea.categoryId,
        "votes": int(idea.votes or 0),
        "voterNames": voter_names,
        "devilSkipped": bool(idea.devilSkipped),
        "challengeQa": challenge_qa,
        "acceptedAiImprovements": accepted_improvements,
        "comments": comments,
    }
