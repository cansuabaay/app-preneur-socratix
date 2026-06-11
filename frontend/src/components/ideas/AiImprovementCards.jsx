import Icon from "../ds/Icon";
import {
  improvementDescriptionStyle,
  improvementTitleStyle,
  resolveImprovementDisplay,
} from "../../utils/aiImprovements";

function SuggestionCard({ item }) {
  const { title: displayTitle, description } = resolveImprovementDisplay({
    title: item.title,
    text: item.text,
  });

  return (
    <div
      className="ds-card"
      style={{
        background: "var(--glass-bg)",
        border: "1px solid rgba(79,142,247,0.22)",
        borderRadius: "var(--radius-xl)",
        padding: "var(--space-4) var(--space-5)",
        backdropFilter: "var(--glass-blur)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
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
        <div style={{ minWidth: 0, flex: 1 }}>
          {displayTitle && (
            <h3 style={improvementTitleStyle}>
              {displayTitle}
            </h3>
          )}
          {description && (
            <p className="ds-body-sm" style={improvementDescriptionStyle}>
              {description}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AiImprovementCards({ title, items }) {
  if (!items?.length) return null;

  return (
    <section className="ds-stack" style={{ gap: "var(--space-4)" }}>
      {title && (
        <h2
          className="ds-heading-3"
          style={{
            margin: 0,
            display: "flex",
            alignItems: "center",
            gap: "var(--space-2)",
          }}
        >
          {title}
        </h2>
      )}
      <div className="ds-stack" style={{ gap: "var(--space-3)" }}>
        {items.map((item) => (
          <SuggestionCard key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
}
