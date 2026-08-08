export function PixelLoader({ label = "MEMUAT" }: { label?: string }) {
  return (
    <div className="flex items-center gap-4 py-10">
      <div className="flex gap-2" aria-hidden>
        <span className="pixel-loader-dot" style={{ animationDelay: "0ms" }} />
        <span className="pixel-loader-dot" style={{ animationDelay: "150ms" }} />
        <span className="pixel-loader-dot" style={{ animationDelay: "300ms" }} />
      </div>
      <span className="font-display text-[10px] text-dim">{label}...</span>
    </div>
  );
}

export function PixelPageLoader({ label }: { label?: string }) {
  return (
    <main className="max-w-[1040px] mx-auto px-5 py-24 flex justify-center">
      <PixelLoader label={label} />
    </main>
  );
}
