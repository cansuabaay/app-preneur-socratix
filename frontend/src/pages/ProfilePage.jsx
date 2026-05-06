import { useNavigate } from "react-router-dom";
import AppShell from "../components/layout/AppShell";
import Icon from "../components/ds/Icon";
import { getDepartmentName, getCategoryLabel } from "../data/mockData";
import { useSocratixStore } from "../data/SocratixStoreProvider";

function Toggle({ id, checked, onChange }) {
  return (
    <label className="ds-toggle" htmlFor={id}>
      <input id={id} type="checkbox" checked={checked} onChange={onChange} />
      <span className="ds-toggle-track" />
    </label>
  );
}

const ACCENT_COLORS = ["#4f8ef7", "#6366f1", "#a855f7", "#0d9488", "#f97316"];

export default function ProfilePage() {
  const navigate = useNavigate();
  const { currentUser, userSettings, updateSettings, logout, t, language, setLanguage } = useSocratixStore();

  if (!currentUser) return null;

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const dept = getDepartmentName(currentUser.departmentId);
  const accentIdx =
    currentUser.avatarInitials
      .split("")
      .reduce((a, c) => a + c.charCodeAt(0), 0) % ACCENT_COLORS.length;
  const avatarColor = ACCENT_COLORS[accentIdx];

  return (
    <AppShell>
      {/* Hero banner */}
      <div
        style={{
          borderRadius: "var(--radius-2xl)",
          overflow: "hidden",
          position: "relative",
          padding: "var(--space-8) var(--space-8) var(--space-12)",
          background: `linear-gradient(135deg, ${avatarColor}33 0%, rgba(99,102,241,0.18) 100%)`,
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        {/* Decorative blobs */}
        <div style={{
          position: "absolute", top: -40, right: -40, width: 160, height: 160,
          borderRadius: "50%", background: `${avatarColor}22`, filter: "blur(40px)",
        }} />
        <div style={{
          position: "absolute", bottom: -20, left: -20, width: 120, height: 120,
          borderRadius: "50%", background: "rgba(99,102,241,0.15)", filter: "blur(30px)",
        }} />

        <div className="ds-row" style={{ gap: "var(--space-5)", position: "relative" }}>
          <div
            className="ds-avatar"
            style={{
              width: 72, height: 72,
              fontSize: "var(--text-xl)",
              fontWeight: 900,
              background: `linear-gradient(135deg, ${avatarColor}, ${avatarColor}cc)`,
              boxShadow: `0 8px 24px ${avatarColor}55`,
              border: "3px solid rgba(255,255,255,0.15)",
            }}
          >
            {currentUser.avatarInitials}
          </div>
          <div>
            <h1 className="ds-heading-2">{currentUser.name}</h1>
            <p className="ds-body-sm" style={{ marginTop: "var(--space-1)" }}>
              {currentUser.title} · {dept}
            </p>
            {currentUser.email && (
              <p style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", marginTop: "var(--space-1)" }}>
                {currentUser.email}
              </p>
            )}
          </div>
        </div>

        {/* Interest chips */}
        {currentUser.interests?.length > 0 && (
          <div className="ds-chip-group" style={{ marginTop: "var(--space-5)", position: "relative" }}>
            {currentUser.interests.map((id) => (
              <span key={id} className="ds-chip ds-chip-selected"
                style={{ pointerEvents: "none" }}>
                {getCategoryLabel(id)}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Notifications */}
      <div
        style={{
          background: "var(--glass-bg)",
          border: "1px solid var(--glass-border)",
          borderRadius: "var(--radius-xl)",
          padding: "var(--space-6)",
          backdropFilter: "var(--glass-blur)",
        }}
      >
        <div className="ds-row" style={{ marginBottom: "var(--space-4)", gap: "var(--space-3)" }}>
          <Icon name="settings" size={18} style={{ color: "var(--color-brand)" }} />
          <h2 className="ds-heading-3">{t("settings")}</h2>
        </div>

        <div className="ds-toggle-row">
          <span className="ds-toggle-label">Email me when my ideas receive new comments</span>
          <Toggle
            id="notif-comments"
            checked={userSettings.emailNotifications}
            onChange={(e) => updateSettings({ emailNotifications: e.target.checked })}
          />
        </div>
        <div className="ds-toggle-row">
          <span className="ds-toggle-label">Weekly digest — top ideas across departments</span>
          <Toggle
            id="notif-digest"
            checked={userSettings.weeklyDigest}
            onChange={(e) => updateSettings({ weeklyDigest: e.target.checked })}
          />
        </div>
        <div className="ds-toggle-row">
          <span className="ds-toggle-label">Alert me when one of my ideas gets a new vote</span>
          <Toggle
            id="notif-votes"
            checked={userSettings.ideaVoteAlerts}
            onChange={(e) => updateSettings({ ideaVoteAlerts: e.target.checked })}
          />
        </div>
        <div className="ds-toggle-row">
          <span className="ds-toggle-label">Early access to experimental AI prompts</span>
          <Toggle
            id="notif-ai"
            checked={userSettings.experimentalAi}
            onChange={(e) => updateSettings({ experimentalAi: e.target.checked })}
          />
        </div>
      </div>

      {/* Logout */}
      <div>
        <div className="ds-row" style={{ marginBottom: "var(--space-4)" }}>
          <button
            type="button"
            className="ds-btn ds-btn-secondary"
            onClick={() => setLanguage(language === "en" ? "tr" : "en")}
          >
            {language.toUpperCase()} / {(language === "en" ? "TR" : "EN")}
          </button>
        </div>
        <button
          type="button"
          className="ds-btn ds-btn-danger"
          onClick={handleLogout}
          style={{ display: "inline-flex", gap: "var(--space-2)" }}
        >
          <Icon name="logout" size={16} />
          {t("logout")}
        </button>
        <p style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", marginTop: "var(--space-2)" }}>
          All session state will be cleared. Mock data resets on next sign-in.
        </p>
      </div>
    </AppShell>
  );
}
