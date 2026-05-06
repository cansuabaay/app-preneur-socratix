import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AppShell from "../components/layout/AppShell";
import Icon from "../components/ds/Icon";
import AiSuggestionsSection from "../components/AiSuggestionsSection/AiSuggestionsSection";
import { categories } from "../data/mockData";
import { useSocratixStore } from "../data/SocratixStoreProvider";

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
    t,
  } = useSocratixStore();

  const [formError, setFormError] = useState("");

  const handleAiImprove = () => {
    if (!createDraft.title.trim() || !createDraft.description.trim()) {
      setFormError("Add a title and description before running AI Improve.");
      return;
    }
    setFormError("");
    runAiImprove();
  };

  const handleContinue = () => {
    if (!createDraft.title.trim() || !createDraft.description.trim()) {
      setFormError("Title and description are required.");
      return;
    }
    setFormError("");
    const newId = createIdeaFromDraft();
    navigate(`/devil/${newId}`);
  };

  return (
    <AppShell>
      <div>
        <h1 className="ds-heading-1">{t("createIdea")}</h1>
        <p className="ds-body" style={{ marginTop: "var(--space-2)" }}>
          Capture the problem, the change you propose, and what success looks like in one quarter.
        </p>
      </div>

      {formError && (
        <div className="ds-alert ds-alert-error">{formError}</div>
      )}

      {/* Title */}
      <div>
        <label className="ds-label" htmlFor="idea-title">Title</label>
        <input
          id="idea-title"
          type="text"
          className="ds-input"
          value={createDraft.title}
          onChange={(e) => updateCreateDraft({ title: e.target.value })}
          placeholder="e.g., Self-serve onboarding checklist for complex SKUs"
        />
      </div>

      {/* Description */}
      <div>
        <label className="ds-label" htmlFor="idea-desc">Description</label>
        <textarea
          id="idea-desc"
          className="ds-textarea"
          value={createDraft.description}
          onChange={(e) => updateCreateDraft({ description: e.target.value })}
          placeholder="Who is impacted, what changes, and how will we measure adoption within 90 days?"
          rows={6}
        />
      </div>

      {/* Category */}
      <div>
        <label className="ds-label" htmlFor="idea-cat">Category</label>
        <select
          id="idea-cat"
          className="ds-select"
          value={createDraft.categoryId}
          onChange={(e) => updateCreateDraft({ categoryId: e.target.value })}
        >
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.label}</option>
          ))}
        </select>
      </div>

      {/* Actions */}
      <div className="ds-row" style={{ flexWrap: "wrap" }}>
        <button
          type="button"
          className="ds-btn ds-btn-secondary"
          onClick={handleAiImprove}
        >
          <Icon name="sparkles" size={17} />
          AI Improve
        </button>
        <button
          type="button"
          className="ds-btn ds-btn-primary"
          onClick={handleContinue}
        >
          Continue to Devil&apos;s Advocate
          <Icon name="chevronRight" size={17} />
        </button>
      </div>

      {/* AI suggestions */}
      <AiSuggestionsSection
        visible={createDraft.aiVisible}
        improvements={createDraft.improvements}
        similarWarnings={createDraft.similarWarnings}
        onAccept={acceptSuggestion}
        onDismiss={dismissSuggestion}
        onAckSimilar={acknowledgeSimilar}
        onDismissSimilar={dismissSimilar}
      />
    </AppShell>
  );
}
