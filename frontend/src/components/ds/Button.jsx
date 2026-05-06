const variantClass = {
  primary: "ds-btn ds-btn-primary",
  secondary: "ds-btn ds-btn-secondary",
  ghost: "ds-btn ds-btn-ghost",
  danger: "ds-btn ds-btn-danger",
  floating: "ds-btn ds-btn-floating",
};

export default function Button({
  variant = "primary",
  type = "button",
  className = "",
  small,
  block,
  disabled,
  children,
  ...rest
}) {
  const base = variantClass[variant] || variantClass.primary;
  const extra = [small ? "ds-btn-sm" : "", block ? "ds-btn-block" : "", className]
    .filter(Boolean)
    .join(" ");
  return (
    <button
      type={type}
      className={`${base} ${extra}`.trim()}
      disabled={disabled}
      {...rest}
    >
      {children}
    </button>
  );
}
