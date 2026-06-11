import { combinedContentHash, contentHash } from "../utils/contentHash";

export function buildTranslationCacheKey(contentType, contentId, lang, sourceText) {
  const type = String(contentType || "text");
  const id = String(contentId);
  const targetLang = lang === "tr" ? "tr" : "en";
  const hash = contentHash(sourceText);
  return `${type}-${id}-${targetLang}-${hash}`;
}

export function resolveContentType(bundleId, contentId) {
  const bundle = String(bundleId || "");
  const id = String(contentId);

  if (bundle.startsWith("comments-")) return "comment";
  if (bundle.startsWith("idea-analysis-")) {
    const ideaId = bundle.replace("idea-analysis-", "");
    return { contentType: "strategicAnalysis", scopedId: `${ideaId}-${id}` };
  }
  if (bundle.startsWith("idea-body-")) return { contentType: "ideaBody", scopedId: id };
  if (bundle.startsWith("idea-embedded-refs-")) {
    const ideaId = bundle.replace("idea-embedded-refs-", "");
    return { contentType: "aiEnhancement", scopedId: `${ideaId}-${id}` };
  }
  if (bundle.startsWith("review-")) {
    const ideaId = bundle.replace("review-", "");
    return { contentType: "validation", scopedId: `${ideaId}-${id}` };
  }
  if (bundle.startsWith("idea-detail-")) {
    return { contentType: "ideaDetail", scopedId: `${bundle.replace("idea-detail-", "")}-${id}` };
  }

  return { contentType: "text", scopedId: `${bundle}:${id}` };
}

export function cacheKeyForRequest(bundleId, contentId, lang, sourceText) {
  const resolved = resolveContentType(bundleId, contentId);
  if (typeof resolved === "string") {
    return buildTranslationCacheKey(resolved, contentId, lang, sourceText);
  }
  return buildTranslationCacheKey(
    resolved.contentType,
    resolved.scopedId,
    lang,
    sourceText
  );
}

export function ideaTranslationCacheKey(ideaId, lang, title, description) {
  const targetLang = lang === "tr" ? "tr" : "en";
  const hash = combinedContentHash(title, description);
  return `idea-${String(ideaId)}-${targetLang}-${hash}`;
}

export function reviewTranslationCacheKey(ideaId, lang, pairs) {
  const targetLang = lang === "tr" ? "tr" : "en";
  const hash = combinedContentHash(
    ...(pairs || []).flatMap((pair) => [pair.question, pair.answer])
  );
  return `validation-${String(ideaId)}-${targetLang}-${hash}`;
}
