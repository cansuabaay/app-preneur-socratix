import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppShell from "../components/layout/AppShell";
import Icon from "../components/ds/Icon";
import { getDepartmentName } from "../data/mockData";
import { useSocratixStore } from "../data/SocratixStoreProvider";
import { usersApi } from "../services/api";

const USERS_GENERIC_ERR = "__users_load__";

export default function UsersPage() {
  const navigate = useNavigate();
  const { currentUser, t, startDmWithUser } = useSocratixStore();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    usersApi
      .list()
      .then((list) => {
        if (!cancelled) setRows(Array.isArray(list) ? list : []);
      })
      .catch((e) => {
        if (!cancelled) setError(e?.message || USERS_GENERIC_ERR);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const others = useMemo(
    () =>
      rows.filter(
        (u) => String(u.id) !== String(currentUser?.id ?? "")
      ),
    [rows, currentUser?.id]
  );

  const openDm = (user) => {
    startDmWithUser(user);
    navigate("/messages");
  };

  return (
    <AppShell>
      <div className="ds-row-between" style={{ alignItems: "flex-start" }}>
        <div>
          <h1 className="ds-heading-2">{t("usersNav")}</h1>
          <p className="ds-body-sm" style={{ marginTop: "var(--space-1)" }}>
            {t("usersSubtitle")}
          </p>
        </div>
      </div>

      {error && (
        <div className="ds-alert ds-alert-error" style={{ marginBottom: "var(--space-4)" }}>
          {error === USERS_GENERIC_ERR ? t("usersLoadError") : error}
        </div>
      )}

      {loading ? (
        <p className="ds-body-sm" style={{ color: "var(--color-text-muted)" }}>{t("loadingEllipsis")}</p>
      ) : (
        <div
          className="ds-stack"
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "var(--radius-xl)",
            padding: "var(--space-4)",
          }}
        >
          {others.length === 0 ? (
            <p className="ds-body-sm" style={{ color: "var(--color-text-muted)", margin: 0 }}>
              {t("usersEmpty")}
            </p>
          ) : (
            others.map((u) => (
              <div
                key={String(u.id)}
                className="ds-row-between"
                style={{
                  flexWrap: "wrap",
                  gap: "var(--space-3)",
                  padding: "var(--space-3) 0",
                  borderBottom: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <div className="ds-row" style={{ gap: "var(--space-3)", minWidth: 0 }}>
                  <div
                    className="ds-avatar"
                    style={{
                      width: 40,
                      height: 40,
                      fontSize: "0.7rem",
                      flexShrink: 0,
                      background: "linear-gradient(135deg, #0d9488, #0d948899)",
                    }}
                  >
                    {(u.name || "?")
                      .split(" ")
                      .map((p) => p[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase()}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 700, color: "var(--color-text-primary)" }}>
                      {u.name}
                    </div>
                    <div
                      style={{
                        fontSize: "var(--text-xs)",
                        color: "var(--color-text-muted)",
                        marginTop: 2,
                        wordBreak: "break-all",
                      }}
                    >
                      {u.email}
                    </div>
                    <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)", marginTop: 4 }}>
                      {getDepartmentName(u.departmentId)} · {u.role}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  className="ds-btn ds-btn-secondary ds-btn-sm"
                  onClick={() => openDm(u)}
                  style={{ flexShrink: 0 }}
                >
                  <Icon name="comment" size={14} />
                  {t("messageUser")}
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </AppShell>
  );
}
