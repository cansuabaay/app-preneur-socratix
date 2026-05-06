export default function Card({
  children,
  className = "",
  interactive = false,
  onClick,
  role,
  tabIndex,
}) {
  const cls = [
    "ds-card",
    interactive ? "ds-card-interactive" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <div
      className={cls}
      onClick={onClick}
      role={role}
      tabIndex={tabIndex}
    >
      {children}
    </div>
  );
}
