import { deriveShortImprovementTitle, resolveImprovementDisplay } from "./aiImprovements";

const REFINEMENT_SPLIT = /\n\n\[AI refinement\]\s*/i;

export function deriveSuggestionTitle(text) {
  return deriveShortImprovementTitle(text);
}

export function parseAiRefinementsFromDescription(description) {
  const raw = String(description || "").trim();
  if (!raw) {
    return { body: "", refinements: [] };
  }

  const segments = raw.split(REFINEMENT_SPLIT);
  const body = (segments[0] || "").trim();
  const refinements = segments
    .slice(1)
    .map((chunk, index) => {
      const text = chunk.trim();
      if (!text) return null;
      const { title, description } = resolveImprovementDisplay({ title: "", text });
      return {
        id: `refinement-${index}`,
        text: description,
        title,
      };
    })
    .filter(Boolean);

  return { body, refinements };
}

export function normalizeSuggestionItems(items) {
  return (items || [])
    .map((item, index) => {
      const text = String(item?.text ?? item ?? "").trim();
      if (!text) return null;
      const { title, description } = resolveImprovementDisplay({
        title: item?.title || "",
        text,
      });
      return {
        id: item?.id ?? `suggestion-${index}`,
        text: description,
        title,
      };
    })
    .filter(Boolean);
}
