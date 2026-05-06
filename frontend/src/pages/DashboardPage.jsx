import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import AppShell from "../components/layout/AppShell";
import IdeaFeedCard from "../components/ideas/IdeaFeedCard";
import Icon from "../components/ds/Icon";
import { useSocratixStore } from "../data/SocratixStoreProvider";

const FILTERS = [
  { key: "all",        label: "All ideas" },
  { key: "department", label: "My department" },
  { key: "popular",    label: "Popular" },
  { key: "new",        label: "Newest" },
];

export default function DashboardPage() {
  const [filter, setFilter] = useState("all");
  const { getFilteredIdeas, currentUser, t } = useSocratixStore();

  const ideas = useMemo(() => getFilteredIdeas(filter), [getFilteredIdeas, filter]);

  return (
    <AppShell>
      {/* Page header */}
      <div className="ds-row-between">
        <div>
          <h1 className="ds-heading-1">Innovation feed</h1>
          <p className="ds-body" style={{ marginTop: "var(--space-2)" }}>
            {currentUser
              ? `Welcome back, ${currentUser.name.split(" ")[0]}. Here's what's moving.`
              : "Ideas shaping the future of the organisation."}
          </p>
        </div>
        <Link to="/create" className="ds-btn ds-btn-primary" style={{ flexShrink: 0 }}>
          <Icon name="plus" size={16} />
          {t("createIdea")}
        </Link>
      </div>

      {/* Filter tabs */}
      <div className="ds-tabs" role="tablist" aria-label="Idea filters">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            role="tab"
            aria-selected={filter === f.key}
            className={`ds-tab ${filter === f.key ? "ds-tab-active" : ""}`}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
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
            No ideas in this view yet.{" "}
            <Link to="/create" style={{ color: "var(--color-brand)" }}>
              Be the first to submit one.
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

      {/* FAB */}
      <Link to="/create" className="ds-btn-floating" aria-label="Create idea">
        <Icon name="plus" size={18} />
        {t("createIdea")}
      </Link>
    </AppShell>
  );
}
