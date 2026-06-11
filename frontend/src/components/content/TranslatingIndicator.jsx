import { useTranslation } from "../../i18n/useTranslation";

export default function TranslatingIndicator({ visible, style }) {
  const { t } = useTranslation();
  if (!visible) return null;

  return (
    <p
      className="ds-body-sm"
      style={{
        margin: 0,
        color: "var(--color-text-muted)",
        fontSize: "var(--text-xs)",
        ...style,
      }}
    >
      {t("content.translating")}
    </p>
  );
}
