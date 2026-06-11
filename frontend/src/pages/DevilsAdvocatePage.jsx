import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AppShell from "../components/layout/AppShell";
import { useSocratixStore } from "../data/SocratixStoreProvider";
import { useTranslation } from "../i18n/useTranslation";
import { buildReviewAnswers } from "../utils/reviewAnswers";

export default function DevilsAdvocatePage() {
  const { ideaId } = useParams();
  const navigate = useNavigate();
  const { getIdeaById, submitDevil, generateDevilQuestions } = useSocratixStore();
  const { t, language } = useTranslation();
  const idea = getIdeaById(ideaId);

  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState(["", "", ""]);
  const [step, setStep] = useState(0);
  const [loadingQuestions, setLoadingQuestions] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!ideaId) {
      navigate("/dashboard", { replace: true });
      return;
    }
    if (!idea) return;

    if (idea.progressStatus !== "draft") {
      navigate(`/ideas/${idea.id}`, { replace: true });
    }
  }, [idea, ideaId, navigate]);

  useEffect(() => {
    if (!idea || idea.progressStatus !== "draft") return;

    const id = String(idea.id);
    let cancelled = false;

    async function loadQuestions() {
      setLoadingQuestions(true);
      setLoadError("");
      setStep(0);

      try {
        const loaded = await generateDevilQuestions(
          id,
          language === "tr" ? "tr" : "en"
        );
        const nextQuestions = loaded.filter((q) => String(q).trim());
        if (!cancelled) {
          setQuestions(nextQuestions);
          setAnswers(
            Array.from({ length: Math.max(nextQuestions.length, 3) }, () => "")
          );
        }
      } catch (error) {
        console.error(error);
        if (!cancelled) {
          setLoadError(t("devil.loadQuestionsError"));
        }
      } finally {
        if (!cancelled) {
          setLoadingQuestions(false);
        }
      }
    }

    loadQuestions();

    return () => {
      cancelled = true;
    };
  }, [idea?.id, idea?.progressStatus, language, t, generateDevilQuestions]);

  if (!ideaId) return null;
  if (!idea) {
    return (
      <AppShell>
        <p className="ds-body-sm" style={{ color: "var(--color-text-muted)" }}>
          {t("devil.loadingIdea")}
        </p>
      </AppShell>
    );
  }
  if (idea.progressStatus !== "draft") return null;

  const total = questions.length;
  const ready = total > 0 && !loadingQuestions;
  const currentQuestion = ready ? String(questions[step] ?? "") : "";
  const currentAnswer = answers[step] ?? "";
  const isLastStep = ready && step >= total - 1;
  const canAdvance = ready && Boolean(currentAnswer.trim());

  const setAnswer = (value) =>
    setAnswers((prev) => {
      const next = [...prev];
      next[step] = value;
      return next;
    });

  const handleNext = () => {
    if (!canAdvance) return;
    if (isLastStep) {
      handleSubmit();
      return;
    }
    setStep((s) => s + 1);
  };

  const handleBack = () => {
    if (step > 0) setStep((s) => s - 1);
  };

  const handleSubmit = async () => {
    const trimmed = answers.slice(0, total).map((a) => a.trim());
    if (trimmed.length < total || trimmed.some((a) => !a)) return;

    setSubmitting(true);
    try {
      await submitDevil({
        ideaId: idea.id,
        answers: trimmed,
        questions,
        reviewAnswers: buildReviewAnswers(questions, trimmed),
        skipped: false,
      });
      navigate(`/ideas/${idea.id}`, { replace: true });
    } catch (err) {
      setLoadError(err?.message || t("devil.submitError"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleSkip = async () => {
    setSubmitting(true);
    try {
      await submitDevil({
        ideaId: idea.id,
        answers: questions.map(() => ""),
        questions,
        skipped: true,
      });
      navigate(`/ideas/${idea.id}`, { replace: true });
    } catch (err) {
      setLoadError(err?.message || t("devil.skipError"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppShell>
      <div>
        <h1 className="ds-heading-1">
          {t("devil.title")}
        </h1>
        <p className="ds-body" style={{ marginTop: "var(--space-2)" }}>
          {t("devil.subtitle")}
        </p>
      </div>

      {loadError && (
        <div className="ds-alert ds-alert-error">{loadError}</div>
      )}

      <div
        style={{
          background: "rgba(79,142,247,0.06)",
          border: "1px solid rgba(79,142,247,0.2)",
          borderRadius: "var(--radius-lg)",
          padding: "var(--space-4) var(--space-5)",
        }}
      >
        <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--color-text-muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>
          {t("devil.ideaUnderReview")}
        </p>
        <p style={{ margin: "var(--space-2) 0 0", fontSize: "var(--text-base)", color: "var(--color-text-primary)", fontWeight: 600 }}>
          {idea.title}
        </p>
      </div>

      {loadingQuestions ? (
        <p className="ds-body-sm" style={{ color: "var(--color-text-muted)" }}>
          {t("devil.generating")}
        </p>
      ) : !ready ? (
        <p className="ds-body-sm" style={{ color: "var(--color-text-muted)" }}>
          {t("devil.noQuestions")}
        </p>
      ) : (
        <div
          style={{
            background: "rgba(168,85,247,0.05)",
            border: "1px solid rgba(168,85,247,0.15)",
            borderRadius: "var(--radius-xl)",
            padding: "var(--space-5)",
          }}
        >
          <p
            style={{
              margin: "0 0 var(--space-4)",
              fontSize: "var(--text-xs)",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.07em",
              color: "var(--color-text-muted)",
            }}
          >
            {t("devil.questionOf", { current: step + 1, total })}
          </p>

          <div style={{ display: "flex", alignItems: "flex-start", gap: "var(--space-3)", marginBottom: "var(--space-4)" }}>
            <span
              style={{
                minWidth: 26,
                height: 26,
                borderRadius: "50%",
                background: "linear-gradient(135deg, rgba(168,85,247,0.4), rgba(99,102,241,0.4))",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 900,
                fontSize: "var(--text-xs)",
                color: "white",
                flexShrink: 0,
              }}
            >
              {step + 1}
            </span>
            <p
              style={{
                margin: 0,
                fontSize: "var(--text-base)",
                fontWeight: 700,
                color: "var(--color-text-primary)",
                lineHeight: "var(--leading-snug)",
              }}
            >
              {currentQuestion}
            </p>
          </div>

          <textarea
            id={`devil-${step}`}
            className="ds-textarea"
            value={currentAnswer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder={t("devil.answerPlaceholder")}
            rows={4}
            disabled={submitting}
          />
        </div>
      )}

      <div className="ds-row-between">
        <button
          type="button"
          className="ds-btn ds-btn-ghost"
          onClick={handleSkip}
          disabled={submitting || loadingQuestions}
        >
          {t("devil.skip")}
        </button>
        <div className="ds-row" style={{ gap: "var(--space-2)" }}>
          {step > 0 && ready && (
            <button
              type="button"
              className="ds-btn ds-btn-secondary"
              onClick={handleBack}
              disabled={submitting}
            >
              {t("devil.back")}
            </button>
          )}
          <button
            type="button"
            className="ds-btn ds-btn-primary"
            onClick={handleNext}
            disabled={!canAdvance || submitting || loadingQuestions}
          >
            {submitting
              ? t("devil.submitting")
              : isLastStep
                ? t("devil.submit")
                : t("devil.next")}
          </button>
        </div>
      </div>
    </AppShell>
  );
}
