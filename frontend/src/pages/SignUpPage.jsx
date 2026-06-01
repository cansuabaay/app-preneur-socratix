import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import SocratixLogo from "../components/ds/SocratixLogo";
import Icon from "../components/ds/Icon";
import { categories, departments } from "../data/mockData";
import { useSocratixStore } from "../data/SocratixStoreProvider";
import { useTranslation } from "../i18n/useTranslation";

function Field({ id, label, children }) {
  return (
    <div>
      <label className="ds-label" htmlFor={id}>{label}</label>
      {children}
    </div>
  );
}

export default function SignUpPage() {
  const navigate = useNavigate();
  const { signUp, isAuthenticated } = useSocratixStore();
  const { t } = useTranslation();

  const [name, setName]           = useState("");
  const [email, setEmail]         = useState("");
  const [password, setPassword]   = useState("");
  const [confirm, setConfirm]     = useState("");
  const [showPass, setShowPass]   = useState(false);
  const [deptId, setDeptId]       = useState("dept-rd");
  const [interests, setInterests] = useState(new Set());
  const [error, setError]         = useState("");
  const [loading, setLoading]     = useState(false);

  if (isAuthenticated) {
    navigate("/dashboard", { replace: true });
    return null;
  }

  const deptOptions = useMemo(
    () => departments.map((d) => ({ value: d.id, label: d.name })),
    []
  );

  const toggle = (id) =>
    setInterests((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim())       { setError(t("signUpNameRequired")); return; }
    if (!email.trim())      { setError(t("signUpEmailRequired")); return; }
    if (password.length < 6){ setError(t("signUpPasswordTooShort")); return; }
    if (password !== confirm){ setError(t("signUpPasswordMismatch")); return; }
    if (interests.size === 0){ setError(t("signUpThemesRequired")); return; }
    setError("");
    setLoading(true);
    try {
      await signUp({
        name: name.trim(),
        email: email.trim(),
        password,
        departmentId: deptId,
        interests: Array.from(interests),
      });
      navigate("/dashboard");
    } catch (err) {
      setError(err?.message || t("signUpFailed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        padding: "var(--space-8) var(--space-4) var(--space-16)",
        animation: "ds-page-enter 350ms both",
      }}
    >
      <div style={{ width: "100%", maxWidth: 520 }}>
        {/* Header */}
        <div className="ds-row" style={{ justifyContent: "center", marginBottom: "var(--space-8)", gap: "var(--space-4)" }}>
          <SocratixLogo size={46} />
          <div>
            <div
              style={{
                fontWeight: 900,
                fontSize: "var(--text-2xl)",
                letterSpacing: "-0.03em",
                background: "linear-gradient(90deg, #4f8ef7 0%, #a855f7 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Socratix
            </div>
            <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", marginTop: 2 }}>
              {t("brandTagline")}
            </div>
          </div>
        </div>

        <div className="ds-card-auth">
          <h1 style={{
            fontSize: "var(--text-2xl)", fontWeight: 800,
            color: "var(--color-text-primary)", margin: "0 0 var(--space-2)",
          }}>
            {t("signUpWorkspaceTitle")}
          </h1>
          <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)", margin: "0 0 var(--space-6)" }}>
            {t("signUpWorkspaceSubtitle")}
          </p>

          {error && (
            <div className="ds-alert ds-alert-error" style={{ marginBottom: "var(--space-4)" }}>
              {error}
            </div>
          )}

          <form className="ds-stack" onSubmit={handleSubmit}>
            {/* Full name */}
            <Field id="su-name" label={t("signUpFullName")}>
              <input id="su-name" type="text" value={name}
                onChange={(e) => setName(e.target.value)}
                className="ds-input" placeholder="e.g. Jordan Okonkwo" autoComplete="name" />
            </Field>

            {/* Email */}
            <Field id="su-email" label={t("loginEmailLabel")}>
              <div style={{ position: "relative" }}>
                <span style={{
                  position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)",
                  color: "var(--color-text-muted)", pointerEvents: "none",
                }}>
                  <Icon name="mail" size={14} />
                </span>
                <input id="su-email" type="email" value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="ds-input" style={{ paddingLeft: "2.4rem" }}
                  placeholder="you@company.com" autoComplete="email" />
              </div>
            </Field>

            {/* Passwords side by side */}
            <div className="ds-row" style={{ alignItems: "flex-start", flexWrap: "wrap", gap: "var(--space-3)" }}>
              <div style={{ flex: "1 1 180px" }}>
                <label className="ds-label" htmlFor="su-pass">{t("signUpPassword")}</label>
                <div style={{ position: "relative" }}>
                  <input id="su-pass" type={showPass ? "text" : "password"} value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="ds-input" style={{ paddingRight: "2.6rem" }}
                    placeholder={t("signUpPasswordHint")} autoComplete="new-password" />
                  <button type="button" onClick={() => setShowPass((s) => !s)}
                    style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
                      background: "none", border: "none", cursor: "pointer",
                      color: "var(--color-text-muted)", padding: 4 }}>
                    <Icon name={showPass ? "eyeOff" : "eye"} size={14} />
                  </button>
                </div>
              </div>
              <div style={{ flex: "1 1 180px" }}>
                <label className="ds-label" htmlFor="su-confirm">{t("signUpConfirmPassword")}</label>
                <input id="su-confirm" type={showPass ? "text" : "password"} value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className="ds-input" placeholder={t("signUpRepeatPassword")} autoComplete="new-password" />
              </div>
            </div>

            {/* Department */}
            <Field id="su-dept" label={t("signUpDepartment")}>
              <select id="su-dept" value={deptId}
                onChange={(e) => setDeptId(e.target.value)} className="ds-select">
                {deptOptions.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </Field>

            {/* Interest chips */}
            <div>
              <span className="ds-label">{t("signUpThemes")}</span>
              <div className="ds-chip-group">
                {categories.map((c) => (
                  <button key={c.id} type="button"
                    className={`ds-chip ${interests.has(c.id) ? "ds-chip-selected" : ""}`}
                    onClick={() => toggle(c.id)}>
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              className="ds-btn ds-btn-primary ds-btn-block"
              disabled={loading}
              style={{ marginTop: "var(--space-2)", padding: "0.85rem" }}
            >
              {loading ? t("loadingEllipsis") : t("createAccount")}
              {!loading && <Icon name="chevronRight" size={16} />}
            </button>
          </form>

          <div className="ds-divider" style={{ margin: "var(--space-6) 0" }} />
          <p style={{ textAlign: "center", fontSize: "var(--text-sm)", color: "var(--color-text-muted)", margin: 0 }}>
            {t("signUpAlreadyHave")}{" "}
            <Link to="/login" style={{ color: "var(--color-brand)", fontWeight: 700 }}>{t("signIn")}</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
