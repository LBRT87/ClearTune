// Procedural pixel-art "cover art" — same seed (song/playlist id + name)
// always renders the same mosaic. Used as a fallback when there's no
// uploaded `cover_url` yet, so a card never looks broken/empty.
const PALETTE = ["#8b5cf6", "#241033", "#4ade80", "#ffe14d", "#ff5c5c", "#ffffff"];

function hash(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (h << 5) - h + seed.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

export function PixelCover({
  seed,
  src,
  className = "",
}: {
  seed: string;
  src?: string | null;
  className?: string;
}) {
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt="" className={`w-full h-full object-cover ${className}`} />;
  }

  const h = hash(seed || "?");
  const bg = PALETTE[h % PALETTE.length];
  const cols = 8;

  const cells: { x: number; y: number; color: string }[] = [];
  for (let y = 0; y < cols; y++) {
    for (let x = 0; x < cols; x++) {
      const n = (h * (x + 1) * 31 + y * 17 + x * 7) % 100;
      if (n < 38) {
        const color = PALETTE[(h + x * 3 + y * 5) % PALETTE.length];
        if (color !== bg) cells.push({ x, y, color });
      }
    }
  }

  return (
    <svg
      viewBox={`0 0 ${cols} ${cols}`}
      width="100%"
      height="100%"
      shapeRendering="crispEdges"
      className={className}
      aria-hidden="true"
    >
      <rect x={0} y={0} width={cols} height={cols} fill={bg} />
      {cells.map((c, i) => (
        <rect key={i} x={c.x} y={c.y} width={1} height={1} fill={c.color} />
      ))}
    </svg>
  );
}
