const TURKISH_CHAR_RE = /[ğüşıöçĞÜŞİÖÇ]/;

export function normalizeLocale(language) {
  return language === "tr" ? "tr" : "en";
}

/** Heuristic: Turkish-specific characters imply TR; otherwise treat as EN. */
export function textMatchesLocale(text, locale) {
  const lang = normalizeLocale(locale);
  const sample = String(text || "").trim();
  if (!sample) return true;

  const hasTurkishChars = TURKISH_CHAR_RE.test(sample);
  return lang === "tr" ? hasTurkishChars : !hasTurkishChars;
}

export function textsMatchLocale(texts, locale) {
  return (texts || []).every((text) => textMatchesLocale(text, locale));
}
