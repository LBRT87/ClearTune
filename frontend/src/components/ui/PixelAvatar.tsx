// Deterministic pixel-art "identicon" — same seed (artist name/wallet) always
// renders the same blocky avatar, no image assets or network requests needed.
const PALETTE = ["#8b5cf6", "#4ade80", "#ffe14d", "#ff5c5c", "#ffffff"];

function hash(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (h << 5) - h + seed.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

export function PixelAvatar({
  seed,
  size = 40,
  className = "",
}: {
  seed: string;
  size?: number;
  className?: string;
}) {
  const h = hash(seed || "?");
  const color = PALETTE[h % PALETTE.length];
  const cols = 5;
  const half = Math.ceil(cols / 2);

  const cells: { x: number; y: number }[] = [];
  for (let y = 0; y < cols; y++) {
    for (let x = 0; x < half; x++) {
      const bit = (h >> ((y * half + x) % 30)) & 1;
      if (bit) {
        cells.push({ x, y });
        cells.push({ x: cols - 1 - x, y });
      }
    }
  }

  return (
    <svg
      viewBox={`0 0 ${cols} ${cols}`}
      width={size}
      height={size}
      shapeRendering="crispEdges"
      className={className}
      aria-hidden="true"
    >
      <rect x={0} y={0} width={cols} height={cols} fill="#000000" />
      {cells.map((c) => (
        <rect key={`${c.x}-${c.y}`} x={c.x} y={c.y} width={1} height={1} fill={color} />
      ))}
    </svg>
  );
}
