export default function Input({
  label,
  error,
  helperText,
  disabled = false,
  className = '',
  id,
  ...props
}) {
  return (
    <div className="w-full space-y-1">
      {label && (
        <label htmlFor={id} className="block text-[13px] font-medium text-[var(--color-text-secondary)]">
          {label}
        </label>
      )}
      <input
        id={id}
        disabled={disabled}
        className={`w-full h-10 px-3 rounded-lg text-[14px] text-[var(--color-text)] placeholder-[var(--color-text-tertiary)] transition-colors duration-150 ${
          disabled
            ? 'bg-[var(--color-surface)] text-[var(--color-text-disabled)] border border-[var(--color-border)] cursor-not-allowed'
            : error
            ? 'bg-[var(--color-surface-2)] border border-[var(--color-error)] focus:outline-none focus:ring-[3px] focus:ring-[var(--color-error)]/25'
            : 'bg-[var(--color-surface-2)] border border-[var(--color-border-strong)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-[3px] focus:ring-[var(--color-primary)]/25'
        } ${className}`}
        {...props}
      />
      {error ? (
        <p className="text-[12px] font-normal text-[var(--color-error)] mt-1">{error}</p>
      ) : helperText ? (
        <p className="text-[12px] font-normal text-[var(--color-text-tertiary)] mt-1">{helperText}</p>
      ) : null}
    </div>
  );
}
