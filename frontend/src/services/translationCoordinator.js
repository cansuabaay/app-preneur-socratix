import { ideasApi } from "./api";
import {
  getCachedTextTranslation,
  setCachedTextTranslation,
} from "./textTranslationCache";
import { cacheKeyForRequest } from "./translationCacheKeys";
import { textMatchesLocale } from "../utils/textLocale";

const MAX_BATCH_SIZE = 50;
const FLUSH_DELAY_MS = 8;

/** @type {Map<string, Map<string, { bundleId: string, contentId: string, text: string, resolvers: Array<{ resolve: (v: string) => void, reject: (e?: unknown) => void }> }>>} */
const queuesByLang = new Map();

/** @type {Map<string, ReturnType<typeof setTimeout>>} */
const flushTimers = new Map();

export function contentCacheKey(bundleId, contentId, lang, sourceText = "") {
  return cacheKeyForRequest(bundleId, contentId, lang, sourceText);
}

export function resolveTranslationText(bundleId, contentId, sourceText, lang, translatedText) {
  const source = String(sourceText ?? "").trim();
  const targetLang = lang === "tr" ? "tr" : "en";

  const cached = getCachedTextTranslation(bundleId, contentId, targetLang, source);
  if (cached) return cached;

  if (!source) return String(translatedText ?? "");

  if (textMatchesLocale(source, targetLang)) {
    setCachedTextTranslation(bundleId, contentId, targetLang, source, source);
    return source;
  }

  const candidate = String(translatedText ?? "").trim();
  if (candidate && candidate !== source && textMatchesLocale(candidate, targetLang)) {
    setCachedTextTranslation(bundleId, contentId, targetLang, candidate, source);
    return candidate;
  }

  return source;
}

function scheduleFlush(lang) {
  if (flushTimers.has(lang)) return;

  const timer = setTimeout(() => {
    flushTimers.delete(lang);
    flushQueue(lang);
  }, FLUSH_DELAY_MS);

  flushTimers.set(lang, timer);
}

function flushQueue(lang) {
  const queue = queuesByLang.get(lang);
  if (!queue || queue.size === 0) return;

  const entries = Array.from(queue.entries()).slice(0, MAX_BATCH_SIZE);
  for (const [key] of entries) {
    queue.delete(key);
  }

  if (queue.size > 0) {
    scheduleFlush(lang);
  } else {
    queuesByLang.delete(lang);
  }

  const apiItems = entries.map(([key, entry]) => ({
    id: key,
    text: entry.text,
  }));

  ideasApi
    .translateTexts({ targetLang: lang, items: apiItems })
    .then((result) => {
      const byId = Object.fromEntries(
        (result?.items || []).map((item) => [String(item.id), String(item.text || "")])
      );

      for (const [key, entry] of entries) {
        const translated = byId[key] || entry.text;
        setCachedTextTranslation(
          entry.bundleId,
          entry.contentId,
          lang,
          translated,
          entry.text
        );
        for (const { resolve } of entry.resolvers) {
          resolve(translated);
        }
      }
    })
    .catch(() => {
      for (const [, entry] of entries) {
        for (const { resolve } of entry.resolvers) {
          resolve(entry.text);
        }
      }
    });
}

function enqueueTranslation(bundleId, contentId, text, lang) {
  const targetLang = lang === "tr" ? "tr" : "en";
  const batchKey = contentCacheKey(bundleId, contentId, targetLang, text);

  if (!queuesByLang.has(targetLang)) {
    queuesByLang.set(targetLang, new Map());
  }
  const queue = queuesByLang.get(targetLang);

  return new Promise((resolve, reject) => {
    if (!queue.has(batchKey)) {
      queue.set(batchKey, {
        bundleId,
        contentId,
        text,
        resolvers: [],
      });
    }

    queue.get(batchKey).resolvers.push({ resolve, reject });
    scheduleFlush(targetLang);
  });
}

function partitionMissing(requests, lang) {
  const results = {};
  const missing = [];

  for (const request of requests || []) {
    const bundleId = String(request.bundleId || "default");
    const contentId = String(request.contentId);
    const source = String(request.text || "").trim();
    if (!source) {
      results[contentId] = "";
      continue;
    }

    const cached = getCachedTextTranslation(bundleId, contentId, lang, source);
    if (cached) {
      results[contentId] = cached;
      continue;
    }

    if (textMatchesLocale(source, lang)) {
      setCachedTextTranslation(bundleId, contentId, lang, source, source);
      results[contentId] = source;
      continue;
    }

    missing.push({ bundleId, contentId, text: source });
  }

  return { results, missing };
}

/**
 * Queue strings for batched translation.
 * @returns {Promise<Record<string, string>>}
 */
export function queueTranslations(requests, lang) {
  return queueTranslationsPrioritized(requests, lang);
}

/**
 * Translate in priority groups; optional onPartial after each group completes.
 */
export async function queueTranslationsPrioritized(
  requests,
  lang,
  { priorityGroups = null, onPartial = null } = {}
) {
  const targetLang = lang === "tr" ? "tr" : "en";
  const { results, missing } = partitionMissing(requests, targetLang);

  if (missing.length === 0) {
    if (onPartial) onPartial({ ...results });
    return results;
  }

  const missingById = new Map(missing.map((item) => [item.contentId, item]));
  const groups =
    priorityGroups?.length > 0
      ? priorityGroups
      : [missing.map((item) => item.contentId)];

  const seen = new Set();

  for (const group of groups) {
    const groupRequests = [];
    for (const contentId of group) {
      const id = String(contentId);
      if (seen.has(id)) continue;
      const item = missingById.get(id);
      if (item) {
        groupRequests.push(item);
        seen.add(id);
      }
    }

    if (groupRequests.length === 0) continue;

    await Promise.all(
      groupRequests.map(async (item) => {
        const translated = await enqueueTranslation(
          item.bundleId,
          item.contentId,
          item.text,
          targetLang
        );
        results[item.contentId] = translated;
      })
    );

    if (onPartial) onPartial({ ...results });
  }

  for (const item of missing) {
    if (seen.has(item.contentId)) continue;
    const translated = await enqueueTranslation(
      item.bundleId,
      item.contentId,
      item.text,
      targetLang
    );
    results[item.contentId] = translated;
    if (onPartial) onPartial({ ...results });
  }

  return results;
}

/** Fire-and-forget preload; skips if all items already cached or locale-matched. */
export function preloadTranslations(requests, lang) {
  const targetLang = lang === "tr" ? "tr" : "en";
  const { missing } = partitionMissing(requests, targetLang);
  if (missing.length === 0) return;

  queueTranslationsPrioritized(missing, targetLang).catch(() => {});
}
