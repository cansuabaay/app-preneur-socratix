/** Short stable hash for translation cache invalidation when source text changes. */
export function contentHash(text) {
  const sample = String(text ?? "");
  if (!sample) return "0";

  let hash = 0;
  for (let i = 0; i < sample.length; i += 1) {
    hash = (hash << 5) - hash + sample.charCodeAt(i);
    hash |= 0;
  }

  return Math.abs(hash).toString(36);
}

export function combinedContentHash(...parts) {
  return contentHash(parts.map((part) => String(part ?? "")).join("\u001f"));
}
