type Variant = "ok" | "err" | "warn" | "info";

const variantClass: Record<Variant, string> = {
  ok: "status-line status-ok",
  err: "status-line status-err",
  warn: "status-line status-warn",
  info: "status-line status-info",
};

export function StatusLine({
  variant,
  label,
  detail,
}: {
  variant: Variant;
  label: string;
  detail?: string;
}) {
  return (
    <div className={variantClass[variant]}>
      <div className="status-dot" />
      <div>
        <span className="text-[10px] font-display">{label}</span>
        {detail && <small className="block text-dim mt-1 text-base">{detail}</small>}
      </div>
    </div>
  );
}
