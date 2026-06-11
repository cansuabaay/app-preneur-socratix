import TranslatingIndicator from "../content/TranslatingIndicator";
import Icon from "../ds/Icon";
import { useTranslation } from "../../i18n/useTranslation";
import {
  categoryLabelKey,
  improvementDescriptionStyle,
  improvementTitleStyle,
  resolveImprovementDisplay,
  sortImprovements,
} from "../../utils/aiImprovements";

function SuggestionCard({ suggestion, onAccept, onDismiss, t }) {
  const { title: displayTitle, description } = resolveImprovementDisplay({
    title: suggestion.title,
    text: suggestion.text,
  });
  const categoryKey = categoryLabelKey(suggestion.category);
  const categoryLabel = t(categoryKey);
  const showCategory = !displayTitle && categoryLabel !== categoryKey;

  return (
    <div
      className="ds-card"
      style={{
        background: "var(--glass-bg)",
        border: "1px solid rgba(79,142,247,0.22)",
        borderRadius: "var(--radius-xl)",
        padding: "var(--space-4) var(--space-5)",
        backdropFilter: "var(--glass-blur)",
      }}
    >
      <div className="ds-row" style={{ gap: "var(--space-3)", alignItems: "flex-start" }}>
        <span
          style={{
            width: 34,
            height: 34,
            borderRadius: "var(--radius-lg)",
            background: "linear-gradient(135deg, rgba(79,142,247,0.28), rgba(168,85,247,0.28))",
            border: "1px solid rgba(79,142,247,0.35)",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--color-brand)",
            flexShrink: 0,
          }}
          aria-hidden
        >
          <Icon name="sparkles" size={16} />
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          {showCategory && (
            <p
              style={{
                margin: "0 0 var(--space-1)",
                fontSize: "var(--text-xs)",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                color: "var(--color-brand)",
              }}
            >
              {categoryLabel}
            </p>
          )}
          {displayTitle && (
            <h4 style={improvementTitleStyle}>
              {displayTitle}
            </h4>
          )}
          {description && (
            <p style={improvementDescriptionStyle}>
              {description}
            </p>
          )}
          <div className="ds-row" style={{ marginTop: "var(--space-4)" }}>
            <button
              type="button"
              className="ds-btn ds-btn-primary ds-btn-sm"
              onClick={() => onAccept(suggestion.id)}
            >
              {t("ai.accept")}
            </button>
            <button
              type="button"
              className="ds-btn ds-btn-ghost ds-btn-sm"
              onClick={() => onDismiss(suggestion.id)}
            >
              {t("ai.dismiss")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AiSuggestionsSection({
  visible,
  summary,
  improvements,
  similarWarnings,
  onAccept,
  onDismiss,
  onAckSimilar,
  onDismissSimilar,
  translating = false,
}) {
  const { t } = useTranslation();

  if (!visible) return null;

  const pending = sortImprovements(improvements.filter((i) => i.status === "pending"));
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
      <TranslatingIndicator visible={translating} />
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
        <section className="ds-stack" style={{ gap: "var(--space-3)" }}>
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

          {pending.map((suggestion) => (
            <SuggestionCard
              key={suggestion.id}
              suggestion={suggestion}
              onAccept={onAccept}
              onDismiss={onDismiss}
              t={t}
            />
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
              className="ds-card"
              style={{
                background: "rgba(251,146,60,0.07)",
                border: "1px solid rgba(251,146,60,0.25)",
                borderRadius: "var(--radius-xl)",
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
