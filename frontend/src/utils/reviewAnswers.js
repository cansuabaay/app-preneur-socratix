function answerText(entry) {
  if (entry && typeof entry === "object") {
    return String(entry.answer || "").trim();
  }
  return String(entry || "").trim();
}

function questionText(entry, fallback = "") {
  if (entry && typeof entry === "object") {
    return String(entry.question || entry.text || fallback || "").trim();
  }
  return String(fallback || "").trim();
}

export function devilQuestionsCacheKey(ideaId) {
  return `socratix_devil_questions_${ideaId}`;
}

export function cacheDevilQuestions(ideaId, questions) {
  if (ideaId == null || !Array.isArray(questions)) return;
  try {
    sessionStorage.setItem(
      devilQuestionsCacheKey(ideaId),
      JSON.stringify(questions.filter((q) => String(q).trim()))
    );
  } catch {
    /* ignore */
  }
}

export function recoverDevilQuestions(ideaId) {
  if (ideaId == null) return [];
  try {
    const raw = sessionStorage.getItem(devilQuestionsCacheKey(ideaId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.map((q) => String(q).trim()).filter(Boolean)
      : [];
  } catch {
    return [];
  }
}

export function buildReviewAnswers(questions, answers) {
  const qList = (questions || []).map((q) => String(q).trim());
  const aList = answers || [];
  const count = Math.max(qList.length, aList.length);

  const pairs = [];
  for (let i = 0; i < count; i += 1) {
    const answer = answerText(aList[i]);
    if (!answer) continue;
    pairs.push({
      question: questionText(aList[i], qList[i] || ""),
      answer,
    });
  }
  return pairs;
}

export function parseReviewPairs(idea) {
  if (!idea) return [];

  const storedQuestions = idea.devilQuestions || [];
  const storedAnswers = idea.devilAnswers || [];
  const recovered = recoverDevilQuestions(idea.id);

  if (storedAnswers.length > 0 && typeof storedAnswers[0] === "object") {
    return storedAnswers
      .map((item, index) => ({
        question:
          questionText(item) ||
          String(storedQuestions[index] || recovered[index] || "").trim(),
        answer: answerText(item),
      }))
      .filter((pair) => pair.answer);
  }

  const answerCount = storedAnswers.filter((a) => answerText(a)).length;
  const count = Math.max(storedQuestions.length, answerCount, recovered.length);
  if (count === 0) return [];

  const pairs = [];
  for (let i = 0; i < count; i += 1) {
    const answer = answerText(storedAnswers[i]);
    if (!answer) continue;
    pairs.push({
      question:
        String(storedQuestions[i] || recovered[i] || "").trim(),
      answer,
    });
  }
  return pairs;
}

export function hasAiChallengeCompleted(idea) {
  if (!idea || idea.devilSkipped) return false;
  if (!idea.aiReviewed) return false;
  return parseReviewPairs(idea).length > 0;
}

export function normalizeApiIdea(idea) {
  if (!idea) return idea;
  return {
    ...idea,
    id: idea.id != null ? String(idea.id) : "",
    devilQuestions: Array.isArray(idea.devilQuestions) ? idea.devilQuestions : [],
    devilAnswers: Array.isArray(idea.devilAnswers) ? idea.devilAnswers : [],
    strategicAnalysis:
      idea.strategicAnalysis && typeof idea.strategicAnalysis === "object"
        ? idea.strategicAnalysis
        : null,
  };
}
