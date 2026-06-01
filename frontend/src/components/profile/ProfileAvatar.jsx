import { useEffect, useState } from "react";

const ACCENT_COLORS = ["#4f8ef7", "#6366f1", "#a855f7", "#0d9488", "#f97316"];

export function accentColorForInitials(initials) {
  const key = initials || "U";
  const idx =
    key.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % ACCENT_COLORS.length;
  return ACCENT_COLORS[idx];
}

export default function ProfileAvatar({
  name,
  initials,
  avatarUrl,
  size = 72,
  style = {},
}) {
  const color = accentColorForInitials(initials);
  const [imgFailed, setImgFailed] = useState(false);

  useEffect(() => {
    setImgFailed(false);
  }, [avatarUrl]);

  if (avatarUrl && !imgFailed) {
    return (
      <img
        src={avatarUrl}
        alt={name || "Profile"}
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          objectFit: "cover",
          border: "3px solid rgba(255,255,255,0.15)",
          boxShadow: `0 8px 24px ${color}55`,
          flexShrink: 0,
          ...style,
        }}
        onError={() => setImgFailed(true)}
      />
    );
  }

  return (
    <div
      className="ds-avatar"
      style={{
        width: size,
        height: size,
        fontSize: size > 40 ? "var(--text-xl)" : "0.65rem",
        fontWeight: 900,
        background: `linear-gradient(135deg, ${color}, ${color}cc)`,
        boxShadow: `0 8px 24px ${color}55`,
        border: "3px solid rgba(255,255,255,0.15)",
        flexShrink: 0,
        ...style,
      }}
    >
      {initials}
    </div>
  );
}
