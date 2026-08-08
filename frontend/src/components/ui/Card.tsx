export function Card({
  eyebrow,
  title,
  children,
  className = "",
}: {
  eyebrow?: string;
  title?: string;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`card ${className}`}>
      {eyebrow && <span className="text-dim text-[10px] font-display block mb-3">{eyebrow}</span>}
      {title && <h3 className="font-display text-[13px] mb-4">{title}</h3>}
      {children}
    </div>
  );
}

export function StatRow({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="stat-row">
      <span className="text-dim text-lg">{label}</span>
      <span className={`font-display text-[11px] whitespace-nowrap ${accent ? "text-purple" : ""}`}>{value}</span>
    </div>
  );
}
