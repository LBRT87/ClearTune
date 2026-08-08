/** Coefficient of variation (stddev / mean) of the gaps between consecutive play timestamps.
 * Low CV = suspiciously regular (bot-like) cadence; farming bots tend to fire at near-fixed
 * intervals. `timestampsMs` must already be sorted ascending. */
export function coefficientOfVariation(timestampsMs: number[]): number {
  if (timestampsMs.length < 3) return NaN; // not enough gaps to judge

  const gaps: number[] = [];
  for (let i = 1; i < timestampsMs.length; i++) {
    gaps.push(timestampsMs[i] - timestampsMs[i - 1]);
  }

  const mean = gaps.reduce((sum, g) => sum + g, 0) / gaps.length;
  if (mean === 0) return 0;

  const variance = gaps.reduce((sum, g) => sum + (g - mean) ** 2, 0) / gaps.length;
  const stddev = Math.sqrt(variance);

  return stddev / mean;
}
