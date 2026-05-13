import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import AppShell from "../components/layout/AppShell";
import IdeaFeedCard from "../components/ideas/IdeaFeedCard";
import Icon from "../components/ds/Icon";
import { useSocratixStore } from "../data/SocratixStoreProvider";

export default function DashboardPage() {
  const [filter, setFilter] = useState("all");
  const { getFilteredIdeas, currentUser, t } = useSocratixStore();

  const filters = useMemo(
    () => [
      { key: "all", labelKey: "filterAll" },
      { key: "department", labelKey: "filterDepartment" },
      { key: "popular", labelKey: "filterPopular" },
      { key: "new", labelKey: "filterNew" },
    ],
    []
  );

  const ideas = useMemo(() => getFilteredIdeas(filter), [getFilteredIdeas, filter]);

  const welcomeLine = currentUser
    ? t("dashboardWelcome").replace(
        "{name}",
        currentUser.name.split(" ")[0] || currentUser.name
      )
    : t("dashboardWelcomeGuest");

  return (
    <AppShell>
      <div className="ds-row-between">
        <div>
          <h1 className="ds-heading-1">{t("dashboardTitle")}</h1>
          <p className="ds-body" style={{ marginTop: "var(--space-2)" }}>
            {welcomeLine}
          </p>
        </div>
        <Link to="/create" className="ds-btn ds-btn-primary" style={{ flexShrink: 0 }}>
          <Icon name="plus" size={16} />
          {t("createIdea")}
        </Link>
      </div>

      <div className="ds-tabs" role="tablist" aria-label={t("dashboardTitle")}>
        {filters.map((f) => (
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
            <IdeaFeedCard key={idea.id} idea={idea} />
          ))}
        </div>
      )}

      <Link to="/create" className="ds-btn-floating" aria-label={t("createIdea")}>
        <Icon name="plus" size={18} />
        {t("createIdea")}
      </Link>
    </AppShell>
  );
}
