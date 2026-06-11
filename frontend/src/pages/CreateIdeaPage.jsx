import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppShell from "../components/layout/AppShell";
import Icon from "../components/ds/Icon";
import AiSuggestionsSection from "../components/AiSuggestionsSection/AiSuggestionsSection";
import TranslatingIndicator from "../components/content/TranslatingIndicator";
import { categories } from "../data/mockData";
import { useSocratixStore } from "../data/SocratixStoreProvider";
import { useTextTranslations } from "../hooks/useTextTranslations";
import { useTranslation } from "../i18n/useTranslation";

export default function CreateIdeaPage() {
  const navigate = useNavigate();
  const {
    createDraft,
    updateCreateDraft,
    runAiImprove,
    acceptSuggestion,
    dismissSuggestion,
    acknowledgeSimilar,
    dismissSimilar,
    createIdeaFromDraft,
  } = useSocratixStore();
  const { t, language } = useTranslation();

  const draftAiTexts = useMemo(() => {
    if (!createDraft.aiVisible) return [];
    const items = [];
    if (createDraft.aiSummary) {
      items.push({ id: "summary", text: createDraft.aiSummary });
    }
    for (const suggestion of createDraft.improvements || []) {
      if (suggestion?.title) {
        items.push({ id: `${suggestion.id}-title`, text: suggestion.title });
      }
      if (suggestion?.text) {
        items.push({ id: suggestion.id, text: suggestion.text });
      }
    }
    for (const warning of createDraft.similarWarnings || []) {
      if (warning?.title) {
        items.push({ id: `${warning.id}-title`, text: warning.title });
      }
      if (warning?.detail) {
        items.push({ id: `${warning.id}-detail`, text: warning.detail });
      }
    }
    return items;
  }, [createDraft]);

  const { getText: getDraftAiText, loading: translatingDraftAi } = useTextTranslations(
    draftAiTexts,
    language,
    "create-draft-ai"
  );

  const displaySummary = createDraft.aiSummary
    ? getDraftAiText("summary", createDraft.aiSummary)
    : "";
  const displayImprovements = (createDraft.improvements || []).map((suggestion) => ({
    ...suggestion,
    title: suggestion.title
      ? getDraftAiText(`${suggestion.id}-title`, suggestion.title)
      : "",
    text: getDraftAiText(suggestion.id, suggestion.text),
  }));
  const displaySimilarWarnings = (createDraft.similarWarnings || []).map((warning) => ({
    ...warning,
    title: getDraftAiText(`${warning.id}-title`, warning.title),
    detail: getDraftAiText(`${warning.id}-detail`, warning.detail),
  }));

  const [formError, setFormError] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [continuing, setContinuing] = useState(false);

  const handleAiImprove = async () => {
    if (!createDraft.title.trim() || !createDraft.description.trim()) {
      setFormError(t("create.errTitleDescAi"));
      return;
    }
    setFormError("");
    setAiLoading(true);
    try {
      await runAiImprove();
    } catch (err) {
      setFormError(err?.message || t("create.errAiImprove"));
    } finally {
      setAiLoading(false);
    }
  };

  const handleContinue = async () => {
    if (!createDraft.title.trim() || !createDraft.description.trim()) {
      setFormError(t("create.errTitleDesc"));
      return;
    }
    setFormError("");
    setContinuing(true);
    try {
      const newId = await createIdeaFromDraft();
      if (!newId) {
        setFormError(t("create.errSignIn"));
        return;
      }
      navigate(`/devil/${String(newId)}`);
    } catch (err) {
      setFormError(err?.message || t("create.errSave"));
    } finally {
      setContinuing(false);
    }
  };

  return (
    <AppShell>
      <div>
        <h1 className="ds-heading-1">{t("createIdea")}</h1>
        <p className="ds-body" style={{ marginTop: "var(--space-2)" }}>
          {t("create.subtitle")}
        </p>
      </div>

      {formError && (
        <div className="ds-alert ds-alert-error">{formError}</div>
      )}

      {/* Title */}
      <div>
        <label className="ds-label" htmlFor="idea-title">{t("create.titleLabel")}</label>
        <input
          id="idea-title"
          type="text"
          className="ds-input"
          value={createDraft.title}
          onChange={(e) => updateCreateDraft({ title: e.target.value })}
          placeholder={t("create.titlePlaceholder")}
        />
      </div>

      {/* Description */}
      <div>
        <label className="ds-label" htmlFor="idea-desc">{t("create.descriptionLabel")}</label>
        <textarea
          id="idea-desc"
          className="ds-textarea"
          value={createDraft.description}
          onChange={(e) => updateCreateDraft({ description: e.target.value })}
          placeholder={t("create.descriptionPlaceholder")}
          rows={6}
        />
      </div>

      {/* Category */}
      <div>
        <label className="ds-label" htmlFor="idea-cat">{t("create.categoryLabel")}</label>
        <select
          id="idea-cat"
          className="ds-select"
          value={createDraft.categoryId}
          onChange={(e) => updateCreateDraft({ categoryId: e.target.value })}
        >
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {t(`categories.${c.id}`) !== `categories.${c.id}` ? t(`categories.${c.id}`) : c.label}
            </option>
          ))}
        </select>
      </div>

      {/* Actions */}
      <div className="ds-row" style={{ flexWrap: "wrap" }}>
        <button
          type="button"
          className="ds-btn ds-btn-secondary"
          onClick={handleAiImprove}
          disabled={aiLoading}
        >
          <Icon name="sparkles" size={17} />
          {aiLoading ? t("create.aiImproving") : t("create.aiImprove")}
        </button>
        <button
          type="button"
          className="ds-btn ds-btn-primary"
          onClick={handleContinue}
          disabled={continuing}
        >
          {continuing ? t("create.saving") : t("create.continueDevil")}
          {!continuing && <Icon name="chevronRight" size={17} />}
        </button>
      </div>

      {/* AI suggestions */}
      <AiSuggestionsSection
        visible={createDraft.aiVisible}
        summary={displaySummary}
        improvements={displayImprovements}
        similarWarnings={displaySimilarWarnings}
        onAccept={acceptSuggestion}
        onDismiss={dismissSuggestion}
        onAckSimilar={acknowledgeSimilar}
        onDismissSimilar={dismissSimilar}
        translating={translatingDraftAi}
      />
    </AppShell>
  );
}
