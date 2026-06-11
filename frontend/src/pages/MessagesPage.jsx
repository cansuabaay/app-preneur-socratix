import { useCallback, useEffect, useRef, useState } from "react";
import AppShell from "../components/layout/AppShell";
import Icon from "../components/ds/Icon";
import ProfileAvatar from "../components/profile/ProfileAvatar";
import { getDepartmentName } from "../data/mockData";
import { normalizeApiUser, useSocratixStore } from "../data/SocratixStoreProvider";
import { useTranslation } from "../i18n/useTranslation";
import { messagesApi } from "../services/api";

function formatTime(iso) {
  const d = new Date(iso);
  const now = new Date();
  const diffH = (now - d) / 3600_000;
  if (diffH < 24) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

export default function MessagesPage() {
  const { currentUser, loadUserDirectory } = useSocratixStore();
  const { t } = useTranslation();

  const [directory, setDirectory] = useState([]);
  const [loadStatus, setLoadStatus] = useState("loading");
  const [loadError, setLoadError] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingConversation, setLoadingConversation] = useState(false);
  const [conversationError, setConversationError] = useState("");
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  const meId = currentUser?.id != null ? String(currentUser.id) : "";

  useEffect(() => {
    loadUserDirectory();
  }, [loadUserDirectory]);

  useEffect(() => {
    let active = true;

    messagesApi
      .listUsers()
      .then((users) => {
        if (!active) return;
        setDirectory(
          (Array.isArray(users) ? users : []).map((user) => normalizeApiUser(user))
        );
        setLoadStatus("ready");
      })
      .catch((err) => {
        if (!active) return;
        setLoadError(err?.message || t("messagesLoadDirectoryError"));
        setLoadStatus("error");
      });

    return () => {
      active = false;
    };
  }, [t]);

  useEffect(() => {
    if (loadStatus !== "ready" || directory.length === 0) {
      setSelectedId(null);
      return;
    }

    const preselect = sessionStorage.getItem("socratix_messages_peer");
    setSelectedId((prev) => {
      if (preselect && directory.some((u) => String(u.id) === preselect)) {
        sessionStorage.removeItem("socratix_messages_peer");
        return preselect;
      }
      if (prev && directory.some((u) => String(u.id) === String(prev))) return prev;
      return directory[0].id;
    });
  }, [loadStatus, directory]);

  const selected = directory.find((u) => String(u.id) === String(selectedId)) ?? null;

  const loadConversation = useCallback(async (peerId) => {
    if (!peerId) {
      setMessages([]);
      return;
    }

    setLoadingConversation(true);
    setConversationError("");

    try {
      const rows = await messagesApi.getConversation(peerId);
      setMessages(Array.isArray(rows) ? rows : []);
    } catch (err) {
      setConversationError(err?.message || t("messagesLoadConversationError"));
      setMessages([]);
    } finally {
      setLoadingConversation(false);
    }
  }, [t]);

  useEffect(() => {
    if (!selected) {
      setMessages([]);
      return;
    }
    loadConversation(selected.id);
  }, [selected?.id, loadConversation]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, selectedId]);

  const handleSend = async () => {
    const text = draft.trim();
    if (!text || !selected || sending) return;

    setSending(true);
    setConversationError("");

    try {
      await messagesApi.send({
        receiverId: selected.id,
        content: text,
      });
      setDraft("");
      await loadConversation(selected.id);
    } catch (err) {
      setConversationError(err?.message || t("messagesSendError"));
    } finally {
      setSending(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };


  return (
    <AppShell>
      <div className="ds-row-between" style={{ alignItems: "flex-start" }}>
        <div>
          <h1 className="ds-heading-2">{t("messages")}</h1>
          <p className="ds-body-sm" style={{ marginTop: "var(--space-1)" }}>
            {t("messagesSubtitle")}
          </p>
        </div>
      </div>

      {loadError && (
        <div className="ds-alert ds-alert-error" style={{ marginTop: "var(--space-4)" }}>
          {loadError}
        </div>
      )}

      <div
        className="messages-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(200px, 260px) 1fr",
          gap: "var(--space-4)",
          alignItems: "stretch",
          minHeight: 520,
          marginTop: "var(--space-5)",
        }}
      >
        <div
          className="ds-stack-sm"
          style={{
            background: "rgba(255,255,255,0.02)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-xl)",
            padding: "var(--space-3)",
            minHeight: 320,
          }}
        >
          {loadStatus === "loading" && (
            <p className="ds-body-sm" style={{ padding: "var(--space-3)", color: "var(--color-text-muted)" }}>
              {t("messagesLoadingTeammates")}
            </p>
          )}

          {loadStatus === "ready" && directory.length === 0 && (
            <div
              style={{
                padding: "var(--space-5) var(--space-4)",
                textAlign: "center",
                color: "var(--color-text-secondary)",
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  margin: "0 auto var(--space-3)",
                  borderRadius: "50%",
                  background: "rgba(79,142,247,0.12)",
                  border: "1px solid rgba(79,142,247,0.25)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Icon name="comment" size={22} />
              </div>
              <p style={{ fontSize: "var(--text-sm)", margin: 0, lineHeight: 1.5 }}>
                {t("messagesEmptyTeammates")}
              </p>
            </div>
          )}

          {directory.map((user) => {
            const isActive = String(user.id) === String(selectedId);
            return (
              <button
                key={user.id}
                type="button"
                onClick={() => setSelectedId(user.id)}
                style={{
                  width: "100%",
                  background: isActive
                    ? "linear-gradient(135deg, rgba(79,142,247,0.18), rgba(99,102,241,0.14))"
                    : "rgba(255,255,255,0.04)",
                  border: `1px solid ${isActive ? "rgba(79,142,247,0.35)" : "rgba(255,255,255,0.07)"}`,
                  borderRadius: "var(--radius-lg)",
                  padding: "var(--space-3) var(--space-4)",
                  cursor: "pointer",
                  textAlign: "left",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "var(--space-3)",
                  transition: "all var(--transition-fast)",
                }}
              >
                <ProfileAvatar
                  name={user.name}
                  initials={user.avatarInitials}
                  avatarUrl={user.avatarUrl}
                  size={36}
                  style={{ fontSize: "0.65rem", boxShadow: "none", flexShrink: 0 }}
                />
                <div style={{ overflow: "hidden", minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: "var(--text-sm)",
                      fontWeight: 700,
                      color: isActive ? "var(--color-brand)" : "var(--color-text-primary)",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {user.name}
                  </div>
                  <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", marginTop: 2 }}>
                    {getDepartmentName(user.departmentId)}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {selected ? (
          <div
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-xl)",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              minHeight: 320,
            }}
          >
            <div
              style={{
                padding: "var(--space-4) var(--space-5)",
                borderBottom: "1px solid var(--color-border)",
                display: "flex",
                alignItems: "center",
                gap: "var(--space-3)",
                background: "rgba(79,142,247,0.06)",
              }}
            >
              <ProfileAvatar
                name={selected.name}
                initials={selected.avatarInitials}
                avatarUrl={selected.avatarUrl}
                size={36}
                style={{ fontSize: "0.65rem", boxShadow: "none", flexShrink: 0 }}
              />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: "var(--text-sm)", color: "var(--color-text-primary)" }}>
                  {selected.name}
                </div>
                <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", marginTop: 2 }}>
                  {getDepartmentName(selected.departmentId)}
                </div>
              </div>
            </div>

            {conversationError && (
              <div className="ds-alert ds-alert-error" style={{ margin: "var(--space-3) var(--space-4) 0" }}>
                {conversationError}
              </div>
            )}

            <div
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "var(--space-5)",
                display: "flex",
                flexDirection: "column",
                gap: "var(--space-3)",
                minHeight: 0,
                maxHeight: 380,
              }}
            >
              {loadingConversation ? (
                <p className="ds-body-sm" style={{ color: "var(--color-text-muted)", margin: 0 }}>
                  {t("messagesLoadingThread")}
                </p>
              ) : messages.length === 0 ? (
                <p className="ds-body-sm" style={{ color: "var(--color-text-muted)", margin: 0 }}>
                  {t("messagesEmptyThread")}
                </p>
              ) : (
                messages.map((m) => {
                  const isMe = String(m.senderId) === meId;
                  return (
                    <div
                      key={m.id}
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: isMe ? "flex-end" : "flex-start",
                      }}
                    >
                      <div className={`msg-bubble ${isMe ? "msg-bubble-me" : "msg-bubble-other"}`}>
                        {m.content}
                      </div>
                      <span
                        style={{
                          fontSize: "0.65rem",
                          color: "var(--color-text-muted)",
                          marginTop: 4,
                          paddingInline: "var(--space-2)",
                        }}
                      >
                        {isMe ? (currentUser?.name?.split(" ")[0] ?? t("messagesYou")) : selected.name.split(" ")[0]}
                        {" · "}
                        {formatTime(m.createdAt)}
                      </span>
                    </div>
                  );
                })
              )}
              <div ref={bottomRef} />
            </div>

            <div
              style={{
                padding: "var(--space-3) var(--space-4)",
                borderTop: "1px solid var(--color-border)",
                display: "flex",
                gap: "var(--space-3)",
                alignItems: "flex-end",
                background: "rgba(0,0,0,0.15)",
              }}
            >
              <textarea
                className="ds-textarea"
                rows={1}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={handleKey}
                placeholder={t("messagesPlaceholder")}
                style={{ minHeight: 0, flex: 1, resize: "none" }}
                disabled={sending || loadingConversation}
              />
              <button
                type="button"
                onClick={handleSend}
                disabled={!draft.trim() || sending || loadingConversation}
                className="ds-btn ds-btn-primary"
                style={{ padding: "0.6rem 0.9rem", flexShrink: 0 }}
                aria-label={t("messagesSendAria")}
              >
                <Icon name="send" size={16} />
              </button>
            </div>
          </div>
        ) : (
          <div
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-xl)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "var(--space-8)",
              minHeight: 320,
            }}
          >
            <p className="ds-body-sm" style={{ textAlign: "center", maxWidth: 360, margin: 0 }}>
              {loadStatus === "loading"
                ? t("messagesLoadingConversations")
                : t("messagesEmptyTeammates")}
            </p>
          </div>
        )}
      </div>

      <style>{`
        @media (max-width: 720px) {
          .messages-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </AppShell>
  );
}
