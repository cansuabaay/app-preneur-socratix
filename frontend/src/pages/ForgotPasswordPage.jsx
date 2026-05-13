import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import SocratixLogo from "../components/ds/SocratixLogo";
import Icon from "../components/ds/Icon";
import { useSocratixStore } from "../data/SocratixStoreProvider";
import { authApi } from "../services/api";

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const { t } = useSocratixStore();

  const [email, setEmail] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [step, setStep] = useState("email");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRequest = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setError("");
    setLoading(true);
    try {
      const data = await authApi.forgotPassword({ email: email.trim() });
      if (data?.resetToken) {
        setResetToken(data.resetToken);
        setStep("reset");
      } else {
        setStep("sent");
      }
    } catch (err) {
      setError(err?.message || t("forgotErrRequest"));
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    if (password.length < 6) {
      setError(t("forgotErrWeak"));
      return;
    }
    if (password !== confirm) {
      setError(t("forgotErrMismatch"));
      return;
    }
    if (!resetToken.trim()) {
      setError(t("forgotErrReset"));
      return;
    }
    setError("");
    setLoading(true);
    try {
      await authApi.resetPassword({
        email: email.trim(),
        token: resetToken.trim(),
        newPassword: password,
      });
      setStep("done");
    } catch (err) {
      setError(err?.message || t("forgotErrReset"));
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
      <div style={{ width: "100%", maxWidth: 420 }}>
        <div className="ds-row" style={{ justifyContent: "center", marginBottom: "var(--space-8)", gap: "var(--space-3)" }}>
          <SocratixLogo size={42} />
          <span
            style={{
              fontWeight: 900, fontSize: "var(--text-2xl)", letterSpacing: "-0.03em",
              background: "linear-gradient(90deg, #4f8ef7, #a855f7)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}
          >
            Socratix
          </span>
        </div>

        <div className="ds-card-auth">
          {error && (
            <div className="ds-alert ds-alert-error" style={{ marginBottom: "var(--space-4)" }}>
              {error}
            </div>
          )}

          {step === "email" && (
            <>
              <h1 style={{ fontSize: "var(--text-2xl)", fontWeight: 800, color: "var(--color-text-primary)", margin: "0 0 var(--space-2)" }}>
                {t("forgotTitle")}
              </h1>
              <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)", margin: "0 0 var(--space-6)" }}>
                {t("forgotSubtitle")}
              </p>

              <form className="ds-stack" onSubmit={handleRequest}>
                <div>
                  <label className="ds-label" htmlFor="fp-email">{t("forgotEmailLabel")}</label>
                  <div style={{ position: "relative" }}>
                    <span style={{
                      position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)",
                      color: "var(--color-text-muted)", pointerEvents: "none",
                    }}>
                      <Icon name="mail" size={14} />
                    </span>
                    <input
                      id="fp-email" type="email" value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="ds-input" style={{ paddingLeft: "2.4rem" }}
                      placeholder="you@company.com" autoComplete="email"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="ds-btn ds-btn-primary ds-btn-block"
                  disabled={!email.trim() || loading}
                  style={{ padding: "0.85rem" }}
                >
                  {loading ? t("loadingEllipsis") : t("forgotSend")}
                </button>
              </form>
            </>
          )}

          {step === "reset" && (
            <form className="ds-stack" onSubmit={handleReset}>
              <h1 style={{ fontSize: "var(--text-2xl)", fontWeight: 800, color: "var(--color-text-primary)", margin: "0 0 var(--space-2)" }}>
                {t("forgotStep2Title")}
              </h1>
              <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)", margin: "0 0 var(--space-4)" }}>
                {t("forgotStep2Next")}
              </p>
              <div>
                <label className="ds-label" htmlFor="fp-token">{t("forgotTokenLabel")}</label>
                <textarea
                  id="fp-token"
                  className="ds-textarea"
                  rows={2}
                  value={resetToken}
                  onChange={(e) => setResetToken(e.target.value)}
                  placeholder={t("forgotTokenHelp")}
                  style={{ fontSize: "var(--text-xs)" }}
                />
              </div>
              <div>
                <label className="ds-label" htmlFor="fp-np">{t("forgotNewPassword")}</label>
                <input
                  id="fp-np" type="password" className="ds-input" value={password}
                  onChange={(e) => setPassword(e.target.value)} autoComplete="new-password"
                />
              </div>
              <div>
                <label className="ds-label" htmlFor="fp-cp">{t("forgotConfirmPassword")}</label>
                <input
                  id="fp-cp" type="password" className="ds-input" value={confirm}
                  onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password"
                />
              </div>
              <button type="submit" className="ds-btn ds-btn-primary ds-btn-block" disabled={loading} style={{ padding: "0.85rem" }}>
                {loading ? t("loadingEllipsis") : t("forgotSetPassword")}
              </button>
            </form>
          )}

          {step === "sent" && (
            <div className="ds-stack" style={{ textAlign: "center" }}>
              <div style={{
                width: 56, height: 56, borderRadius: "50%", margin: "0 auto",
                background: "linear-gradient(135deg, rgba(52,211,153,0.2), rgba(20,184,166,0.2))",
                display: "flex", alignItems: "center", justifyContent: "center",
                border: "1px solid rgba(52,211,153,0.3)",
              }}>
                <span style={{ fontSize: "1.5rem" }}>✓</span>
              </div>
              <h2 style={{ fontSize: "var(--text-xl)", fontWeight: 800, color: "var(--color-text-primary)", margin: 0 }}>
                {t("forgotGenericSent")}
              </h2>
              <p className="ds-body-sm" style={{ color: "var(--color-text-secondary)" }}>
                <strong style={{ color: "var(--color-brand)" }}>{email}</strong>
              </p>
            </div>
          )}

          {step === "done" && (
            <div className="ds-stack" style={{ textAlign: "center" }}>
              <h2 style={{ fontSize: "var(--text-xl)", fontWeight: 800, color: "var(--color-text-primary)", margin: 0 }}>
                {t("forgotSuccessTitle")}
              </h2>
              <p className="ds-body-sm">{t("forgotSuccessBody")}</p>
              <button type="button" className="ds-btn ds-btn-primary" onClick={() => navigate("/login")}>
                {t("signIn")}
              </button>
            </div>
          )}

          <div className="ds-divider" style={{ margin: "var(--space-6) 0" }} />
          <p style={{ textAlign: "center", fontSize: "var(--text-sm)", color: "var(--color-text-muted)", margin: 0 }}>
            <Link to="/login" style={{ color: "var(--color-brand)", fontWeight: 700 }}>
              {t("forgotBack")}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
