function scoreToImpactLevel(score) {
  const value = Number(score);
  if (!Number.isFinite(value)) return "Medium";
  if (value >= 8) return "High";
  if (value >= 5) return "Medium";
  return "Low";
}

export function normalizeStrategicAnalysis(raw) {
  if (!raw || typeof raw !== "object") return null;

  const hasNewShape = Boolean(
    raw.impactLevel ||
      raw.strengths?.length ||
      raw.risks?.length ||
      raw.recommendedNextStep ||
      raw.validationSummary ||
      raw.businessValueSummary ||
      raw.summary
  );

  if (hasNewShape) {
    return {
      impactLevel: String(raw.impactLevel || scoreToImpactLevel(raw.impactScore)).trim(),
      impactScore: Number(raw.impactScore ?? raw.feasibilityScore) || 5,
      strengths: Array.isArray(raw.strengths) ? raw.strengths.map(String) : [],
      risks: Array.isArray(raw.risks) ? raw.risks.map(String) : [],
      validationSummary: String(raw.validationSummary || "").trim(),
      recommendedNextStep: String(raw.recommendedNextStep || "").trim(),
      businessValueSummary: String(raw.businessValueSummary || raw.summary || "").trim(),
    };
  }

  return null;
}

export function hasStrategicAnalysis(idea) {
  return Boolean(normalizeStrategicAnalysis(idea?.strategicAnalysis));
}

export function impactLevelLabelKey(level) {
  const normalized = String(level || "Medium").trim().toLowerCase();
  if (normalized === "high" || normalized === "yüksek") return "analysis.impactHigh";
  if (normalized === "low" || normalized === "düşük") return "analysis.impactLow";
  return "analysis.impactMedium";
}
