import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AppShell from "../components/layout/AppShell";
import { aiPackages, resolveAiPackageId } from "../data/mockData";
import { useSocratixStore } from "../data/SocratixStoreProvider";

export default function DevilsAdvocatePage() {
  const { ideaId } = useParams();
  const navigate   = useNavigate();
  const { getIdeaById, submitDevil } = useSocratixStore();
  const idea = getIdeaById(ideaId);

  const questions = useMemo(() => {
    if (!idea) return [];
    if (idea.devilQuestions?.length) return idea.devilQuestions;
    const pkgId = idea.aiPackageId || resolveAiPackageId(idea.categoryId);
    return aiPackages[pkgId]?.devilQuestions ?? [];
  }, [idea]);

  const [answers, setAnswers] = useState(["", "", ""]);

  useEffect(() => {
    setAnswers((prev) => {
      const next = [...prev];
      while (next.length < questions.length) next.push("");
      return next.slice(0, questions.length);
    });
  }, [questions.length]);

  useEffect(() => {
    if (!idea) { navigate("/dashboard", { replace: true }); return; }
    if (idea.progressStatus !== "devils_advocate") {
      navigate(`/ideas/${idea.id}`, { replace: true });
    }
  }, [idea, navigate]);

  if (!idea || idea.progressStatus !== "devils_advocate") return null;

  const setAnswer = (i, v) =>
    setAnswers((prev) => { const n = [...prev]; n[i] = v; return n; });

  const handleSubmit = () => {
    submitDevil({ ideaId: idea.id, answers, skipped: false });
    navigate(`/ideas/${idea.id}`, { replace: true });
  };

  const handleSkip = () => {
    submitDevil({ ideaId: idea.id, answers: questions.map(() => ""), skipped: true });
    navigate(`/ideas/${idea.id}`, { replace: true });
  };

  return (
    <AppShell>
      {/* Header */}
      <div>
        <h1 className="ds-heading-1" style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
          <span style={{ fontSize: "1.8rem" }}>😈</span>
          Devil&apos;s Advocate
        </h1>
        <p className="ds-body" style={{ marginTop: "var(--space-2)" }}>
          Three sharp questions before portfolio review. Answer in crisp bullets — or skip and document
          risks later.
        </p>
      </div>

      {/* Idea context */}
      <div
        style={{
          background: "rgba(79,142,247,0.06)",
          border: "1px solid rgba(79,142,247,0.2)",
          borderRadius: "var(--radius-lg)",
          padding: "var(--space-4) var(--space-5)",
        }}
      >
        <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--color-text-muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>
          Idea under review
        </p>
        <p style={{ margin: "var(--space-2) 0 0", fontSize: "var(--text-base)", color: "var(--color-text-primary)", fontWeight: 600 }}>
          {idea.title}
        </p>
      </div>

      {/* Q&A cards */}
      <div className="ds-stack">
        {questions.map((q, idx) => (
          <div
            key={idx}
            style={{
              background: "rgba(168,85,247,0.05)",
              border: "1px solid rgba(168,85,247,0.15)",
              borderRadius: "var(--radius-xl)",
              padding: "var(--space-5)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "var(--space-3)",
                marginBottom: "var(--space-4)",
              }}
            >
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
                {idx + 1}
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
                {q}
              </p>
            </div>
            <textarea
              id={`devil-${idx}`}
              className="ds-textarea"
              value={answers[idx] ?? ""}
              onChange={(e) => setAnswer(idx, e.target.value)}
              placeholder="Constraints, owners, and what would falsify this approach."
              rows={4}
            />
          </div>
        ))}
      </div>

      <div className="ds-row-between">
        <button type="button" className="ds-btn ds-btn-ghost" onClick={handleSkip}>
          Skip for now
        </button>
        <button type="button" className="ds-btn ds-btn-primary" onClick={handleSubmit}>
          Submit responses
        </button>
      </div>
    </AppShell>
  );
}
