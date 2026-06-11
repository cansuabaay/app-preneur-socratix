import { contentHash } from "../utils/contentHash";

const memoryCache = new Map();
const STORAGE_KEY = "socratix_translation_cache_v2";
const MAX_STORAGE_ENTRIES = 800;

function readStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeStorage(data) {
  try {
    const keys = Object.keys(data);
    if (keys.length > MAX_STORAGE_ENTRIES) {
      const trimmed = keys.slice(keys.length - MAX_STORAGE_ENTRIES);
      const next = {};
      for (const key of trimmed) {
        next[key] = data[key];
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    /* ignore quota errors */
  }
}

export function getCachedTranslation(key) {
  if (memoryCache.has(key)) {
    return memoryCache.get(key);
  }

  const stored = readStorage();
  const entry = stored[key];
  if (entry == null) return null;

  memoryCache.set(key, entry);
  return entry;
}

export function setCachedTranslation(key, value) {
  memoryCache.set(key, value);
  const stored = readStorage();
  stored[key] = value;
  writeStorage(stored);
}

export function getCachedString(key) {
  const entry = getCachedTranslation(key);
  return typeof entry === "string" && entry.trim() ? entry : null;
}

export function getCachedObject(key) {
  const entry = getCachedTranslation(key);
  return entry && typeof entry === "object" ? entry : null;
}

/** Legacy sessionStorage keys (read-only migration on hit). */
const LEGACY_TEXT_KEY = "socratix_text_translations_v1";
const LEGACY_IDEA_KEY = "socratix_idea_translations_v1";

export function readLegacySessionText(key) {
  try {
    const raw = sessionStorage.getItem(LEGACY_TEXT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const value = parsed?.[key];
    return typeof value === "string" ? value : null;
  } catch {
    return null;
  }
}

export function readLegacySessionIdea(key) {
  try {
    const raw = sessionStorage.getItem(LEGACY_IDEA_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const value = parsed?.[key];
    return value?.title && value?.description ? value : null;
  } catch {
    return null;
  }
}

export function hashSourceText(text) {
  return contentHash(text);
}
