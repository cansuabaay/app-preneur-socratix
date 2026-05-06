import { useState } from "react";
import { Link } from "react-router-dom";
import SocratixLogo from "../components/ds/SocratixLogo";
import Icon from "../components/ds/Icon";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent]   = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSent(true);
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
          {!sent ? (
            <>
              <h1 style={{ fontSize: "var(--text-2xl)", fontWeight: 800, color: "var(--color-text-primary)", margin: "0 0 var(--space-2)" }}>
                Reset password
              </h1>
              <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)", margin: "0 0 var(--space-6)" }}>
                Enter your work email and we'll send a reset link (demo — nothing is transmitted).
              </p>

              <form className="ds-stack" onSubmit={handleSubmit}>
                <div>
                  <label className="ds-label" htmlFor="fp-email">Work email</label>
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
                  disabled={!email.trim()}
                  style={{ padding: "0.85rem" }}
                >
                  Send reset link
                </button>
              </form>
            </>
          ) : (
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
                Check your inbox
              </h2>
              <p className="ds-body-sm">
                In a live environment, a reset link would be sent to{" "}
                <strong style={{ color: "var(--color-brand)" }}>{email}</strong>.
                Nothing leaves your browser in this demo.
              </p>
            </div>
          )}

          <div className="ds-divider" style={{ margin: "var(--space-6) 0" }} />
          <p style={{ textAlign: "center", fontSize: "var(--text-sm)", color: "var(--color-text-muted)", margin: 0 }}>
            <Link to="/login" style={{ color: "var(--color-brand)", fontWeight: 700 }}>
              ← Back to sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
