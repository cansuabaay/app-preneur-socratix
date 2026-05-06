export default function TextInput({
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
      <input
        id={id}
        className={`ds-input ${error ? "ds-input-error" : ""} ${inputClassName}`.trim()}
        {...rest}
      />
      {error && <p className="ds-field-error">{error}</p>}
    </div>
  );
}
