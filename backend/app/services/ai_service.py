import json
import re
from typing import Any

import httpx

from app.config import get_ai_api_key, get_ai_base_url, get_ai_model, get_ai_provider

FALLBACK_RESPONSE_EN: dict[str, Any] = {
    "impactLevel": "Medium",
    "impactScore": 5,
    "strengths": ["Addresses a clear operational pain point."],
    "risks": ["AI API key is not configured."],
    "validationSummary": "AI Challenge responses were not evaluated because the AI service is not configured.",
    "recommendedNextStep": "Configure OPENAI_API_KEY and rerun strategic analysis.",
    "businessValueSummary": "Fallback response because AI service is not configured.",
    "improvementSuggestions": [],
    "feasibilityScore": 5,
    "summary": "Fallback response because AI service is not configured.",
}

FALLBACK_RESPONSE_TR: dict[str, Any] = {
    "impactLevel": "Orta",
    "impactScore": 5,
    "strengths": ["Net bir operasyonel soruna odaklanıyor."],
    "risks": ["AI API anahtarı yapılandırılmamış."],
    "validationSummary": "AI servisi yapılandırılmadığı için AI Değerlendirme yanıtları analiz edilemedi.",
    "recommendedNextStep": "OPENAI_API_KEY yapılandırıp stratejik analizi yeniden çalıştırın.",
    "businessValueSummary": "AI servisi yapılandırılmadığı için yedek yanıt döndürüldü.",
    "improvementSuggestions": [],
    "feasibilityScore": 5,
    "summary": "AI servisi yapılandırılmadığı için yedek yanıt döndürüldü.",
}

FALLBACK_RESPONSE = FALLBACK_RESPONSE_EN

IMPROVE_FALLBACK_EN: dict[str, Any] = {
    "improvements": [
        {
            "category": "target_users",
            "title": "Target audience",
            "detail": "Specify which employee group this idea is designed for.",
        },
        {
            "category": "success_metrics",
            "title": "Success metrics",
            "detail": "Add a KPI or metric to measure success.",
        },
    ],
    "similarWarnings": [],
    "summary": "Fallback response because AI service is not configured.",
}

IMPROVE_FALLBACK_TR: dict[str, Any] = {
    "improvements": [
        {
            "category": "target_users",
            "title": "Hedef kitle",
            "detail": "Bu fikrin hangi çalışan grubu için geliştirildiğini daha net belirt.",
        },
        {
            "category": "success_metrics",
            "title": "Başarı ölçümü",
            "detail": "Başarıyı ölçmek için KPI veya metrik ekle.",
        },
    ],
    "similarWarnings": [],
    "summary": "AI servisi yapılandırılmadığı için yedek yanıt döndürüldü.",
}

IMPROVE_FALLBACK = IMPROVE_FALLBACK_EN

DEVIL_QUESTIONS_FALLBACK_EN: list[str] = [
    "What is the weakest assumption in this plan, and how would you validate it in the first 30 days?",
    "Which stakeholders could block adoption, and what is your concrete mitigation?",
    "What measurable signal within one quarter would show this idea is not working?",
]

DEVIL_QUESTIONS_FALLBACK_TR: list[str] = [
    "Bu plandaki en zayıf varsayım nedir ve ilk 30 günde nasıl doğrularsınız?",
    "Hangi paydaşlar benimsemeyi engelleyebilir ve somut önleminiz nedir?",
    "Bir çeyrek içinde bu fikrin işe yaramadığını gösterecek ölçülebilir sinyal nedir?",
]

DEVIL_QUESTIONS_FALLBACK = DEVIL_QUESTIONS_FALLBACK_EN

SUPPORTED_TRANSLATION_LANGS = frozenset({"en", "tr"})


class AIService:
    def is_configured(self) -> bool:
        return bool(get_ai_api_key())

    def _normalize_target_language(self, target_language: str | None) -> str:
        lang = (target_language or "en").strip().lower()
        return lang if lang in SUPPORTED_TRANSLATION_LANGS else "en"

    def _language_instruction(self, target_language: str | None) -> str:
        lang = self._normalize_target_language(target_language)
        if lang == "tr":
            return (
                "Respond only in Turkish. All suggestions, feedback, questions, "
                "summaries, and explanations must be in Turkish."
            )
        return (
            "Respond only in English. All suggestions, feedback, questions, "
            "summaries, and explanations must be in English."
        )

    def _analysis_fallback(self, target_language: str | None) -> dict[str, Any]:
        if self._normalize_target_language(target_language) == "tr":
            return {**FALLBACK_RESPONSE_TR}
        return {**FALLBACK_RESPONSE_EN}

    def _improve_fallback(self, target_language: str | None) -> dict[str, Any]:
        if self._normalize_target_language(target_language) == "tr":
            return {**IMPROVE_FALLBACK_TR}
        return {**IMPROVE_FALLBACK_EN}

    def analyze_idea(
        self,
        idea_context: dict[str, Any],
        target_language: str = "en",
    ) -> tuple[dict[str, Any], bool]:
        """Returns (analysis payload, used_live_ai)."""
        lang = self._normalize_target_language(target_language)
        if not self.is_configured():
            return self._analysis_fallback(lang), False

        prompt = self._build_prompt(idea_context, lang)

        try:
            raw_content = self._call_chat_api(prompt, lang)
            return self._parse_response(raw_content), True
        except Exception:
            fallback = self._analysis_fallback(lang)
            fallback["risks"] = ["AI service request failed."]
            fallback["recommendedNextStep"] = (
                "Verify OPENAI_API_KEY, AI_MODEL, and network access."
                if lang == "en"
                else "OPENAI_API_KEY, AI_MODEL ve ağ erişimini doğrulayın."
            )
            return fallback, False

    def improve_idea(
        self,
        title: str,
        description: str,
        category_id: str | None,
        target_language: str = "en",
    ) -> tuple[dict[str, Any], bool]:
        """Returns (improve payload, used_live_ai)."""
        lang = self._normalize_target_language(target_language)
        if not self.is_configured():
            return self._improve_fallback(lang), False

        prompt = self._build_improve_prompt(title, description, category_id, lang)

        try:
            raw_content = self._call_chat_api(prompt, lang)
            return self._parse_improve_response(raw_content), True
        except Exception:
            fallback = self._improve_fallback(lang)
            fallback["summary"] = (
                "Unable to complete AI improvement analysis. Please try again later."
                if lang == "en"
                else "AI iyileştirme analizi tamamlanamadı. Lütfen daha sonra tekrar deneyin."
            )
            return fallback, False

    def _devil_questions_fallback(self, target_language: str | None) -> list[str]:
        lang = self._normalize_target_language(target_language)
        if lang == "tr":
            return list(DEVIL_QUESTIONS_FALLBACK_TR)
        return list(DEVIL_QUESTIONS_FALLBACK_EN)

    def translate_texts_batch(
        self,
        items: list[dict[str, str]],
        target_lang: str,
    ) -> tuple[list[dict[str, Any]], bool]:
        """Translate arbitrary UI strings for display only."""
        lang = target_lang if target_lang in SUPPORTED_TRANSLATION_LANGS else "en"
        if not items:
            return [], False

        if not self.is_configured():
            return [
                {
                    "id": item["id"],
                    "text": item["text"],
                    "translated": False,
                }
                for item in items
            ], False

        prompt = self._build_translate_texts_prompt(items, lang)

        try:
            raw_content = self._call_chat_api(prompt, lang)
            return self._parse_translate_texts_response(raw_content, items), True
        except Exception:
            return [
                {
                    "id": item["id"],
                    "text": item["text"],
                    "translated": False,
                }
                for item in items
            ], False

    def translate_batch(
        self,
        items: list[dict[str, str]],
        target_lang: str,
    ) -> tuple[list[dict[str, Any]], bool]:
        """Translate idea title/description pairs. Original text is never mutated."""
        lang = target_lang if target_lang in SUPPORTED_TRANSLATION_LANGS else "en"
        if not items:
            return [], False

        if not self.is_configured():
            return [
                {
                    "id": item["id"],
                    "title": item["title"],
                    "description": item["description"],
                    "translated": False,
                }
                for item in items
            ], False

        prompt = self._build_translate_batch_prompt(items, lang)

        try:
            raw_content = self._call_chat_api(prompt, lang)
            parsed_items = self._parse_translate_batch_response(raw_content, items)
            return parsed_items, True
        except Exception:
            return [
                {
                    "id": item["id"],
                    "title": item["title"],
                    "description": item["description"],
                    "translated": False,
                }
                for item in items
            ], False

    def _build_translate_batch_prompt(
        self,
        items: list[dict[str, str]],
        target_lang: str,
    ) -> str:
        lang_name = "Turkish" if target_lang == "tr" else "English"
        blocks = []
        for idx, item in enumerate(items):
            blocks.append(
                f'Item {idx} (id: {item["id"]}):\n'
                f'Title: {item["title"].strip()}\n'
                f'Description: {item["description"].strip()}'
            )

        return (
            f"You are a professional translator for a corporate innovation platform. "
            f"Translate each item below into {lang_name}. "
            "Return JSON only with:\n"
            "items: array of objects with id (string), title (string), description (string)\n"
            "Preserve meaning, tone, and line breaks. "
            f"If an item is already in {lang_name}, return it unchanged.\n\n"
            + "\n\n".join(blocks)
        )

    def _parse_translate_batch_response(
        self,
        content: str,
        source_items: list[dict[str, str]],
    ) -> list[dict[str, Any]]:
        parsed = self._parse_json_object(content)
        raw_items = parsed.get("items") or []
        by_id: dict[str, dict[str, Any]] = {}

        ordered_translations: list[dict[str, Any] | None] = []

        if isinstance(raw_items, list):
            for entry in raw_items:
                if not isinstance(entry, dict):
                    ordered_translations.append(None)
                    continue
                item_id = str(entry.get("id") or "").strip()
                title = str(entry.get("title") or "").strip()
                description = str(entry.get("description") or "").strip()
                if title and description:
                    payload = {
                        "id": item_id,
                        "title": title,
                        "description": description,
                        "translated": True,
                    }
                    ordered_translations.append(payload)
                    if item_id:
                        by_id[item_id] = payload
                else:
                    ordered_translations.append(None)

        results: list[dict[str, Any]] = []
        for idx, source in enumerate(source_items):
            item_id = str(source["id"])
            translated = by_id.get(item_id)
            if not translated and idx < len(ordered_translations):
                candidate = ordered_translations[idx]
                if candidate:
                    translated = {**candidate, "id": item_id}
            if translated:
                results.append({**translated, "id": item_id})
                continue
            results.append(
                {
                    "id": item_id,
                    "title": source["title"],
                    "description": source["description"],
                    "translated": False,
                }
            )
        return results

    def generate_devil_questions(
        self,
        title: str,
        description: str,
        category_id: str | None,
        target_language: str = "en",
    ) -> tuple[list[str], bool]:
        """Returns (exactly 3 questions, used_live_ai)."""
        lang = self._normalize_target_language(target_language)
        fallback = self._devil_questions_fallback(lang)
        if not self.is_configured():
            return fallback, False

        prompt = self._build_devil_questions_prompt(
            title, description, category_id, lang
        )

        try:
            raw_content = self._call_chat_api(prompt, lang)
            questions = self._parse_devil_questions_response(raw_content)
            return questions, True
        except Exception:
            return fallback, False

    def _build_devil_questions_prompt(
        self,
        title: str,
        description: str,
        category_id: str | None,
        target_language: str = "en",
    ) -> str:
        category_line = category_id or "unspecified"
        return (
            f"{self._language_instruction(target_language)}\n\n"
            "You are a critical innovation manager challenging a draft idea before publication. "
            "Given the idea below, return JSON only with:\n"
            "questions: string[] (exactly 3 challenging, specific questions covering "
            "feasibility, risks, scalability, data/privacy, cost, and adoption)\n\n"
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
            q for q in DEVIL_QUESTIONS_FALLBACK_EN if q not in cleaned
        ]
        return merged[:3]

    def _build_translate_texts_prompt(
        self,
        items: list[dict[str, str]],
        target_lang: str,
    ) -> str:
        lang_name = "Turkish" if target_lang == "tr" else "English"
        blocks = []
        for idx, item in enumerate(items):
            blocks.append(f'Item {idx} (id: {item["id"]}):\n{item["text"].strip()}')

        return (
            f"You are a professional translator for a corporate innovation platform. "
            f"Translate each text item below into {lang_name}. "
            "Return JSON only with:\n"
            "items: array of objects with id (string), text (string)\n"
            "Preserve meaning and tone. "
            f"If a text is already in {lang_name}, return it unchanged.\n\n"
            + "\n\n".join(blocks)
        )

    def _parse_translate_texts_response(
        self,
        content: str,
        source_items: list[dict[str, str]],
    ) -> list[dict[str, Any]]:
        parsed = self._parse_json_object(content)
        raw_items = parsed.get("items") or []
        by_id: dict[str, dict[str, Any]] = {}
        ordered: list[dict[str, Any] | None] = []

        if isinstance(raw_items, list):
            for entry in raw_items:
                if not isinstance(entry, dict):
                    ordered.append(None)
                    continue
                item_id = str(entry.get("id") or "").strip()
                text = str(entry.get("text") or "").strip()
                if text:
                    payload = {"id": item_id, "text": text, "translated": True}
                    ordered.append(payload)
                    if item_id:
                        by_id[item_id] = payload
                else:
                    ordered.append(None)

        results: list[dict[str, Any]] = []
        for idx, source in enumerate(source_items):
            item_id = str(source["id"])
            translated = by_id.get(item_id)
            if not translated and idx < len(ordered):
                candidate = ordered[idx]
                if candidate:
                    translated = {**candidate, "id": item_id}
            if translated:
                results.append({**translated, "id": item_id})
                continue
            results.append(
                {
                    "id": item_id,
                    "text": source["text"],
                    "translated": False,
                }
            )
        return results

    def _build_improve_prompt(
        self,
        title: str,
        description: str,
        category_id: str | None,
        target_language: str = "en",
    ) -> str:
        category_line = category_id or "unspecified"
        return (
            f"{self._language_instruction(target_language)}\n\n"
            "You are an innovation coach helping employees refine draft ideas before submission. "
            "Review the idea below and return JSON only with:\n"
            "improvements: array of 3 to 5 objects with category, title, detail where category is one of: "
            "problem_definition, target_users, business_value, implementation, success_metrics. "
            "title must be a short thematic headline (2 to 6 words, never a truncated sentence). "
            "detail must be the full actionable suggestion sentence and must not repeat the title.\n"
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
            improvements = [improvements]
        if not isinstance(warnings, list):
            warnings = []

        normalized_improvements = []
        for idx, item in enumerate(improvements):
            if isinstance(item, dict):
                detail = str(item.get("detail") or item.get("text") or "").strip()
                if not detail:
                    continue
                normalized_improvements.append(
                    {
                        "category": str(item.get("category") or "general").strip()
                        or "general",
                        "title": str(item.get("title") or "").strip(),
                        "detail": detail,
                    }
                )
            elif isinstance(item, str) and item.strip():
                normalized_improvements.append(
                    {
                        "category": "general",
                        "title": "",
                        "detail": item.strip(),
                    }
                )

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
            "improvements": normalized_improvements,
            "similarWarnings": normalized_warnings,
            "summary": str(summary),
        }

    def _format_context_section(self, label: str, lines: list[str]) -> str:
        if not lines:
            return f"{label}:\n(none)\n"
        return f"{label}:\n" + "\n".join(f"- {line}" for line in lines) + "\n"

    def _build_prompt(
        self,
        idea_context: dict[str, Any],
        target_language: str = "en",
    ) -> str:
        title = str(idea_context.get("title") or "").strip()
        description = str(idea_context.get("description") or "").strip()
        category_line = str(idea_context.get("categoryId") or "unspecified").strip()
        votes = int(idea_context.get("votes") or 0)
        devil_skipped = bool(idea_context.get("devilSkipped"))

        challenge_lines: list[str] = []
        for pair in idea_context.get("challengeQa") or []:
            if not isinstance(pair, dict):
                continue
            question = str(pair.get("question") or "").strip()
            answer = str(pair.get("answer") or "").strip()
            if question or answer:
                challenge_lines.append(f"Q: {question or '(missing)'} | A: {answer or '(missing)'}")

        improvement_lines = [
            str(item).strip()
            for item in (idea_context.get("acceptedAiImprovements") or [])
            if str(item).strip()
        ]

        comment_lines: list[str] = []
        for entry in idea_context.get("comments") or []:
            if not isinstance(entry, dict):
                continue
            author = str(entry.get("author") or "Colleague").strip()
            body = str(entry.get("body") or "").strip()
            if body:
                comment_lines.append(f"{author}: {body}")

        voter_names = [
            str(name).strip()
            for name in (idea_context.get("voterNames") or [])
            if str(name).strip()
        ]
        voter_line = ", ".join(voter_names) if voter_names else "(none)"

        challenge_status = (
            "skipped by submitter"
            if devil_skipped
            else ("completed" if challenge_lines else "not completed")
        )

        context_block = (
            f"Title: {title}\n"
            f"Category ID: {category_line}\n"
            f"Votes: {votes}\n"
            f"Voters: {voter_line}\n"
            f"AI Challenge status: {challenge_status}\n\n"
            f"Description:\n{description}\n\n"
            f"{self._format_context_section('AI Challenge Q&A', challenge_lines)}"
            f"{self._format_context_section('Accepted AI improvement refinements', improvement_lines)}"
            f"{self._format_context_section('Discussion comments', comment_lines)}"
        )

        return (
            f"{self._language_instruction(target_language)}\n\n"
            "You are an executive innovation advisor evaluating a submitted corporate idea. "
            "Use the full innovation context below — not only the title and description. "
            "Provide strategic analysis for managers and employees. Return JSON only with:\n"
            "impactLevel: string (High, Medium, or Low)\n"
            "impactScore: number between 1 and 10\n"
            "strengths: string[] (2 to 4 business and technical advantages)\n"
            "risks: string[] (2 to 4 implementation, adoption, cost, or security risks)\n"
            "validationSummary: string (assess how convincingly the submitter answered AI Challenge questions; "
            "note gaps, strengths, and credibility)\n"
            "recommendedNextStep: string (concrete next actions such as pilot, prototype, or stakeholder review)\n"
            "businessValueSummary: string (short executive summary of business value)\n\n"
            f"{context_block}"
        )

    def _call_chat_api(self, prompt: str, target_language: str = "en") -> str:
        api_key = get_ai_api_key()
        base_url = get_ai_base_url().rstrip("/")
        url = f"{base_url}/chat/completions"
        provider = get_ai_provider()
        lang_instruction = self._language_instruction(target_language)

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
                    "content": (
                        "You return only valid JSON matching the requested schema. "
                        f"{lang_instruction}"
                    ),
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

        strengths = parsed.get("strengths") or []
        risks = parsed.get("risks") or []
        impact_level = str(parsed.get("impactLevel") or "").strip()
        impact_score = parsed.get("impactScore", parsed.get("feasibilityScore", 5))
        next_step = str(parsed.get("recommendedNextStep") or "").strip()
        validation_summary = str(parsed.get("validationSummary") or "").strip()
        business_summary = str(
            parsed.get("businessValueSummary") or parsed.get("summary") or ""
        ).strip()
        legacy_suggestions = parsed.get("improvementSuggestions") or []

        if not isinstance(strengths, list):
            strengths = [str(strengths)]
        if not isinstance(risks, list):
            risks = [str(risks)]
        if not isinstance(legacy_suggestions, list):
            legacy_suggestions = [str(legacy_suggestions)]

        try:
            score_int = int(round(float(impact_score)))
        except (TypeError, ValueError):
            score_int = 5
        score_int = max(1, min(10, score_int))

        if not impact_level:
            if score_int >= 8:
                impact_level = "High"
            elif score_int >= 5:
                impact_level = "Medium"
            else:
                impact_level = "Low"

        return {
            "impactLevel": impact_level,
            "impactScore": score_int,
            "strengths": [str(item) for item in strengths if str(item).strip()],
            "risks": [str(item) for item in risks if str(item).strip()],
            "validationSummary": validation_summary,
            "recommendedNextStep": next_step,
            "businessValueSummary": business_summary,
            "improvementSuggestions": [
                str(item) for item in legacy_suggestions if str(item).strip()
            ],
            "feasibilityScore": score_int,
            "summary": business_summary or validation_summary,
        }


ai_service = AIService()
