import {
  cacheKeyForRequest,
  reviewTranslationCacheKey,
} from "./translationCacheKeys";
import {
  getCachedString,
  getCachedTranslation,
  readLegacySessionText,
  setCachedTranslation,
} from "./translationCacheCore";

function legacyTextKey(bundleId, itemId, lang) {
  return `${bundleId}:${String(itemId)}:${lang}`;
}

export function getCachedTextTranslation(bundleId, itemId, lang, sourceText = "") {
  const source = String(sourceText || "").trim();
  if (source) {
    const key = cacheKeyForRequest(bundleId, itemId, lang, source);
    const cached = getCachedString(key);
    if (cached) return cached;
  }

  const legacy = readLegacySessionText(legacyTextKey(bundleId, itemId, lang));
  if (legacy) {
    if (source) {
      setCachedTextTranslation(bundleId, itemId, lang, legacy, source);
    }
    return legacy;
  }

  return null;
}

export function setCachedTextTranslation(bundleId, itemId, lang, text, sourceText = "") {
  const value = String(text || "");
  const source = String(sourceText || value).trim();
  const key = cacheKeyForRequest(bundleId, itemId, lang, source);
  setCachedTranslation(key, value);
}

export function getCachedReviewTranslation(ideaId, lang, sourcePairs = null) {
  if (sourcePairs?.length) {
    const key = reviewTranslationCacheKey(ideaId, lang, sourcePairs);
    const cached = getCachedTranslation(key);
    if (Array.isArray(cached) && cached.length > 0) {
      return cached;
    }
  }

  const legacy = readLegacySessionText(`review:${ideaId}:${lang}`);
  if (Array.isArray(legacy) && legacy.length > 0) {
    if (sourcePairs?.length) {
      setCachedReviewTranslation(ideaId, lang, legacy, sourcePairs);
    }
    return legacy;
  }

  return null;
}

export function setCachedReviewTranslation(ideaId, lang, pairs, sourcePairs = pairs) {
  const value = (pairs || []).map((pair) => ({
    question: String(pair.question || ""),
    answer: String(pair.answer || ""),
  }));
  const key = reviewTranslationCacheKey(ideaId, lang, sourcePairs);
  setCachedTranslation(key, value);
}

export function getCachedCommentTranslation(commentId, lang, ideaId = "global", sourceText = "") {
  return getCachedTextTranslation(`comments-${ideaId}`, commentId, lang, sourceText);
}

export function setCachedCommentTranslation(commentId, lang, text, ideaId = "global", sourceText = "") {
  setCachedTextTranslation(`comments-${ideaId}`, commentId, lang, text, sourceText);
}
