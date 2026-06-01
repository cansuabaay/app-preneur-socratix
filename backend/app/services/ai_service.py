import json
import re
from typing import Any

import httpx

from app.config import get_ai_api_key, get_ai_base_url, get_ai_model, get_ai_provider

FALLBACK_RESPONSE: dict[str, Any] = {
    "risks": ["AI API key is not configured."],
    "improvementSuggestions": ["Add OPENAI_API_KEY to backend .env."],
    "feasibilityScore": 5,
    "summary": "Fallback response because AI service is not configured.",
}

IMPROVE_FALLBACK: dict[str, Any] = {
    "improvements": [
        "Add OPENAI_API_KEY to backend .env to receive tailored improvement suggestions.",
    ],
    "similarWarnings": [],
    "summary": "Fallback response because AI service is not configured.",
}

DEVIL_QUESTIONS_FALLBACK: list[str] = [
    "What is the weakest assumption in this plan, and how would you validate it in the first 30 days?",
    "Which stakeholders could block adoption, and what is your concrete mitigation?",
    "What measurable signal within one quarter would show this idea is not working?",
]


class AIService:
    def is_configured(self) -> bool:
        return bool(get_ai_api_key())

    def analyze_idea(
        self,
        title: str,
        description: str,
        category_id: str | None,
    ) -> tuple[dict[str, Any], bool]:
        """Returns (analysis payload, used_live_ai)."""
        if not self.is_configured():
            return {**FALLBACK_RESPONSE}, False

        prompt = self._build_prompt(title, description, category_id)

        try:
            raw_content = self._call_chat_api(prompt)
            return self._parse_response(raw_content), True
        except Exception:
            return {
                "risks": ["AI service request failed."],
                "improvementSuggestions": [
                    "Verify OPENAI_API_KEY, AI_MODEL, and network access.",
                    "Check provider status if using OpenRouter.",
                ],
                "feasibilityScore": 5,
                "summary": "Unable to complete AI analysis. Please try again later.",
            }, False

    def improve_idea(
        self,
        title: str,
        description: str,
        category_id: str | None,
    ) -> tuple[dict[str, Any], bool]:
        """Returns (improve payload, used_live_ai)."""
        if not self.is_configured():
            return {**IMPROVE_FALLBACK}, False

        prompt = self._build_improve_prompt(title, description, category_id)

        try:
            raw_content = self._call_chat_api(prompt)
            return self._parse_improve_response(raw_content), True
        except Exception:
            return {
                "improvements": [
                    "Clarify the target audience and the measurable outcome for the next quarter.",
                    "Verify API connectivity and try AI Improve again for tailored suggestions.",
                ],
                "similarWarnings": [],
                "summary": "Unable to complete AI improvement analysis. Please try again later.",
            }, False

    def generate_devil_questions(
        self,
        title: str,
        description: str,
        category_id: str | None,
    ) -> tuple[list[str], bool]:
        """Returns (exactly 3 questions, used_live_ai)."""
        if not self.is_configured():
            return list(DEVIL_QUESTIONS_FALLBACK), False

        prompt = self._build_devil_questions_prompt(title, description, category_id)

        try:
            raw_content = self._call_chat_api(prompt)
            questions = self._parse_devil_questions_response(raw_content)
            return questions, True
        except Exception:
            return list(DEVIL_QUESTIONS_FALLBACK), False

    def _build_devil_questions_prompt(
        self,
        title: str,
        description: str,
        category_id: str | None,
    ) -> str:
        category_line = category_id or "unspecified"
        return (
            "You are a devil's advocate for corporate innovation. "
            "Given the idea below, return JSON only with:\n"
            "questions: string[] (exactly 3 challenging, specific questions "
            "about risks, feasibility, and blind spots)\n\n"
            f"Title: {title.strip()}\n"
            f"Category ID: {category_line}\n"
            f"Description:\n{description.strip()}"
        )

    def _parse_devil_questions_response(self, content: str) -> list[str]:
        parsed = self._parse_json_object(content)
        questions = parsed.get("questions") or []

        if not isinstance(questions, list):
            questions = [str(questions)]

        cleaned = [str(q).strip() for q in questions if str(q).strip()]

        if len(cleaned) >= 3:
            return cleaned[:3]

        merged = cleaned + [
            q for q in DEVIL_QUESTIONS_FALLBACK if q not in cleaned
        ]
        return merged[:3]

    def _build_improve_prompt(
        self,
        title: str,
        description: str,
        category_id: str | None,
    ) -> str:
        category_line = category_id or "unspecified"
        return (
            "You are an innovation coach helping employees refine corporate innovation ideas. "
            "Review the idea below and return JSON only with:\n"
            "improvements: string[] (3 to 5 specific, actionable suggestions tied to this idea)\n"
            "similarWarnings: array of objects with title and detail (0 to 2 items; "
            "flag plausible overlap with other initiatives only when relevant)\n"
            "summary: string (one short paragraph on overall strength and gap)\n\n"
            f"Title: {title.strip()}\n"
            f"Category ID: {category_line}\n"
            f"Description:\n{description.strip()}"
        )

    def _parse_improve_response(self, content: str) -> dict[str, Any]:
        parsed = self._parse_json_object(content)

        improvements = parsed.get("improvements") or []
        warnings = parsed.get("similarWarnings") or []
        summary = parsed.get("summary") or ""

        if not isinstance(improvements, list):
            improvements = [str(improvements)]
        if not isinstance(warnings, list):
            warnings = []

        normalized_warnings = []
        for idx, item in enumerate(warnings):
            if isinstance(item, dict):
                normalized_warnings.append(
                    {
                        "title": str(item.get("title") or f"Note {idx + 1}"),
                        "detail": str(item.get("detail") or ""),
                    }
                )
            elif isinstance(item, str) and item.strip():
                normalized_warnings.append(
                    {"title": "Similar initiative", "detail": item.strip()}
                )

        return {
            "improvements": [str(item) for item in improvements if str(item).strip()],
            "similarWarnings": normalized_warnings,
            "summary": str(summary),
        }

    def _build_prompt(
        self,
        title: str,
        description: str,
        category_id: str | None,
    ) -> str:
        category_line = category_id or "unspecified"
        return (
            "You are a critical innovation advisor. Analyze this corporate innovation idea "
            "as a devil's advocate. Return JSON only with:\n"
            "risks: string[]\n"
            "improvementSuggestions: string[]\n"
            "feasibilityScore: number between 1 and 10\n"
            "summary: string\n\n"
            f"Title: {title.strip()}\n"
            f"Category ID: {category_line}\n"
            f"Description:\n{description.strip()}"
        )

    def _call_chat_api(self, prompt: str) -> str:
        api_key = get_ai_api_key()
        base_url = get_ai_base_url().rstrip("/")
        url = f"{base_url}/chat/completions"
        provider = get_ai_provider()

        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        }
        if provider == "openrouter":
            headers["HTTP-Referer"] = "http://localhost:5173"
            headers["X-Title"] = "Socratix"

        payload = {
            "model": get_ai_model(),
            "messages": [
                {
                    "role": "system",
                    "content": "You return only valid JSON matching the requested schema.",
                },
                {"role": "user", "content": prompt},
            ],
            "temperature": 0.4,
        }

        with httpx.Client(timeout=60.0) as client:
            response = client.post(url, headers=headers, json=payload)
            response.raise_for_status()
            data = response.json()

        choices = data.get("choices") or []
        if not choices:
            raise ValueError("AI response contained no choices")

        message = choices[0].get("message") or {}
        content = message.get("content")
        if not content or not str(content).strip():
            raise ValueError("AI response contained empty content")

        return str(content)

    def _parse_json_object(self, content: str) -> dict[str, Any]:
        text = content.strip()
        if text.startswith("```"):
            text = re.sub(r"^```(?:json)?\s*", "", text, flags=re.IGNORECASE)
            text = re.sub(r"\s*```$", "", text)

        parsed = json.loads(text)
        if not isinstance(parsed, dict):
            raise ValueError("AI response was not a JSON object")
        return parsed

    def _parse_response(self, content: str) -> dict[str, Any]:
        parsed = self._parse_json_object(content)

        risks = parsed.get("risks") or []
        suggestions = parsed.get("improvementSuggestions") or []
        score = parsed.get("feasibilityScore", 5)
        summary = parsed.get("summary") or ""

        if not isinstance(risks, list):
            risks = [str(risks)]
        if not isinstance(suggestions, list):
            suggestions = [str(suggestions)]

        try:
            score_int = int(round(float(score)))
        except (TypeError, ValueError):
            score_int = 5

        score_int = max(1, min(10, score_int))

        return {
            "risks": [str(item) for item in risks],
            "improvementSuggestions": [str(item) for item in suggestions],
            "feasibilityScore": score_int,
            "summary": str(summary),
        }


ai_service = AIService()
