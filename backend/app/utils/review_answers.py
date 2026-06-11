from typing import Any


def answer_text(entry: Any) -> str:
    if isinstance(entry, dict):
        return str(entry.get("answer") or "").strip()
    return str(entry or "").strip()


def question_text(entry: Any, fallback: str = "") -> str:
    if isinstance(entry, dict):
        return str(entry.get("question") or entry.get("text") or fallback).strip()
    return str(fallback or "").strip()


def build_review_pairs(
    questions: list[Any],
    answers: list[Any],
    *,
    review_answers: list[Any] | None = None,
) -> list[dict[str, str]]:
    if review_answers:
        pairs: list[dict[str, str]] = []
        for item in review_answers:
            answer = answer_text(item)
            if not answer:
                continue
            pairs.append(
                {
                    "question": question_text(item),
                    "answer": answer,
                }
            )
        return pairs

    q_list = [str(q).strip() for q in questions]
    pairs = []
    for i, entry in enumerate(answers):
        fallback_q = q_list[i] if i < len(q_list) else ""
        answer = answer_text(entry)
        if not answer:
            continue
        pairs.append(
            {
                "question": question_text(entry, fallback_q),
                "answer": answer,
            }
        )
    return pairs


def pairs_from_stored(
    questions: list[Any] | None,
    answers: list[Any] | None,
) -> list[dict[str, str]]:
    stored_questions = list(questions or [])
    stored_answers = list(answers or [])
    if not stored_answers:
        return []

    if stored_answers and isinstance(stored_answers[0], dict):
        return [
            {
                "question": question_text(item),
                "answer": answer_text(item),
            }
            for item in stored_answers
            if answer_text(item)
        ]

    count = max(
        len(stored_questions),
        len([a for a in stored_answers if answer_text(a)]),
    )
    pairs: list[dict[str, str]] = []
    for i in range(count):
        answer = answer_text(stored_answers[i]) if i < len(stored_answers) else ""
        if not answer:
            continue
        question = (
            str(stored_questions[i]).strip()
            if i < len(stored_questions)
            else ""
        )
        pairs.append({"question": question, "answer": answer})
    return pairs
