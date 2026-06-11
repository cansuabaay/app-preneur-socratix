import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import AppShell from "../components/layout/AppShell";
import IdeaFeedCard from "../components/ideas/IdeaFeedCard";
import Icon from "../components/ds/Icon";
import { useIdeaTranslations } from "../hooks/useIdeaTranslations";
import { useSocratixStore } from "../data/SocratixStoreProvider";
import { useTranslation } from "../i18n/useTranslation";

const FILTERS = [
  { key: "all", labelKey: "filterAll" },
  { key: "department", labelKey: "filterDepartment" },
  { key: "popular", labelKey: "filterPopular" },
  { key: "new", labelKey: "filterNew" },
];

export default function DashboardPage() {
  const [filter, setFilter] = useState("all");
  const { getFilteredIdeas, currentUser } = useSocratixStore();
  const { t, language } = useTranslation();

  const ideas = useMemo(() => getFilteredIdeas(filter), [getFilteredIdeas, filter]);
  const { getDisplay } = useIdeaTranslations(ideas, language);

  return (
    <AppShell>
      {/* Page header */}
      <div className="ds-row-between">
        <div>
          <h1 className="ds-heading-1">{t("dashboardTitle")}</h1>
          <p className="ds-body" style={{ marginTop: "var(--space-2)" }}>
            {currentUser
              ? t("dashboardWelcome", { name: currentUser.name.split(" ")[0] })
              : t("dashboardWelcomeGuest")}
          </p>
        </div>
        <Link to="/create" className="ds-btn ds-btn-primary" style={{ flexShrink: 0 }}>
          <Icon name="plus" size={16} />
          {t("createIdea")}
        </Link>
      </div>

      {/* Filter tabs */}
      <div className="ds-tabs" role="tablist" aria-label={t("filterTabAria")}>
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            role="tab"
            aria-selected={filter === f.key}
            className={`ds-tab ${filter === f.key ? "ds-tab-active" : ""}`}
            onClick={() => setFilter(f.key)}
          >
            {t(f.labelKey)}
          </button>
        ))}
      </div>

      {/* Feed */}
      {ideas.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "var(--space-12) var(--space-4)",
            color: "var(--color-text-muted)",
          }}
        >
          <div style={{ fontSize: "2.5rem", marginBottom: "var(--space-4)" }}>💡</div>
          <p className="ds-body-sm">
            {t("emptyFeed")}{" "}
            <Link to="/create" style={{ color: "var(--color-brand)" }}>
              {t("emptyFeedCreate")}
            </Link>
          </p>
        </div>
      ) : (
        <div className="ds-stack" style={{ marginTop: "var(--space-2)" }}>
          {ideas.map((idea) => (
            <IdeaFeedCard
              key={idea.id}
              idea={idea}
              display={getDisplay(idea)}
            />
          ))}
        </div>
      )}

      {/* FAB */}
      <Link to="/create" className="ds-btn-floating" aria-label={t("fabCreateAria")}>
        <Icon name="plus" size={18} />
        {t("createIdea")}
      </Link>
    </AppShell>
  );
}
