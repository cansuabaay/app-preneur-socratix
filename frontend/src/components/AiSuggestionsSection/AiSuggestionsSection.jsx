import Icon from "../ds/Icon";
import { useTranslation } from "../../i18n/useTranslation";

export default function AiSuggestionsSection({
  visible,
  summary,
  improvements,
  similarWarnings,
  onAccept,
  onDismiss,
  onAckSimilar,
  onDismissSimilar,
}) {
  const { t } = useTranslation();

  if (!visible) return null;

  const pending = improvements.filter((i) => i.status === "pending");
  const visibleWarnings = similarWarnings.filter((w) => !w.dismissed);

  if (!pending.length && !visibleWarnings.length) {
    return (
      <div
        style={{
          background: "rgba(52,211,153,0.07)",
          border: "1px solid rgba(52,211,153,0.2)",
          borderRadius: "var(--radius-lg)",
          padding: "var(--space-4) var(--space-5)",
          fontSize: "var(--text-sm)",
          color: "var(--color-text-secondary)",
        }}
      >
        {t("ai.allResolved")}
      </div>
    );
  }

  return (
    <div className="ds-stack">
      {summary && (
        <p
          style={{
            margin: 0,
            fontSize: "var(--text-sm)",
            color: "var(--color-text-secondary)",
            lineHeight: "var(--leading-relaxed)",
          }}
        >
          {summary}
        </p>
      )}

      {pending.length > 0 && (
        <section className="ds-stack">
          <div className="ds-row" style={{ gap: "var(--space-3)" }}>
            <Icon name="sparkles" size={18} />
            <h3
              style={{
                margin: 0,
                fontSize: "var(--text-lg)",
                fontWeight: 700,
                color: "var(--color-text-primary)",
              }}
            >
              {t("ai.suggestionsTitle")}
            </h3>
          </div>

          {pending.map((s) => (
            <div
              key={s.id}
              style={{
                background: "rgba(79,142,247,0.06)",
                border: "1px solid rgba(79,142,247,0.18)",
                borderRadius: "var(--radius-lg)",
                padding: "var(--space-4) var(--space-5)",
              }}
            >
              <p
                style={{
                  margin: 0,
                  fontSize: "var(--text-sm)",
                  color: "var(--color-text-secondary)",
                  lineHeight: "var(--leading-relaxed)",
                }}
              >
                {s.text}
              </p>
              <div className="ds-row" style={{ marginTop: "var(--space-4)" }}>
                <button
                  type="button"
                  className="ds-btn ds-btn-primary ds-btn-sm"
                  onClick={() => onAccept(s.id)}
                >
                  {t("ai.accept")}
                </button>
                <button
                  type="button"
                  className="ds-btn ds-btn-ghost ds-btn-sm"
                  onClick={() => onDismiss(s.id)}
                >
                  {t("ai.dismiss")}
                </button>
              </div>
            </div>
          ))}
        </section>
      )}

      {visibleWarnings.length > 0 && (
        <section className="ds-stack">
          <h3
            style={{
              margin: 0,
              fontSize: "var(--text-lg)",
              fontWeight: 700,
              color: "var(--color-text-primary)",
            }}
          >
            {t("ai.similarTitle")}
          </h3>

          {visibleWarnings.map((w) => (
            <div
              key={w.id}
              style={{
                background: "rgba(251,146,60,0.07)",
                border: "1px solid rgba(251,146,60,0.25)",
                borderRadius: "var(--radius-lg)",
                padding: "var(--space-4) var(--space-5)",
              }}
            >
              <span className="ds-badge ds-badge-warning">
                {w.title || t("ai.similarDefaultTitle")}
              </span>
              <p
                style={{
                  margin: "var(--space-3) 0 0",
                  fontSize: "var(--text-sm)",
                  color: "var(--color-text-secondary)",
                  lineHeight: "var(--leading-relaxed)",
                }}
              >
                {w.detail}
              </p>
              <div className="ds-row" style={{ marginTop: "var(--space-4)" }}>
                <button
                  type="button"
                  className="ds-btn ds-btn-secondary ds-btn-sm"
                  onClick={() => onAckSimilar(w.id)}
                >
                  {t("ai.acknowledge")}
                </button>
                <button
                  type="button"
                  className="ds-btn ds-btn-ghost ds-btn-sm"
                  onClick={() => onDismissSimilar(w.id)}
                >
                  {t("ai.dismiss")}
                </button>
              </div>
            </div>
          ))}
        </section>
      )}
    </div>
  );
}
