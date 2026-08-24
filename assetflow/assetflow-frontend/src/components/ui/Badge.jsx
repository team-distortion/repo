export default function Badge({ children, status, className = '' }) {
  const normalized = (status || (typeof children === 'string' ? children : '')).toLowerCase();

  let colorClasses = 'bg-[var(--color-surface-3)] text-[var(--color-text-secondary)]'; // default Inactive

  if (['active', 'available', 'verified', 'approved', 'resolved', 'success', 'completed'].includes(normalized)) {
    colorClasses = 'bg-[var(--color-primary-tint)] text-[var(--color-primary)]';
  } else if (['maintenance', 'in repair', 'warning', 'in_progress', 'scheduled'].includes(normalized)) {
    colorClasses = 'bg-[var(--color-warning-tint)] text-[var(--color-warning)]';
  } else if (['pending', 'reserved', 'allocated', 'assigned', 'requested', 'upcoming', 'info'].includes(normalized)) {
    colorClasses = 'bg-[var(--color-primary-tint)] text-[var(--color-primary-hover)]';
  } else if (['error', 'missing', 'damaged', 'rejected', 'cancelled', 'overdue', 'danger'].includes(normalized)) {
    colorClasses = 'bg-[var(--color-error-tint)] text-[var(--color-error)]';
  }

  return (
    <span
      className={`inline-flex items-center justify-center h-6 px-2.5 rounded-full text-[12px] font-medium leading-none whitespace-nowrap transition-colors ${colorClasses} ${className}`}
    >
      {children}
    </span>
  );
}
