export default function Select({
  id,
  label,
  error,
  options,
  className = "",
  ...rest
}) {
  return (
    <div className={className}>
      {label && (
        <label className="ds-label" htmlFor={id}>
          {label}
        </label>
      )}
      <select
        id={id}
        className={`ds-select ${error ? "ds-input-error" : ""}`.trim()}
        {...rest}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="ds-field-error">{error}</p>}
    </div>
  );
}
