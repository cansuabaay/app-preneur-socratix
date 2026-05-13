import { Link } from "react-router-dom";
import Icon from "../ds/Icon";
import {
  getCategoryLabel,
  getDepartmentName,
  getUserById,
} from "../../data/mockData";
import { useSocratixStore } from "../../data/SocratixStoreProvider";

const STATUS_KEYS = {
  draft: "statusDraft",
  ai_enhanced: "statusAiEnhanced",
  devils_advocate: "statusDevilsAdvocate",
  published: "statusPublished",
};

const STATUS_CLS = {
  draft: "ds-badge-warning",
  ai_enhanced: "ds-badge-accent",
  devils_advocate: "ds-badge-purple",
  published: "ds-badge-success",
};

export default function IdeaFeedCard({ idea }) {
  const { t } = useSocratixStore();
  const statusKey = STATUS_KEYS[idea.progressStatus];
  const badge = statusKey
    ? { label: t(statusKey), cls: STATUS_CLS[idea.progressStatus] || "ds-badge-navy" }
    : { label: idea.progressStatus || "—", cls: "ds-badge-navy" };

  const author = idea.authorName || getUserById(idea.authorId)?.name || t("teamMember");
  const dept   = getDepartmentName(idea.departmentId);
  const cat    = getCategoryLabel(idea.categoryId);

  return (
    <Link to={`/ideas/${idea.id}`} style={{ textDecoration: "none", color: "inherit" }}>
      <div
        style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: "var(--radius-xl)",
          padding: "var(--space-5)",
          transition: "transform var(--transition-base), border-color var(--transition-base), box-shadow var(--transition-base)",
          cursor: "pointer",
          position: "relative",
          overflow: "hidden",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "translateY(-3px)";
          e.currentTarget.style.borderColor = "rgba(79,142,247,0.4)";
          e.currentTarget.style.boxShadow = "0 12px 40px rgba(0,0,0,0.4), 0 0 0 1px rgba(79,142,247,0.12)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)";
          e.currentTarget.style.boxShadow = "none";
        }}
      >
        {/* Top row */}
        <div className="idea-feed-card__top">
          <span className={`ds-badge ${badge.cls}`}>{badge.label}</span>
          <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>{cat}</span>
        </div>

        {/* Title */}
        <h3
          style={{
            fontSize: "var(--text-lg)",
            fontWeight: 700,
            color: "var(--color-text-primary)",
            margin: "var(--space-3) 0 var(--space-2)",
            lineHeight: "var(--leading-snug)",
          }}
        >
          {idea.title}
        </h3>

        {/* Excerpt */}
        <p
          style={{
            fontSize: "var(--text-sm)",
            color: "var(--color-text-secondary)",
            lineHeight: "var(--leading-relaxed)",
            margin: 0,
          }}
        >
          {idea.description.length > 150
            ? `${idea.description.slice(0, 150)}…`
            : idea.description}
        </p>

        {/* Meta row */}
        <div
          style={{
            marginTop: "var(--space-4)",
            display: "flex",
            flexWrap: "wrap",
            gap: "var(--space-4)",
            alignItems: "center",
            fontSize: "var(--text-xs)",
            color: "var(--color-text-muted)",
          }}
        >
          <span style={{ fontWeight: 600 }}>{author}</span>
          <span>{dept}</span>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              color: idea.votes > 20 ? "var(--color-brand)" : "var(--color-text-muted)",
              fontWeight: idea.votes > 20 ? 700 : 400,
            }}
          >
            <Icon name="vote" size={13} />
            {idea.votes ?? 0}
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
            <Icon name="comment" size={13} />
            {idea.comments?.length ?? 0}
          </span>
          {idea.aiReviewed && (
            <span
              style={{
                background: "rgba(168,85,247,0.15)",
                color: "var(--color-purple)",
                fontWeight: 700,
                fontSize: "0.6rem",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                padding: "2px 6px",
                borderRadius: "var(--radius-sm)",
              }}
            >
              AI
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
