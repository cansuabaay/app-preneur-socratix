import { useEffect, useMemo, useRef, useState } from "react";
import {
  getCachedReviewTranslation,
  setCachedReviewTranslation,
} from "../services/textTranslationCache";
import { queueTranslationsPrioritized } from "../services/translationCoordinator";
import { normalizeLocale, textMatchesLocale } from "../utils/textLocale";
import { parseReviewPairs } from "../utils/reviewAnswers";

function pairsContentKey(pairs) {
  return pairs.map((pair) => `${pair.question}=>${pair.answer}`).join("||");
}

function pairMatchesLocale(pair, locale) {
  const question = String(pair.question || "").trim();
  const answer = String(pair.answer || "").trim();
  const questionOk = !question || textMatchesLocale(question, locale);
  const answerOk = !answer || textMatchesLocale(answer, locale);
  return questionOk && answerOk;
}

function buildTranslationRequests(sourcePairs, lang, bundleId) {
  const requests = [];
  sourcePairs.forEach((pair, index) => {
    const question = String(pair.question || "").trim();
    const answer = String(pair.answer || "").trim();
    if (question && !textMatchesLocale(question, lang)) {
      requests.push({ bundleId, contentId: `q-${index}`, text: question });
    }
    if (answer && !textMatchesLocale(answer, lang)) {
      requests.push({ bundleId, contentId: `a-${index}`, text: answer });
    }
  });
  return requests;
}

function mergeTranslatedPairs(sourcePairs, translatedById) {
  return sourcePairs.map((pair, index) => ({
    question: translatedById[`q-${index}`] || pair.question,
    answer: translatedById[`a-${index}`] || pair.answer,
  }));
}

export function useReviewTranslations(idea, language) {
  const lang = normalizeLocale(language);
  const sourcePairs = useMemo(() => parseReviewPairs(idea), [idea]);
  const contentKey = useMemo(() => pairsContentKey(sourcePairs), [sourcePairs]);
  const ideaId = idea?.id != null ? String(idea.id) : "";
  const bundleId = ideaId ? `review-${ideaId}` : "review";
  const requestSeq = useRef(0);

  const [pairs, setPairs] = useState(sourcePairs);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setPairs(sourcePairs);

    if (!ideaId || sourcePairs.length === 0) {
      setLoading(false);
      return undefined;
    }

    const cached = getCachedReviewTranslation(ideaId, lang, sourcePairs);
    if (cached?.length) {
      setPairs(cached);
      setLoading(false);
      return undefined;
    }

    if (sourcePairs.every((pair) => pairMatchesLocale(pair, lang))) {
      setCachedReviewTranslation(ideaId, lang, sourcePairs, sourcePairs);
      setLoading(false);
      return undefined;
    }

    const requests = buildTranslationRequests(sourcePairs, lang, bundleId);
    if (requests.length === 0) {
      setCachedReviewTranslation(ideaId, lang, sourcePairs, sourcePairs);
      setLoading(false);
      return undefined;
    }

    const seq = ++requestSeq.current;
    setLoading(true);

    queueTranslationsPrioritized(requests, lang, {
      onPartial: (partial) => {
        if (seq !== requestSeq.current) return;
        setPairs(mergeTranslatedPairs(sourcePairs, partial));
      },
    })
      .then((translatedById) => {
        if (seq !== requestSeq.current) return;

        const translated = mergeTranslatedPairs(sourcePairs, translatedById);
        setCachedReviewTranslation(ideaId, lang, translated, sourcePairs);
        setPairs(translated);
      })
      .catch(() => {
        if (seq !== requestSeq.current) return;
        setPairs(sourcePairs);
      })
      .finally(() => {
        if (seq === requestSeq.current) {
          setLoading(false);
        }
      });

    return undefined;
  }, [bundleId, contentKey, ideaId, lang, sourcePairs]);

  const hasAnswers = pairs.some((pair) => pair.answer?.trim());

  return { pairs, hasAnswers, loading };
}
