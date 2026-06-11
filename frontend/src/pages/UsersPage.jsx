import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppShell from "../components/layout/AppShell";
import Icon from "../components/ds/Icon";
import UserDirectoryCard from "../components/users/UserDirectoryCard";
import { departments, getDepartmentName } from "../data/mockData";
import { normalizeApiUser, useSocratixStore } from "../data/SocratixStoreProvider";
import { innovationRoleLabel } from "../i18n/innovationRoles";
import { useTranslation } from "../i18n/useTranslation";
import { usersApi } from "../services/api";

const FILTER_TABS = [
  { key: "all", labelKey: "users.filterAll" },
  { key: "myDepartment", labelKey: "users.filterMyDepartment" },
  { key: "otherDepartments", labelKey: "users.filterOtherDepartments" },
];

const SORT_OPTIONS = [
  { key: "name", labelKey: "users.sortName" },
  { key: "department", labelKey: "users.sortDepartment" },
  { key: "role", labelKey: "users.sortRole" },
];

function localizedDepartmentName(departmentId, t) {
  if (!departmentId) return t("users.unknownDepartment");
  const key = `departments.${departmentId}`;
  const label = t(key);
  return label !== key ? label : getDepartmentName(departmentId);
}

export default function UsersPage() {
  const navigate = useNavigate();
  const { currentUser, openMessagesWithUser, loadUserDirectory } = useSocratixStore();
  const { t } = useTranslation();

  const [users, setUsers] = useState([]);
  const [loadStatus, setLoadStatus] = useState("loading");
  const [loadError, setLoadError] = useState("");
  const [filter, setFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [search, setSearch] = useState("");

  useEffect(() => {
    let active = true;
    setLoadStatus("loading");
    setLoadError("");

    usersApi
      .list()
      .then((data) => {
        if (!active) return;
        setUsers((Array.isArray(data) ? data : []).map((u) => normalizeApiUser(u)));
        setLoadStatus("ready");
      })
      .catch((err) => {
        if (!active) return;
        setLoadError(err?.message || t("users.loadError"));
        setLoadStatus("error");
      });

    loadUserDirectory();

    return () => {
      active = false;
    };
  }, [loadUserDirectory, t]);

  const meId = currentUser?.id != null ? String(currentUser.id) : "";
  const myDepartmentId = currentUser?.departmentId || "";

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();

    let list = [...users];

    if (filter === "myDepartment" && myDepartmentId) {
      list = list.filter((u) => u.departmentId === myDepartmentId);
    } else if (filter === "otherDepartments" && myDepartmentId) {
      list = list.filter(
        (u) => u.departmentId && u.departmentId !== myDepartmentId
      );
    }

    if (departmentFilter) {
      list = list.filter((u) => u.departmentId === departmentFilter);
    }

    if (query) {
      list = list.filter((u) => {
        const dept = localizedDepartmentName(u.departmentId, t).toLowerCase();
        const haystack = [
          u.name,
          u.email,
          dept,
          getDepartmentName(u.departmentId),
          u.jobTitle,
          innovationRoleLabel(u.innovationRole, t),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return haystack.includes(query);
      });
    }

    list.sort((a, b) => {
      if (sortBy === "department") {
        const da = localizedDepartmentName(a.departmentId, t);
        const db = localizedDepartmentName(b.departmentId, t);
        const cmp = da.localeCompare(db, undefined, { sensitivity: "base" });
        if (cmp !== 0) return cmp;
      }
      if (sortBy === "role") {
        const cmp = innovationRoleLabel(a.innovationRole, t).localeCompare(
          innovationRoleLabel(b.innovationRole, t),
          undefined,
          { sensitivity: "base" }
        );
        if (cmp !== 0) return cmp;
      }
      return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
    });

    return list;
  }, [
    users,
    filter,
    departmentFilter,
    sortBy,
    search,
    myDepartmentId,
    t,
  ]);

  const handleMessage = (user) => {
    openMessagesWithUser(user);
    navigate("/messages");
  };

  return (
    <AppShell>
      <div className="ds-row-between" style={{ flexWrap: "wrap", gap: "var(--space-4)" }}>
        <div>
          <h1 className="ds-heading-1">{t("users.title")}</h1>
          <p className="ds-body" style={{ marginTop: "var(--space-2)" }}>
            {t("users.subtitle")}
          </p>
        </div>
        <div
          className="ds-body-sm"
          style={{ color: "var(--color-text-muted)", fontWeight: 600 }}
        >
          {t("users.count", { count: filteredUsers.length })}
        </div>
      </div>

      <div className="ds-stack" style={{ gap: "var(--space-4)" }}>
        <input
          type="search"
          className="ds-input"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("users.searchPlaceholder")}
          aria-label={t("users.searchPlaceholder")}
        />

        <div
          className="ds-row"
          style={{ flexWrap: "wrap", gap: "var(--space-3)", alignItems: "center" }}
        >
          <div className="ds-tabs" role="tablist" aria-label={t("users.filterAria")}>
            {FILTER_TABS.map((f) => (
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

          <select
            className="ds-select"
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            aria-label={t("users.departmentFilterAria")}
            style={{ maxWidth: 260, minWidth: 180 }}
          >
            <option value="">{t("users.allDepartments")}</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {localizedDepartmentName(d.id, t)}
              </option>
            ))}
          </select>

          <select
            className="ds-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            aria-label={t("users.sortAria")}
            style={{ maxWidth: 200, minWidth: 160 }}
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.key} value={opt.key}>
                {t(opt.labelKey)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loadError && <div className="ds-alert ds-alert-error">{loadError}</div>}

      {loadStatus === "loading" ? (
        <p className="ds-body-sm" style={{ color: "var(--color-text-muted)" }}>
          {t("users.loading")}
        </p>
      ) : filteredUsers.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "var(--space-12) var(--space-4)",
            color: "var(--color-text-muted)",
          }}
        >
          <div style={{ fontSize: "2.5rem", marginBottom: "var(--space-4)" }}>
            <Icon name="users" size={40} />
          </div>
          <p className="ds-body-sm" style={{ margin: 0 }}>
            {t("users.empty")}
          </p>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: "var(--space-4)",
            marginTop: "var(--space-2)",
          }}
        >
          {filteredUsers.map((user) => (
            <UserDirectoryCard
              key={user.id}
              user={user}
              departmentLabel={localizedDepartmentName(user.departmentId, t)}
              innovationRoleLabel={innovationRoleLabel(user.innovationRole, t)}
              isSelf={String(user.id) === meId}
              onMessage={handleMessage}
            />
          ))}
        </div>
      )}
    </AppShell>
  );
}
