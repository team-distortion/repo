export default function Button({
  children,
  variant = 'primary',
  size = 'default',
  className = '',
  disabled = false,
  type = 'button',
  onClick,
  ...props
}) {
  let baseClasses = 'inline-flex items-center justify-center font-medium transition-all duration-150 ease-out select-none';
  
  let sizeClasses = size === 'sm' 
    ? 'h-8 px-3 rounded-lg text-[13px] gap-1.5' 
    : 'h-10 px-4 rounded-lg text-[14px] gap-2';

  let variantClasses = '';
  if (disabled) {
    variantClasses = 'bg-[var(--color-surface)] text-[var(--color-text-disabled)] border-none cursor-not-allowed pointer-events-none';
  } else {
    switch (variant) {
      case 'primary':
        variantClasses = 'bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] active:bg-[var(--color-primary-active)] text-white font-semibold border-none shadow-surface-sm';
        break;
      case 'secondary':
        variantClasses = 'bg-[var(--color-surface-2)] hover:bg-[var(--color-surface-3)] active:bg-[var(--color-surface)] text-[var(--color-text)] border border-[var(--color-border-strong)]';
        break;
      case 'danger':
        variantClasses = 'bg-[var(--color-error-tint)] hover:opacity-90 text-[var(--color-error)] border border-[var(--color-error)]/40';
        break;
      case 'ghost':
        variantClasses = 'bg-transparent hover:bg-[var(--color-surface-2)] active:bg-[var(--color-surface-3)] text-[var(--color-text-secondary)] hover:text-[var(--color-text)] border-none';
        break;
      default:
        variantClasses = 'bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white font-semibold';
    }
  }

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`${baseClasses} ${sizeClasses} ${variantClasses} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
