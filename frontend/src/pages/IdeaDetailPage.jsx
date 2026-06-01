import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import AppShell from "../components/layout/AppShell";
import Icon from "../components/ds/Icon";
import { getCategoryLabel, getDepartmentName, getUserById } from "../data/mockData";
import { useSocratixStore } from "../data/SocratixStoreProvider";
import { useTranslation } from "../i18n/useTranslation";
import { getIdeaStatusBadge, normalizeProgressStatus } from "../i18n/statusLabels";
import { analyzeIdeaWithAI } from "../services/api";

const AVATAR_COLORS = ["#4f8ef7", "#6366f1", "#a855f7", "#0d9488", "#f97316", "#ec4899"];

function Avatar({ name, size = 32 }) {
  const initials = name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();
  const color = AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
  return (
    <div
      className="ds-avatar"
      title={name}
      style={{
        width: size, height: size,
        fontSize: size * 0.3,
        background: `linear-gradient(135deg, ${color}, ${color}99)`,
        border: "2px solid rgba(255,255,255,0.1)",
        flexShrink: 0,
      }}
    >
      {initials}
    </div>
  );
}

export default function IdeaDetailPage() {
  const { ideaId } = useParams();
  const navigate = useNavigate();
  const {
    getIdeaById,
    voteIdea,
    addComment,
    deleteIdea,
    currentUser,
    ideaVoters,
    hasVotedOnIdea,
  } = useSocratixStore();
  const { t } = useTranslation();
  const idea = getIdeaById(ideaId);
  const [comment, setComment] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [aiResult, setAiResult] = useState(null);

  const author = useMemo(() => {
    if (!idea) return "";
    return idea.authorName || getUserById(idea.authorId)?.name || t("teamMember");
  }, [idea, t]);

  useEffect(() => {
    if (!idea) navigate("/dashboard", { replace: true });
  }, [idea, navigate]);

  if (!idea) return null;

  const badge = getIdeaStatusBadge(idea.progressStatus, t);
  const isOwner = Boolean(
    currentUser?.id && String(idea.authorId) === String(currentUser.id)
  );
  const canResumeDevil = idea.progressStatus === "draft";
  const voters = ideaVoters(idea);
  const alreadyVoted = hasVotedOnIdea(idea);

  const handleVote = () => voteIdea(idea.id);

  const handleComment = () => {
    if (!comment.trim()) return;
    addComment(idea.id, comment);
    setComment("");
  };

  const handleDelete = async () => {
    const confirmed = window.confirm(t("idea.deleteConfirm"));
    if (!confirmed) return;
    try {
      await deleteIdea(idea.id);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setAiError(err?.message || t("idea.deleteError"));
    }
  };

  const handleAiDevilAdvocate = async () => {
    setAiError("");
    setAiLoading(true);
    try {
      const result = await analyzeIdeaWithAI(idea.id);
      setAiResult(result);
    } catch (err) {
      setAiError(err?.message || t("idea.aiAnalysisError"));
      setAiResult(null);
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <AppShell>
      {/* Back nav */}
      <div className="ds-row" style={{ flexWrap: "wrap", gap: "var(--space-2)" }}>
        <Link to="/dashboard" className="ds-btn ds-btn-ghost ds-btn-sm">
          {t("idea.backFeed")}
        </Link>
        {isOwner && (
          <>
            <Link to={`/ideas/${idea.id}/edit`} className="ds-btn ds-btn-secondary ds-btn-sm">
              {t("idea.edit")}
            </Link>
            <button
              type="button"
              className="ds-btn ds-btn-danger ds-btn-sm"
              onClick={handleDelete}
            >
              {t("idea.delete")}
            </button>
          </>
        )}
        <button
          type="button"
          className="ds-btn ds-btn-primary ds-btn-sm"
          onClick={handleAiDevilAdvocate}
          disabled={aiLoading}
          style={{ gap: "var(--space-2)" }}
        >
          <Icon name="sparkles" size={15} />
          {aiLoading ? t("idea.aiAnalyzing") : t("idea.aiDevil")}
        </button>
        {canResumeDevil && (
          <Link to={`/devil/${idea.id}`} className="ds-btn ds-btn-secondary ds-btn-sm">
            {t("idea.continueDevil")}
          </Link>
        )}
      </div>

      {/* Main card */}
      <div
        style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "var(--radius-2xl)",
          overflow: "hidden",
        }}
      >
        {/* Header band */}
        <div
          style={{
            padding: "var(--space-6) var(--space-6) var(--space-5)",
            background: "linear-gradient(135deg, rgba(79,142,247,0.08), rgba(99,102,241,0.06))",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <div className="idea-feed-card__top">
            <div className="ds-row" style={{ gap: "var(--space-2)", flexWrap: "wrap", alignItems: "center" }}>
              <span className={`ds-badge ${badge.cls}`}>{badge.label}</span>
              {idea.aiReviewed && normalizeProgressStatus(idea.progressStatus) === "submitted" && (
                <span className="ds-badge ds-badge-purple">{t("idea.aiReviewedBadge")}</span>
              )}
            </div>
            <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
              {getCategoryLabel(idea.categoryId)}
            </span>
          </div>
          <h1
            className="ds-heading-2"
            style={{ marginTop: "var(--space-3)", lineHeight: "var(--leading-snug)" }}
          >
            {idea.title}
          </h1>
          <div
            className="ds-row"
            style={{ marginTop: "var(--space-3)", gap: "var(--space-3)", flexWrap: "wrap" }}
          >
            <Avatar name={author} size={28} />
            <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
              <strong style={{ color: "var(--color-text-primary)" }}>{author}</strong>
              {" · "}
              {getDepartmentName(idea.departmentId)}
            </span>
          </div>
        </div>

        {/* Description */}
        <div style={{ padding: "var(--space-6)" }}>
          <p
            style={{
              fontSize: "var(--text-base)",
              color: "var(--color-text-secondary)",
              lineHeight: "var(--leading-relaxed)",
              margin: 0,
              whiteSpace: "pre-wrap",
            }}
          >
            {idea.description}
          </p>

          <div
            className="ds-divider"
            style={{ margin: "var(--space-5) 0" }}
          />

          {/* Votes + who voted */}
          <div className="ds-row-between" style={{ flexWrap: "wrap", gap: "var(--space-4)" }}>
            <div>
              <div
                style={{
                  fontSize: "var(--text-xs)",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.07em",
                  color: "var(--color-text-muted)",
                  marginBottom: "var(--space-2)",
                }}
              >
                {t("whoVoted")}
              </div>
              {voters.length > 0 ? (
                <div style={{ display: "flex", gap: "var(--space-2)", flexWrap: "wrap", alignItems: "center" }}>
                  {voters.map((u) => (
                    <span
                      key={u.id}
                      title={u.name}
                      style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
                    >
                      <Avatar name={u.name} size={30} />
                      <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)" }}>
                        {u.name}
                      </span>
                    </span>
                  ))}
                </div>
              ) : (
                <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
                  {t("idea.noVotes")}
                </span>
              )}
            </div>

            <button
              type="button"
              className={`ds-btn ${alreadyVoted ? "ds-btn-primary" : "ds-btn-secondary"}`}
              onClick={handleVote}
              style={{ gap: "var(--space-2)" }}
            >
              <Icon name="vote" size={16} />
              {alreadyVoted ? t("voted") : t("vote")}
              <span
                style={{
                  background: "rgba(79,142,247,0.2)",
                  color: "var(--color-brand)",
                  borderRadius: "var(--radius-full)",
                  padding: "1px 8px",
                  fontWeight: 800,
                  fontSize: "var(--text-xs)",
                }}
              >
                {idea.votes ?? 0}
              </span>
            </button>
          </div>
        </div>
      </div>

      {aiError && (
        <div className="ds-alert ds-alert-error" style={{ marginTop: "var(--space-4)" }}>
          {aiError}
        </div>
      )}

      {aiResult && (
        <section
          className="ds-stack"
          style={{
            marginTop: "var(--space-5)",
            background: "rgba(168,85,247,0.06)",
            border: "1px solid rgba(168,85,247,0.22)",
            borderRadius: "var(--radius-xl)",
            padding: "var(--space-5) var(--space-6)",
          }}
        >
          <div className="ds-row-between" style={{ alignItems: "flex-start", flexWrap: "wrap", gap: "var(--space-3)" }}>
            <h2 className="ds-heading-3" style={{ margin: 0 }}>
              {t("idea.aiPanelTitle")}
            </h2>
            <span className="ds-badge ds-badge-purple">
              {t("idea.feasibility", { score: aiResult.feasibilityScore })}
            </span>
          </div>

          {aiResult.summary && (
            <p
              style={{
                margin: 0,
                fontSize: "var(--text-sm)",
                color: "var(--color-text-secondary)",
                lineHeight: "var(--leading-relaxed)",
              }}
            >
              {aiResult.summary}
            </p>
          )}

          <div>
            <h3
              style={{
                fontSize: "var(--text-xs)",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.07em",
                color: "var(--color-text-muted)",
                margin: "0 0 var(--space-2)",
              }}
            >
              {t("idea.risks")}
            </h3>
            <ul style={{ margin: 0, paddingLeft: "var(--space-5)", color: "var(--color-text-secondary)" }}>
              {(aiResult.risks || []).map((risk, idx) => (
                <li key={idx} style={{ marginBottom: "var(--space-2)", fontSize: "var(--text-sm)" }}>
                  {risk}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3
              style={{
                fontSize: "var(--text-xs)",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.07em",
                color: "var(--color-text-muted)",
                margin: "0 0 var(--space-2)",
              }}
            >
              {t("idea.improvements")}
            </h3>
            <ul style={{ margin: 0, paddingLeft: "var(--space-5)", color: "var(--color-text-secondary)" }}>
              {(aiResult.improvementSuggestions || []).map((item, idx) => (
                <li key={idx} style={{ marginBottom: "var(--space-2)", fontSize: "var(--text-sm)" }}>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* AI review responses */}
      {idea.devilAnswers?.some((a) => a?.trim()) && (
        <section className="ds-stack">
          <h2 className="ds-heading-3">{t("idea.aiReviewResponses")}</h2>
          {(idea.devilQuestions || []).map((q, i) => (
            <div
              key={i}
              style={{
                background: "rgba(168,85,247,0.06)",
                border: "1px solid rgba(168,85,247,0.18)",
                borderRadius: "var(--radius-lg)",
                padding: "var(--space-4) var(--space-5)",
              }}
            >
              <p
                style={{
                  fontWeight: 700,
                  fontSize: "var(--text-sm)",
                  color: "var(--color-text-primary)",
                  margin: 0,
                }}
              >
                {q}
              </p>
              <p
                style={{
                  fontSize: "var(--text-sm)",
                  color: "var(--color-text-secondary)",
                  marginTop: "var(--space-3)",
                  lineHeight: "var(--leading-relaxed)",
                  whiteSpace: "pre-wrap",
                }}
              >
                {idea.devilAnswers[i]?.trim() || "—"}
              </p>
            </div>
          ))}
        </section>
      )}

      {idea.devilSkipped && (
        <div className="ds-alert">
          {t("idea.aiReviewSkipped")}
        </div>
      )}

      {/* Discussion */}
      <section className="ds-stack">
        <h2 className="ds-heading-3">
          {t("idea.discussion")}
          {(idea.comments?.length ?? 0) > 0 && (
            <span
              style={{
                marginLeft: "var(--space-2)",
                background: "rgba(79,142,247,0.15)",
                color: "var(--color-brand)",
                borderRadius: "var(--radius-full)",
                padding: "2px 10px",
                fontSize: "var(--text-xs)",
                fontWeight: 800,
              }}
            >
              {idea.comments.length}
            </span>
          )}
        </h2>

        {(idea.comments || []).length === 0 ? (
          <p className="ds-body-sm">{t("idea.noComments")}</p>
        ) : (
          <div className="ds-stack-sm">
            {idea.comments.map((c) => {
              const who = c.authorName || getUserById(c.authorId)?.name || t("colleague");
              return (
                <div
                  key={c.id}
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.07)",
                    borderRadius: "var(--radius-lg)",
                    padding: "var(--space-4) var(--space-5)",
                  }}
                >
                  <div className="ds-row" style={{ gap: "var(--space-3)", marginBottom: "var(--space-2)" }}>
                    <Avatar name={who} size={26} />
                    <div>
                      <span style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--color-text-primary)" }}>
                        {who}
                      </span>
                      <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", marginLeft: "var(--space-2)" }}>
                        {new Date(c.createdAt).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  </div>
                  <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--color-text-secondary)", lineHeight: "var(--leading-relaxed)", whiteSpace: "pre-wrap" }}>
                    {c.body}
                  </p>
                </div>
              );
            })}
          </div>
        )}

        {/* Add comment */}
        <div>
          <label
            className="ds-label"
            htmlFor="new-comment"
          >
            {currentUser
              ? t("idea.addCommentAs", { name: currentUser.name })
              : t("idea.addComment")}
          </label>
          <textarea
            id="new-comment"
            className="ds-textarea"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={t("idea.commentPlaceholder")}
            rows={3}
          />
          <button
            type="button"
            className="ds-btn ds-btn-primary"
            onClick={handleComment}
            disabled={!comment.trim()}
            style={{ marginTop: "var(--space-3)" }}
          >
            <Icon name="comment" size={15} />
            {t("idea.postComment")}
          </button>
        </div>
      </section>
    </AppShell>
  );
}
