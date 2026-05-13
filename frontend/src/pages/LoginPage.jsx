import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import SocratixLogo from "../components/ds/SocratixLogo";
import Icon from "../components/ds/Icon";
import { useSocratixStore } from "../data/SocratixStoreProvider";

function PasswordInput({ id, label, value, onChange }) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <label className="ds-label" htmlFor={id}>{label}</label>
      <div style={{ position: "relative" }}>
        <span style={{
          position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)",
          color: "var(--color-text-muted)", pointerEvents: "none",
        }}>
          <Icon name="lock" size={15} />
        </span>
        <input
          id={id}
          type={show ? "text" : "password"}
          value={value}
          onChange={onChange}
          className="ds-input"
          style={{ paddingLeft: "2.5rem", paddingRight: "2.8rem" }}
          autoComplete="current-password"
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          style={{
            position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
            background: "none", border: "none", cursor: "pointer",
            color: "var(--color-text-muted)", padding: 4,
          }}
          aria-label={show ? "Hide password" : "Show password"}
        >
          <Icon name={show ? "eyeOff" : "eye"} size={15} />
        </button>
      </div>
    </div>
  );
}

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, isAuthenticated, t } = useSocratixStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) { setError(t("loginEmailRequired")); return; }
    if (!password) { setError(t("loginPasswordRequired")); return; }
    setError("");
    setLoading(true);
    try {
      await login(email.trim(), password);
      navigate("/dashboard");
    } catch (err) {
      const message =
        err?.status === 401
          ? t("loginInvalidCreds")
          : err?.message || t("loginFailed");
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "var(--space-6) var(--space-4)",
        animation: "ds-page-enter 350ms both",
      }}
    >
      <div style={{ width: "100%", maxWidth: 440 }}>
        {/* Logo + wordmark */}
        <div className="ds-row" style={{ justifyContent: "center", marginBottom: "var(--space-8)", gap: "var(--space-4)" }}>
          <SocratixLogo size={52} />
          <div>
            <div
              style={{
                fontWeight: 900,
                fontSize: "var(--text-3xl)",
                letterSpacing: "-0.03em",
                background: "linear-gradient(90deg, #4f8ef7 0%, #a855f7 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Socratix
            </div>
            <div style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)", marginTop: 2 }}>
              {t("brandTagline")}
            </div>
          </div>
        </div>

        <div className="ds-card-auth">
          <h1 style={{
            fontSize: "var(--text-2xl)", fontWeight: 800,
            color: "var(--color-text-primary)", margin: "0 0 var(--space-2)",
          }}>
            {t("loginWelcomeBack")}
          </h1>
          <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)", margin: "0 0 var(--space-6)" }}>
            {t("signIn")} {t("loginSignInBlurb")}
          </p>

          {error && (
            <div className="ds-alert ds-alert-error" style={{ marginBottom: "var(--space-4)" }}>
              {error}
            </div>
          )}

          <form className="ds-stack" onSubmit={handleSubmit}>
            {/* Email */}
            <div>
              <label className="ds-label" htmlFor="login-email">{t("loginEmailLabel")}</label>
              <div style={{ position: "relative" }}>
                <span style={{
                  position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)",
                  color: "var(--color-text-muted)", pointerEvents: "none",
                }}>
                  <Icon name="mail" size={15} />
                </span>
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="ds-input"
                  style={{ paddingLeft: "2.5rem" }}
                  autoComplete="email"
                  placeholder="you@company.com"
                />
              </div>
            </div>

            <PasswordInput
              id="login-password"
              label={t("loginPasswordLabel")}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "calc(-1 * var(--space-2))" }}>
              <Link to="/forgot" style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
                {t("forgotPassword")}
              </Link>
            </div>

            <button
              type="submit"
              className="ds-btn ds-btn-primary ds-btn-block"
              disabled={loading}
              style={{ marginTop: "var(--space-2)", padding: "0.85rem" }}
            >
              {loading ? t("loadingEllipsis") : t("signIn")}
              {!loading && <Icon name="chevronRight" size={16} />}
            </button>
          </form>

          <div className="ds-divider" style={{ margin: "var(--space-6) 0" }} />

          <p style={{ textAlign: "center", fontSize: "var(--text-sm)", color: "var(--color-text-muted)", margin: 0 }}>
            {t("loginNewPrompt")}{" "}
            <Link to="/signup" style={{ color: "var(--color-brand)", fontWeight: 700 }}>
              {t("signUp")}
            </Link>
          </p>
        </div>

        <p style={{ textAlign: "center", fontSize: "var(--text-xs)", color: "var(--color-text-muted)", marginTop: "var(--space-6)" }}>
          {t("loginFooter")}
        </p>
      </div>
    </div>
  );
}
