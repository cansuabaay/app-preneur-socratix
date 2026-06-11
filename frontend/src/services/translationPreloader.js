import { ideasApi } from "./api";
import { getCachedIdeaTranslation, setCachedIdeaTranslation } from "./ideaTranslationCache";
import { preloadTranslations } from "./translationCoordinator";
import { parseAiRefinementsFromDescription } from "../utils/parseAiRefinements";
import { normalizeStrategicAnalysis } from "../utils/strategicAnalysis";
import { parseReviewPairs } from "../utils/reviewAnswers";
import { textMatchesLocale } from "../utils/textLocale";

function oppositeLocale(language) {
  return language === "tr" ? "en" : "tr";
}

function descriptionBodyForIdea(idea) {
  const { body } = parseAiRefinementsFromDescription(idea?.description ?? "");
  return body || idea?.description || "";
}

function buildIdeaDetailTextRequests(idea) {
  if (!idea?.id) return [];

  const ideaId = String(idea.id);
  const bodyBundle = `idea-body-${ideaId}`;
  const embeddedBundle = `idea-embedded-refs-${ideaId}`;
  const requests = [];

  const parsed = parseAiRefinementsFromDescription(idea.description ?? "");
  if (parsed.refinements.length > 0 && parsed.body) {
    requests.push({
      bundleId: bodyBundle,
      contentId: "desc-body",
      text: parsed.body,
    });
  }

  parsed.refinements.forEach((item, index) => {
    if (item.text) {
      requests.push({
        bundleId: embeddedBundle,
        contentId: `embedded-ref-${index}`,
        text: item.text,
      });
    }
    if (item.title) {
      requests.push({
        bundleId: embeddedBundle,
        contentId: `embedded-ref-${index}-title`,
        text: item.title,
      });
    }
  });

  const analysis = normalizeStrategicAnalysis(idea.strategicAnalysis);
  if (analysis) {
    if (analysis.businessValueSummary) {
      requests.push({
        bundleId: `idea-analysis-${ideaId}`,
        contentId: "business-summary",
        text: analysis.businessValueSummary,
      });
    }
    if (analysis.validationSummary) {
      requests.push({
        bundleId: `idea-analysis-${ideaId}`,
        contentId: "validation-summary",
        text: analysis.validationSummary,
      });
    }
    if (analysis.recommendedNextStep) {
      requests.push({
        bundleId: `idea-analysis-${ideaId}`,
        contentId: "next-step",
        text: analysis.recommendedNextStep,
      });
    }
    if (analysis.impactLevel) {
      requests.push({
        bundleId: `idea-analysis-${ideaId}`,
        contentId: "impact-level",
        text: analysis.impactLevel,
      });
    }
    (analysis.strengths || []).forEach((item, index) => {
      if (item) {
        requests.push({
          bundleId: `idea-analysis-${ideaId}`,
          contentId: `strength-${index}`,
          text: item,
        });
      }
    });
    (analysis.risks || []).forEach((item, index) => {
      if (item) {
        requests.push({
          bundleId: `idea-analysis-${ideaId}`,
          contentId: `risk-${index}`,
          text: item,
        });
      }
    });
  }

  const reviewPairs = parseReviewPairs(idea);
  const reviewBundle = `review-${ideaId}`;
  reviewPairs.forEach((pair, index) => {
    if (pair.question) {
      requests.push({
        bundleId: reviewBundle,
        contentId: `q-${index}`,
        text: pair.question,
      });
    }
    if (pair.answer) {
      requests.push({
        bundleId: reviewBundle,
        contentId: `a-${index}`,
        text: pair.answer,
      });
    }
  });

  const comments = [...(idea.comments || [])].reverse();
  const commentBundle = `comments-${ideaId}`;
  comments.forEach((comment) => {
    const body = String(comment?.body || "").trim();
    if (comment?.id && body) {
      requests.push({
        bundleId: commentBundle,
        contentId: String(comment.id),
        text: body,
      });
    }
  });

  return requests;
}

function preloadIdeaTitleDescription(idea, lang) {
  const id = String(idea.id);
  const title = idea.title || "";
  const description = descriptionBodyForIdea(idea);
  const cached = getCachedIdeaTranslation(id, lang, title, description);
  if (cached?.title && cached?.description) return;

  const titleOk = !title.trim() || textMatchesLocale(title, lang);
  const descriptionOk = !description.trim() || textMatchesLocale(description, lang);
  if (titleOk && descriptionOk) {
    setCachedIdeaTranslation(id, lang, { title, description, translated: false }, title, description);
    return;
  }

  ideasApi
    .translateBatch({
      targetLang: lang,
      items: [{ id, title, description }],
    })
    .then((result) => {
      for (const item of result?.items || []) {
        if (!item?.id) continue;
        setCachedIdeaTranslation(item.id, lang, item, title, description);
      }
    })
    .catch(() => {});
}

/** Silently warm cache for the opposite UI language after content loads. */
export function preloadIdeaDetailTranslations(idea, currentLanguage) {
  if (!idea?.id) return;

  const targetLang = oppositeLocale(currentLanguage);
  preloadIdeaTitleDescription(idea, targetLang);
  preloadTranslations(buildIdeaDetailTextRequests(idea), targetLang);
}

export function preloadIdeasFeedTranslations(ideas, currentLanguage) {
  const targetLang = oppositeLocale(currentLanguage);
  const missing = [];

  for (const idea of ideas || []) {
    if (!idea?.id) continue;
    const id = String(idea.id);
    const title = idea.title || "";
    const description = descriptionBodyForIdea(idea);
    const cached = getCachedIdeaTranslation(id, targetLang, title, description);
    if (cached?.title && cached?.description) continue;

    const titleOk = !title.trim() || textMatchesLocale(title, targetLang);
    const descriptionOk = !description.trim() || textMatchesLocale(description, targetLang);
    if (titleOk && descriptionOk) {
      setCachedIdeaTranslation(
        id,
        targetLang,
        { title, description, translated: false },
        title,
        description
      );
      continue;
    }

    missing.push({ id, title, description });
  }

  if (missing.length === 0) return;

  ideasApi
    .translateBatch({ targetLang, items: missing })
    .then((result) => {
      for (const item of result?.items || []) {
        if (!item?.id) continue;
        const source = missing.find((entry) => String(entry.id) === String(item.id));
        if (!source) continue;
        setCachedIdeaTranslation(
          item.id,
          targetLang,
          item,
          source.title,
          source.description
        );
      }
    })
    .catch(() => {});
}
