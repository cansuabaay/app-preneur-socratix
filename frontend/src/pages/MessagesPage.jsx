import { useEffect, useRef, useState } from "react";
import AppShell from "../components/layout/AppShell";
import Icon from "../components/ds/Icon";
import { useSocratixStore } from "../data/SocratixStoreProvider";

function formatTime(iso) {
  const d = new Date(iso);
  const now = new Date();
  const diffH = (now - d) / 3600_000;
  if (diffH < 24) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

export default function MessagesPage() {
  const { messageThreads, currentUser, sendMessage, t } = useSocratixStore();
  const [activeId, setActiveId] = useState(messageThreads[0]?.id);
  const [draft, setDraft] = useState("");
  const bottomRef = useRef(null);

  const active = messageThreads.find((t) => t.id === activeId) || messageThreads[0];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [active?.messages?.length]);

  const handleSend = () => {
    const text = draft.trim();
    if (!text) return;
    sendMessage(active.id, text);
    setDraft("");
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
            Discuss ideas and get coaching from your Socratix team.
          </p>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "220px 1fr",
          gap: "var(--space-4)",
          alignItems: "stretch",
          minHeight: 520,
        }}
      >
        {/* Thread list */}
        <div className="ds-stack-sm">
          {messageThreads.map((t) => {
            const isActive = t.id === active?.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveId(t.id)}
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
                  alignItems: "center",
                  gap: "var(--space-3)",
                  transition: "all var(--transition-fast)",
                }}
              >
                <div
                  className="ds-avatar"
                  style={{
                    width: 36,
                    height: 36,
                    fontSize: "0.65rem",
                    background: t.avatarColor
                      ? `linear-gradient(135deg, ${t.avatarColor}, ${t.avatarColor}99)`
                      : undefined,
                    flexShrink: 0,
                  }}
                >
                  {t.avatarInitials}
                </div>
                <div style={{ overflow: "hidden" }}>
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
                    {t.name}
                  </div>
                  <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", marginTop: 2 }}>
                    {t.role}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Chat pane */}
        {active && (
          <div
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-xl)",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            {/* Chat header */}
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
              <div
                className="ds-avatar"
                style={{
                  width: 36, height: 36, fontSize: "0.65rem",
                  background: active.avatarColor
                    ? `linear-gradient(135deg, ${active.avatarColor}, ${active.avatarColor}99)`
                    : undefined,
                  flexShrink: 0,
                }}
              >
                {active.avatarInitials}
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: "var(--text-sm)", color: "var(--color-text-primary)" }}>
                  {active.name}
                </div>
                <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
                  {active.role}
                </div>
              </div>
            </div>

            {/* Messages */}
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
              {active.messages.map((m) => {
                const isMe = m.from === "me";
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
                      {m.body}
                    </div>
                    <span
                      style={{
                        fontSize: "0.65rem",
                        color: "var(--color-text-muted)",
                        marginTop: 4,
                        paddingInline: "var(--space-2)",
                      }}
                    >
                      {isMe ? (currentUser?.name?.split(" ")[0] ?? "You") : active.name.split(" ")[0]}
                      {" · "}
                      {formatTime(m.at)}
                    </span>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
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
                placeholder="Write a message… (Enter to send)"
                style={{ minHeight: 0, flex: 1, resize: "none" }}
              />
              <button
                type="button"
                onClick={handleSend}
                disabled={!draft.trim()}
                className="ds-btn ds-btn-primary"
                style={{ padding: "0.6rem 0.9rem", flexShrink: 0 }}
                aria-label="Send"
              >
                <Icon name="send" size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Mobile notice */}
      <style>{`
        @media (max-width: 580px) {
          .messages-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </AppShell>
  );
}
