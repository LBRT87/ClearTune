/**
 * Ikon pixel art 16x16, digambar tangan sebagai peta karakter.
 *
 * Sengaja tidak di-generate: image generator menghasilkan pixel art yang
 * grid-nya tidak konsisten dan tepinya ter-anti-alias, dan itu sangat kelihatan
 * bersebelahan dengan Press Start 2P yang grid-nya presisi. Peta karakter juga
 * mengikat warnanya ke token CSS, jadi tidak mungkin meleset dari palet.
 */

const PALETTE: Record<string, string> = {
  "#": "var(--ink)",
  "-": "var(--dimmer)",
  x: "var(--red)",
  p: "var(--purple)",
  g: "var(--green)",
};

export const ICONS = {
  /* kalender digembok — menunggu, terkunci */
  lock: [
    "................",
    "....#.....#.....",
    "....#.....#.....",
    ".##############.",
    ".##############.",
    ".#............#.",
    ".#...xxxxxx...#.",
    ".#..xx....xx..#.",
    ".#..xx....xx..#.",
    ".#.xxxxxxxxxx.#.",
    ".#.xxxxxxxxxx.#.",
    ".#.xxxx..xxxx.#.",
    ".#.xxxxxxxxxx.#.",
    ".#.xxxxxxxxxx.#.",
    ".##############.",
    "................",
  ],
  /* satu koin pecah jadi empat aliran tak sama besar — split sheet */
  split: [
    "................",
    ".....pppppp.....",
    "....pppppppp....",
    "....pppppppp....",
    "....pppppppp....",
    ".....pppppp.....",
    ".......pp.......",
    ".gg..gg..gg..gg.",
    ".gg..gg..gg..gg.",
    ".gg..gg..gg..gg.",
    ".gg..gg..gg.....",
    ".gg..gg..gg.....",
    ".gg..gg.........",
    ".gg..gg.........",
    ".gg.............",
    "................",
  ],
} as const;

export type IconName = keyof typeof ICONS;

export function PixelIcon({
  name,
  size = 56,
}: {
  name: IconName;
  size?: number;
}) {
  const map = ICONS[name];
  const rects: React.ReactElement[] = [];

  map.forEach((row, y) => {
    [...row].forEach((ch, x) => {
      const fill = PALETTE[ch];
      if (!fill) return;
      rects.push(
        <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill={fill} />
      );
    });
  });

  return (
    <svg
      viewBox="0 0 16 16"
      width={size}
      height={size}
      shapeRendering="crispEdges"
      aria-hidden="true"
    >
      {rects}
    </svg>
  );
}
