import { ideaTranslationCacheKey } from "./translationCacheKeys";
import {
  getCachedObject,
  readLegacySessionIdea,
  setCachedTranslation,
} from "./translationCacheCore";

function legacyIdeaKey(ideaId, lang) {
  return `${String(ideaId)}:${lang}`;
}

export function getCachedIdeaTranslation(ideaId, lang, title = "", description = "") {
  const id = String(ideaId);
  const hasSource = String(title || description).trim();

  if (hasSource) {
    const key = ideaTranslationCacheKey(id, lang, title, description);
    const cached = getCachedObject(key);
    if (cached?.title && cached?.description) {
      return cached;
    }
  }

  const legacy = readLegacySessionIdea(legacyIdeaKey(id, lang));
  if (legacy?.title && legacy?.description) {
    if (hasSource) {
      setCachedIdeaTranslation(id, lang, legacy, title, description);
    }
    return legacy;
  }

  return null;
}

export function setCachedIdeaTranslation(ideaId, lang, payload, title = "", description = "") {
  const id = String(ideaId);
  const entry = {
    title: payload.title,
    description: payload.description,
    translated: Boolean(payload.translated),
  };

  const key = ideaTranslationCacheKey(
    id,
    lang,
    title || payload.title,
    description || payload.description
  );
  setCachedTranslation(key, entry);
}
