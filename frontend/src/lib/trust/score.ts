import { normalizedEntropy } from "./entropy";
import { coefficientOfVariation } from "./variance";
import { zScoreToUnit, zScore } from "./zscore";

export type WalletFeatures = {
  wallet: string;
  playCountsByArtist: number[];
  playTimestampsMs: number[];
  skipRatio: number; // 0..1, share of plays not completed
  walletAgeDays: number;
  isOverCap: boolean; // true if most of this wallet's recent plays were treasury-funded
  fundedByTreasuryRatio: number; // 0..1
};

export type TrustScoreResult = {
  wallet: string;
  trustScore: number; // 0..1, higher = more trustworthy
  components: {
    entropy: number;
    cvGap: number;
    skipPenalty: number;
    ageBonus: number;
  };
};

/**
 * Combines hand-written heuristics (no ML model) into a single 0..1 trust score.
 * Free plays past the cap are the juiciest farming target (no cost to the attacker),
 * so `isOverCap` tightens the score rather than loosening it — see project-spec.md 5.3.
 */
export function computeTrustScore(features: WalletFeatures, cohortAgesDays: number[] = []): TrustScoreResult {
  const entropy = normalizedEntropy(features.playCountsByArtist); // 0..1, higher = more diverse listening
  const cv = coefficientOfVariation(features.playTimestampsMs); // higher = more human-like gaps
  const cvUnit = Number.isNaN(cv) ? 0.5 : Math.min(1, cv / 2); // cap contribution, cv=2 -> 1.0

  const skipPenalty = 1 - Math.min(1, features.skipRatio * 1.5); // heavy skipping is bot-like

  const ageZ = cohortAgesDays.length > 2 ? zScore(features.walletAgeDays, cohortAgesDays) : 0;
  const ageBonus = zScoreToUnit(ageZ);

  let score = entropy * 0.35 + cvUnit * 0.3 + skipPenalty * 0.2 + ageBonus * 0.15;

  if (features.isOverCap) {
    // Stricter bar once plays are treasury-funded: scale down and pull toward the
    // low end so a borderline wallet reads as suspicious rather than passing.
    score = score * 0.7;
  }

  score = Math.max(0, Math.min(1, score));

  return {
    wallet: features.wallet,
    trustScore: score,
    components: { entropy, cvGap: cvUnit, skipPenalty, ageBonus },
  };
}

/** Weighted chart score: trust discounts raw plays instead of hard-blocking them. */
export function weightedChartScore(trustScore: number, playCount: number): number {
  return trustScore * Math.log(1 + playCount);
}
