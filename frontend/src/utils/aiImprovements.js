const CATEGORY_ORDER = [
  "problem_definition",
  "target_users",
  "business_value",
  "implementation",
  "success_metrics",
  "general",
];

const MAX_TITLE_LENGTH = 72;

function normalizeCompareText(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function stripTruncationMarker(value) {
  const text = String(value || "").trim();
  if (text.endsWith("…")) return text.slice(0, -1).trim();
  if (text.endsWith("...")) return text.slice(0, -3).trim();
  return text;
}

export function deriveShortImprovementTitle(text) {
  const trimmed = String(text || "").trim();
  if (!trimmed) return "";

  const colonSplit = trimmed.split(/[:–-]\s+/);
  if (colonSplit[0] && colonSplit[0].length >= 8 && colonSplit[0].length <= 48) {
    return colonSplit[0].trim();
  }

  const sentenceMatch = trimmed.match(/^(.{8,48}?)([.!?])(\s|$)/);
  if (sentenceMatch) {
    return sentenceMatch[1].trim();
  }

  const words = trimmed.split(/\s+/).filter(Boolean);
  if (words.length <= 5) return trimmed;

  return words.slice(0, 5).join(" ");
}

export function resolveImprovementDisplay({ title, text }) {
  const description = String(text || "").trim();
  let displayTitle = stripTruncationMarker(title);

  const titleNorm = normalizeCompareText(displayTitle);
  const descNorm = normalizeCompareText(description);

  const titleIsDuplicatePrefix =
    Boolean(displayTitle) &&
    descNorm.startsWith(titleNorm) &&
    (displayTitle.length > 24 || description.length > displayTitle.length + 12);

  const titleLooksInvalid =
    !displayTitle ||
    titleNorm === descNorm ||
    titleIsDuplicatePrefix ||
    displayTitle.length > MAX_TITLE_LENGTH;

  if (titleLooksInvalid && description) {
    displayTitle = deriveShortImprovementTitle(description);
  }

  if (!displayTitle) {
    return { title: "", description };
  }

  const resolvedTitleNorm = normalizeCompareText(displayTitle);
  if (resolvedTitleNorm === descNorm) {
    return { title: "", description };
  }

  if (description.toLowerCase().startsWith(displayTitle.toLowerCase())) {
    const remainder = description
      .slice(displayTitle.length)
      .replace(/^[\s:.,;–-]+/, "")
      .trim();
    const looksLikeSentenceFragment =
      remainder.length < 12 || /^[a-zğüşıöçâîû]/.test(remainder);
    if (!looksLikeSentenceFragment) {
      return { title: displayTitle, description: remainder };
    }
    return { title: "", description };
  }

  return { title: displayTitle, description };
}

export const improvementTitleStyle = {
  margin: "0 0 var(--space-2)",
  fontSize: "var(--text-sm)",
  fontWeight: 700,
  color: "var(--color-text-primary)",
  lineHeight: "var(--leading-snug)",
  whiteSpace: "normal",
  overflowWrap: "anywhere",
  wordBreak: "break-word",
  overflow: "visible",
};

export const improvementDescriptionStyle = {
  margin: 0,
  fontSize: "var(--text-sm)",
  color: "var(--color-text-secondary)",
  lineHeight: "var(--leading-relaxed)",
  whiteSpace: "pre-wrap",
  overflowWrap: "anywhere",
  wordBreak: "break-word",
};

export function normalizeImprovementItem(item, index = 0) {
  if (item && typeof item === "object") {
    const detail = String(item.detail || item.text || "").trim();
    return {
      id: item.id || `improvement-${index}`,
      category: String(item.category || "general").trim() || "general",
      title: String(item.title || "").trim(),
      text: detail,
      status: item.status || "pending",
    };
  }

  const text = String(item || "").trim();
  return {
    id: `improvement-${index}`,
    category: "general",
    title: "",
    text,
    status: "pending",
  };
}

export function normalizeImprovementList(items) {
  return (items || [])
    .map((item, index) => normalizeImprovementItem(item, index))
    .filter((item) => item.text);
}

export function sortImprovements(items) {
  return [...items].sort((a, b) => {
    const ai = CATEGORY_ORDER.indexOf(a.category);
    const bi = CATEGORY_ORDER.indexOf(b.category);
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });
}

export function categoryLabelKey(category) {
  const slug = String(category || "general").trim() || "general";
  return `ai.improveCategory.${slug}`;
}
