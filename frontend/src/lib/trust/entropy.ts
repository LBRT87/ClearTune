/** Shannon entropy (bits) of a distribution of play counts per artist. 0 = one artist only. */
export function shannonEntropy(playCountsByArtist: number[]): number {
  const total = playCountsByArtist.reduce((sum, n) => sum + n, 0);
  if (total === 0) return 0;

  let entropy = 0;
  for (const count of playCountsByArtist) {
    if (count === 0) continue;
    const p = count / total;
    entropy -= p * Math.log2(p);
  }
  return entropy;
}

/** Entropy normalized to 0..1 by dividing by log2(distinct artist count). */
export function normalizedEntropy(playCountsByArtist: number[]): number {
  const distinct = playCountsByArtist.filter((n) => n > 0).length;
  if (distinct <= 1) return 0;
  return shannonEntropy(playCountsByArtist) / Math.log2(distinct);
}
