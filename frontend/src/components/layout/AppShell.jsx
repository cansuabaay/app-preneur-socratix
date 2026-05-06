import { useEffect } from "react";
import { NavLink, Link, useNavigate } from "react-router-dom";
import SocratixLogo from "../ds/SocratixLogo";
import Icon from "../ds/Icon";
import { useSocratixStore } from "../../data/SocratixStoreProvider";

const NAV = [
  { to: "/dashboard", icon: "dashboard", labelKey: "dashboard" },
  { to: "/create",    icon: "plus",      labelKey: "createIdea" },
  { to: "/messages",  icon: "comment",   labelKey: "messages" },
  { to: "/profile",   icon: "user",      labelKey: "profile" },
];

export default function AppShell({ children }) {
  const { currentUser, language, setLanguage, t, toasts, removeToast } = useSocratixStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (toasts.length === 0) return;
    const timers = toasts.map((toast) =>
      setTimeout(() => removeToast(toast.id), 2600)
    );
    return () => timers.forEach(clearTimeout);
  }, [toasts, removeToast]);

  return (
    <div className="ds-page">
      <header className="ds-header-bar">
        <div
          className="ds-row-between"
          style={{ maxWidth: 980, margin: "0 auto", flexWrap: "nowrap" }}
        >
          {/* Brand mark */}
          <Link to="/dashboard" className="ds-row" style={{ gap: "var(--space-3)", flexShrink: 0, textDecoration: "none" }}>
            <SocratixLogo size={38} />
            <span
              style={{
                fontWeight: 800,
                fontSize: "var(--text-lg)",
                letterSpacing: "-0.02em",
                background: "linear-gradient(90deg, #4f8ef7, #a855f7)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Socratix
            </span>
          </Link>

          {/* Nav links */}
          <nav className="ds-row" style={{ gap: "var(--space-1)" }}>
            {NAV.map(({ to, icon, labelKey }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `ds-nav-link ${isActive ? "ds-nav-link-active" : ""}`
                }
              >
                <Icon name={icon} size={16} />
                <span className="nav-label-text">{t(labelKey)}</span>
              </NavLink>
            ))}
          </nav>

          {/* Language toggle */}
          <button
            type="button"
            onClick={() => setLanguage(language === "en" ? "tr" : "en")}
            className="ds-nav-link"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "var(--color-text-secondary)",
            }}
            aria-label="Language toggle"
            title="EN / TR"
          >
            <span style={{ fontWeight: 800, letterSpacing: "0.08em" }}>
              {language.toUpperCase()}
            </span>
          </button>

          {/* User pill */}
          {currentUser && (
            <button
              type="button"
              className="ds-row"
              onClick={() => navigate("/profile")}
              style={{
                background: "rgba(79,142,247,0.12)",
                border: "1px solid rgba(79,142,247,0.2)",
                borderRadius: "var(--radius-full)",
                padding: "var(--space-2) var(--space-3)",
                cursor: "pointer",
                gap: "var(--space-2)",
                flexShrink: 0,
              }}
            >
              <div
                className="ds-avatar"
                style={{ width: 26, height: 26, fontSize: "0.6rem" }}
              >
                {currentUser.avatarInitials}
              </div>
              <span
                style={{
                  fontSize: "var(--text-xs)",
                  fontWeight: 700,
                  color: "var(--color-brand)",
                  maxWidth: 90,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {currentUser.name.split(" ")[0]}
              </span>
            </button>
          )}
        </div>
      </header>

      <main className="ds-container ds-stack-lg">{children}</main>

      {/* Toasts */}
      <div
        style={{
          position: "fixed",
          top: 14,
          right: 14,
          zIndex: 999,
          display: "flex",
          flexDirection: "column",
          gap: "var(--space-2)",
          maxWidth: 340,
          pointerEvents: "none",
        }}
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            style={{
              pointerEvents: "auto",
              background: "rgba(52,211,153,0.10)",
              border: "1px solid rgba(52,211,153,0.25)",
              borderRadius: "var(--radius-lg)",
              padding: "var(--space-3) var(--space-4)",
              color: "var(--color-success)",
              fontSize: "var(--text-sm)",
              boxShadow: "0 14px 30px rgba(0,0,0,0.35)",
              backdropFilter: "var(--glass-blur)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "var(--space-3)",
              animation: "ds-page-enter 220ms both",
            }}
          >
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
              <span aria-hidden>✓</span>
              {t(toast.key)}
            </span>
            <button
              type="button"
              onClick={() => removeToast(toast.id)}
              className="ds-btn ds-btn-ghost ds-btn-sm"
              style={{ pointerEvents: "auto" }}
            >
              ×
            </button>
          </div>
        ))}
      </div>

      <style>{`
        @media (max-width: 540px) {
          .nav-label-text { display: none; }
        }
      `}</style>
    </div>
  );
}
