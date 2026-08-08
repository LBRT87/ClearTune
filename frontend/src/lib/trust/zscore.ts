export function mean(values: number[]): number {
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

export function stddev(values: number[], avg = mean(values)): number {
  const variance = values.reduce((sum, v) => sum + (v - avg) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

/** Z-score of `value` against a population, clamped to +/-4 to keep outliers from dominating. */
export function zScore(value: number, population: number[]): number {
  const avg = mean(population);
  const sd = stddev(population, avg);
  if (sd === 0) return 0;
  return Math.max(-4, Math.min(4, (value - avg) / sd));
}

/** Maps a z-score to 0..1, where 0 (average) -> 0.5, positive z -> closer to 1. */
export function zScoreToUnit(z: number): number {
  return 1 / (1 + Math.exp(-z));
}
