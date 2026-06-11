import TranslatingIndicator from "../content/TranslatingIndicator";
import Icon from "../ds/Icon";
import { useTranslation } from "../../i18n/useTranslation";
import { impactLevelLabelKey } from "../../utils/strategicAnalysis";

function AnalysisCard({ title, icon, accent, children, translating = false }) {
  return (
    <div
      className="ds-card"
      style={{
        background: "var(--glass-bg)",
        border: `1px solid ${accent}`,
        borderRadius: "var(--radius-xl)",
        padding: "var(--space-4) var(--space-5)",
        backdropFilter: "var(--glass-blur)",
      }}
    >
      <div className="ds-row" style={{ gap: "var(--space-2)", marginBottom: "var(--space-3)" }}>
        <span style={{ color: "var(--color-brand)", display: "inline-flex" }} aria-hidden>
          <Icon name={icon} size={16} />
        </span>
        <h3
          style={{
            margin: 0,
            fontSize: "var(--text-xs)",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.07em",
            color: "var(--color-text-muted)",
          }}
        >
          {title}
        </h3>
      </div>
      {children}
      <TranslatingIndicator visible={translating} style={{ marginTop: "var(--space-2)" }} />
    </div>
  );
}

function BulletList({ items }) {
  if (!items?.length) {
    return (
      <p className="ds-body-sm" style={{ margin: 0, color: "var(--color-text-muted)" }}>
        —
      </p>
    );
  }

  return (
    <ul
      style={{
        margin: 0,
        paddingLeft: "var(--space-5)",
        color: "var(--color-text-secondary)",
      }}
    >
      {items.map((item, index) => (
        <li
          key={index}
          style={{
            marginBottom: index < items.length - 1 ? "var(--space-2)" : 0,
            fontSize: "var(--text-sm)",
            lineHeight: "var(--leading-relaxed)",
          }}
        >
          {item}
        </li>
      ))}
    </ul>
  );
}

export default function AiStrategicAnalysisPanel({
  analysis,
  translatingSummary = false,
  translatingDetails = false,
}) {
  const { t } = useTranslation();
  if (!analysis) return null;

  const impactLabel = t(impactLevelLabelKey(analysis.impactLevel));

  return (
    <section
      className="ds-stack"
      style={{
        marginTop: "var(--space-5)",
        gap: "var(--space-4)",
      }}
    >
      <div className="ds-row-between" style={{ alignItems: "flex-start", flexWrap: "wrap", gap: "var(--space-3)" }}>
        <div>
          <h2 className="ds-heading-3" style={{ margin: 0 }}>
            {t("analysis.title")}
          </h2>
          <p
            className="ds-body-sm"
            style={{
              margin: "var(--space-2) 0 0",
              color: "var(--color-text-muted)",
              lineHeight: "var(--leading-relaxed)",
            }}
          >
            {t("analysis.subtitle")}
          </p>
        </div>
        <span className="ds-badge ds-badge-purple">
          {t("analysis.impactBadge", { level: impactLabel })}
        </span>
      </div>

      {analysis.businessValueSummary && (
        <div>
          <p
            className="ds-body-sm"
            style={{
              margin: 0,
              color: "var(--color-text-secondary)",
              lineHeight: "var(--leading-relaxed)",
            }}
          >
            {analysis.businessValueSummary}
          </p>
          <TranslatingIndicator visible={translatingSummary} style={{ marginTop: "var(--space-2)" }} />
        </div>
      )}

      {analysis.validationSummary && (
        <AnalysisCard
          title={t("analysis.validationTitle")}
          icon="comment"
          accent="rgba(99,102,241,0.28)"
          translating={translatingSummary}
        >
          <p
            className="ds-body-sm"
            style={{
              margin: 0,
              color: "var(--color-text-secondary)",
              lineHeight: "var(--leading-relaxed)",
              whiteSpace: "pre-wrap",
            }}
          >
            {analysis.validationSummary}
          </p>
        </AnalysisCard>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: "var(--space-3)",
        }}
      >
        <AnalysisCard
          title={t("analysis.impactTitle")}
          icon="sparkles"
          accent="rgba(79,142,247,0.28)"
          translating={translatingDetails}
        >
          <p
            style={{
              margin: 0,
              fontSize: "var(--text-lg)",
              fontWeight: 800,
              color: "var(--color-text-primary)",
            }}
          >
            {impactLabel}
          </p>
        </AnalysisCard>

        <AnalysisCard
          title={t("analysis.strengthsTitle")}
          icon="comment"
          accent="rgba(52,211,153,0.25)"
          translating={translatingDetails}
        >
          <BulletList items={analysis.strengths} />
        </AnalysisCard>

        <AnalysisCard
          title={t("analysis.risksTitle")}
          icon="settings"
          accent="rgba(251,146,60,0.28)"
          translating={translatingDetails}
        >
          <BulletList items={analysis.risks} />
        </AnalysisCard>

        <AnalysisCard
          title={t("analysis.nextStepTitle")}
          icon="chevronRight"
          accent="rgba(168,85,247,0.28)"
          translating={translatingDetails}
        >
          <p
            className="ds-body-sm"
            style={{
              margin: 0,
              color: "var(--color-text-secondary)",
              lineHeight: "var(--leading-relaxed)",
              whiteSpace: "pre-wrap",
            }}
          >
            {analysis.recommendedNextStep || "—"}
          </p>
        </AnalysisCard>
      </div>
    </section>
  );
}
