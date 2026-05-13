import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import AppShell from "../components/layout/AppShell";
import Icon from "../components/ds/Icon";
import { getCategoryLabel, getDepartmentName, getUserById } from "../data/mockData";
import { useSocratixStore } from "../data/SocratixStoreProvider";

const STATUS_INFO = {
  draft:           { label: "Draft",            cls: "ds-badge-warning" },
  ai_enhanced:     { label: "AI Enhanced",      cls: "ds-badge-accent" },
  devils_advocate: { label: "Devil's Advocate", cls: "ds-badge-purple" },
  published:       { label: "In Portfolio",     cls: "ds-badge-success" },
};

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
  const { getIdeaById, voteIdea, addComment, currentUser, t } = useSocratixStore();
  const idea = getIdeaById(ideaId);
  const [comment, setComment] = useState("");

  const author = useMemo(() => {
    if (!idea) return "";
    return idea.authorName || getUserById(idea.authorId)?.name || "Team member";
  }, [idea]);

  const voters = useMemo(() => {
    if (!idea) return [];
    const ids = idea.voters || [];
    return ids.map((vid) => {
      const sid = String(vid);
      if (currentUser && sid === String(currentUser.id)) {
        return { id: sid, name: currentUser.name };
      }
      return { id: sid, name: "Colleague" };
    });
  }, [idea, currentUser]);

  const extraVoteCount = useMemo(() => {
    if (!idea) return 0;
    return Math.max(0, (idea.votes ?? 0) - (idea.voters || []).length);
  }, [idea]);

  const alreadyVoted = useMemo(() => {
    if (!idea || !currentUser?.id) return false;
    const voterIds = (idea.voters || []).map((v) => String(v));
    return voterIds.includes(String(currentUser.id));
  }, [idea, currentUser]);

  useEffect(() => {
    if (!idea) navigate("/dashboard", { replace: true });
  }, [idea, navigate]);

  if (!idea) return null;

  const badge = STATUS_INFO[idea.progressStatus] || { label: idea.progressStatus || "—", cls: "ds-badge-navy" };
  const canResumeDevil = idea.progressStatus === "devils_advocate";

  const handleVote = () => voteIdea(idea.id);

  const handleComment = () => {
    if (!comment.trim()) return;
    addComment(idea.id, comment);
    setComment("");
  };

  return (
    <AppShell>
      {/* Back nav */}
      <div className="ds-row">
        <Link to="/dashboard" className="ds-btn ds-btn-ghost ds-btn-sm">
          ← Feed
        </Link>
        {canResumeDevil && (
          <Link to={`/devil/${idea.id}`} className="ds-btn ds-btn-secondary ds-btn-sm">
            Open Devil&apos;s Advocate
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
            <span className={`ds-badge ${badge.cls}`}>{badge.label}</span>
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
            {idea.aiReviewed && (
              <span className="ds-badge ds-badge-purple">AI reviewed</span>
            )}
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
                <div style={{ display: "flex", gap: -8, flexWrap: "wrap" }}>
                  {voters.map((u) => (
                    <Avatar key={u.id} name={u.name} size={30} />
                  ))}
                  {extraVoteCount > 0 && (
                    <div
                      className="ds-avatar"
                      style={{
                        width: 30, height: 30, fontSize: "0.6rem",
                        background: "rgba(255,255,255,0.12)",
                        border: "2px solid rgba(255,255,255,0.1)",
                        color: "var(--color-text-secondary)",
                      }}
                    >
                      +{extraVoteCount}
                    </div>
                  )}
                </div>
              ) : (
                <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
                  No votes yet — be first.
                </span>
              )}
            </div>

            <button
              type="button"
              className={`ds-btn ${alreadyVoted ? "ds-btn-ghost" : "ds-btn-secondary"}`}
              onClick={handleVote}
              disabled={alreadyVoted}
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

      {/* Devil's Advocate responses */}
      {idea.devilAnswers?.some((a) => a?.trim()) && (
        <section className="ds-stack">
          <h2 className="ds-heading-3">Devil&apos;s Advocate responses</h2>
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
          Devil&apos;s Advocate was skipped. Document risks directly in the description before the
          steering committee review.
        </div>
      )}

      {/* Discussion */}
      <section className="ds-stack">
        <h2 className="ds-heading-3">
          Discussion
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
          <p className="ds-body-sm">No comments yet. Start the thread.</p>
        ) : (
          <div className="ds-stack-sm">
            {idea.comments.map((c) => {
              const who = c.authorName || getUserById(c.authorId)?.name || "Colleague";
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
            {currentUser ? `Add comment as ${currentUser.name}` : "Add a comment"}
          </label>
          <textarea
            id="new-comment"
            className="ds-textarea"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Ask a clarifying question, offer to pilot, or link to related data."
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
            Post comment
          </button>
        </div>
      </section>
    </AppShell>
  );
}
