export default function Card({ children, className = '', ...props }) {
  return (
    <div
      className={`bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
