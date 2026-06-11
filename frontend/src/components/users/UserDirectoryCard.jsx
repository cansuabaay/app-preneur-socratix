import Icon from "../ds/Icon";
import ProfileAvatar from "../profile/ProfileAvatar";
import { useTranslation } from "../../i18n/useTranslation";

export default function UserDirectoryCard({
  user,
  departmentLabel,
  innovationRoleLabel,
  isSelf,
  onMessage,
}) {
  const { t } = useTranslation();

  return (
    <div className="ds-card ds-stack-sm" style={{ height: "100%" }}>
      <div className="ds-row-between" style={{ alignItems: "flex-start" }}>
        <ProfileAvatar
          name={user.name}
          initials={user.avatarInitials}
          avatarUrl={user.avatarUrl}
          size={52}
          style={{ fontSize: "var(--text-sm)", boxShadow: "none" }}
        />
        {isSelf && (
          <span className="ds-badge ds-badge-accent">{t("users.youBadge")}</span>
        )}
      </div>

      <div>
        <h3
          style={{
            margin: 0,
            fontSize: "var(--text-lg)",
            fontWeight: 700,
            color: "var(--color-text-primary)",
          }}
        >
          {user.name}
        </h3>
        {user.jobTitle && (
          <p
            className="ds-body-sm"
            style={{
              margin: "var(--space-1) 0 0",
              color: "var(--color-text-secondary)",
              fontWeight: 500,
            }}
          >
            {user.jobTitle}
          </p>
        )}
      </div>

      <div className="ds-stack-sm" style={{ marginTop: "var(--space-1)" }}>
        <div className="ds-row" style={{ gap: "var(--space-2)", flexWrap: "wrap" }}>
          <span className="ds-badge ds-badge-navy">{departmentLabel}</span>
          {innovationRoleLabel && (
            <span className="ds-badge ds-badge-purple">{innovationRoleLabel}</span>
          )}
        </div>
        {user.bio && (
          <p
            className="ds-body-sm"
            style={{
              margin: 0,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {user.bio}
          </p>
        )}
      </div>

      {!isSelf && (
        <button
          type="button"
          className="ds-btn ds-btn-secondary ds-btn-block"
          style={{ marginTop: "auto" }}
          onClick={() => onMessage(user)}
        >
          <Icon name="send" size={14} />
          {t("users.sendMessage")}
        </button>
      )}
    </div>
  );
}
