import { Link } from "react-router-dom";
import Icon from "../ds/Icon";
import ProfileAvatar from "../profile/ProfileAvatar";
import { getDepartmentName, getUserById } from "../../data/mockData";
import { useSocratixStore } from "../../data/SocratixStoreProvider";
import { useTranslation } from "../../i18n/useTranslation";
import { getIdeaStatusBadge } from "../../i18n/statusLabels";
import { resolveAvatarUrl } from "../../services/api";
import { hasAiChallengeCompleted } from "../../utils/reviewAnswers";
import { hasStrategicAnalysis } from "../../utils/strategicAnalysis";

export default function IdeaFeedCard({ idea, display }) {
  const { lookupUser } = useSocratixStore();
  const { t } = useTranslation();
  const author = idea.authorName || getUserById(idea.authorId)?.name || t("teamMember");
  const authorUser = lookupUser(idea.authorId);
  const authorAvatarUrl =
    resolveAvatarUrl(idea.authorAvatarUrl) ||
    authorUser?.avatarUrl ||
    null;
  const title = display?.title ?? idea.title;
  const description = display?.description ?? idea.description;
  const dept = getDepartmentName(idea.departmentId);
  const cat = display?.categoryLabel ?? idea.categoryId;
  const badge = getIdeaStatusBadge(idea.progressStatus, t);
  const showAiChallenged = hasAiChallengeCompleted(idea);
  const showStrategicAnalysis = hasStrategicAnalysis(idea);

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
          <div className="ds-row" style={{ gap: "var(--space-2)", flexWrap: "wrap", alignItems: "center" }}>
            <span className={`ds-badge ${badge.cls}`}>{badge.label}</span>
            {showAiChallenged && (
              <span className="ds-badge ds-badge-purple">{t("idea.aiReviewedBadge")}</span>
            )}
            {showStrategicAnalysis && (
              <span className="ds-badge ds-badge-accent">{t("idea.aiStrategicAnalysisBadge")}</span>
            )}
          </div>
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
          {title}
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
          {description.length > 150
            ? `${description.slice(0, 150)}…`
            : description}
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
          <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
            <ProfileAvatar
              name={author}
              initials={(authorUser?.avatarInitials) || author.slice(0, 2).toUpperCase()}
              avatarUrl={authorAvatarUrl}
              size={24}
              style={{ fontSize: "0.55rem", border: "1px solid rgba(255,255,255,0.12)", boxShadow: "none" }}
            />
            <span style={{ fontWeight: 600 }}>{author}</span>
          </span>
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
        </div>
      </div>
    </Link>
  );
}
