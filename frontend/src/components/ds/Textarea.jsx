export default function Textarea({
  id,
  label,
  error,
  className = "",
  inputClassName = "",
  ...rest
}) {
  return (
    <div className={className}>
      {label && (
        <label className="ds-label" htmlFor={id}>
          {label}
        </label>
      )}
      <textarea
        id={id}
        className={`ds-textarea ${error ? "ds-input-error" : ""} ${inputClassName}`.trim()}
        {...rest}
      />
      {error && <p className="ds-field-error">{error}</p>}
    </div>
  );
}
