import { useTranslation } from "../../i18n/useTranslation";

export default function AuthLanguageToggle() {
  const { t, language, setLanguage } = useTranslation();

  return (
    <button
      type="button"
      onClick={() => setLanguage(language === "en" ? "tr" : "en")}
      className="ds-nav-link"
      style={{
        position: "fixed",
        top: "var(--space-4)",
        right: "var(--space-4)",
        zIndex: 20,
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.08)",
        color: "var(--color-text-secondary)",
        cursor: "pointer",
        borderRadius: "var(--radius-lg)",
        padding: "var(--space-2) var(--space-3)",
      }}
      aria-label={t("languageToggleAria")}
      title={t("languageToggleTitle")}
    >
      <span style={{ fontWeight: 800, letterSpacing: "0.08em", fontSize: "var(--text-xs)" }}>
        {language.toUpperCase()}
      </span>
    </button>
  );
}
