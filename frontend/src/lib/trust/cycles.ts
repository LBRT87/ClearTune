/** Directed edge in the funding graph: `from` sent mUSD (subscribe/top-up) to `to`. */
export type FundingEdge = { from: string; to: string };

/**
 * BFS, 2 hops, over the funding graph looking for money that loops back to its origin —
 * e.g. wallet A funds wallet B, B plays a song A is a payee of. That's the classic
 * "fund a swarm of alt wallets to farm your own royalties" pattern.
 *
 * Returns the set of wallets that sit on a detected 2-hop cycle back to `startWallet`.
 */
export function findFundingCycles(edges: FundingEdge[], startWallet: string): Set<string> {
  const adjacency = new Map<string, string[]>();
  for (const { from, to } of edges) {
    if (!adjacency.has(from)) adjacency.set(from, []);
    adjacency.get(from)!.push(to);
  }

  const cycleMembers = new Set<string>();
  const hop1 = adjacency.get(startWallet) ?? [];

  for (const mid of hop1) {
    const hop2 = adjacency.get(mid) ?? [];
    if (hop2.includes(startWallet)) {
      cycleMembers.add(mid);
      cycleMembers.add(startWallet);
    }
  }

  return cycleMembers;
}

/** Fan-out ratio: how many distinct wallets did `wallet` fund? A high count feeding
 * wallets that all play the same narrow set of songs is the attack panel's headline stat. */
export function fanOutCount(edges: FundingEdge[], wallet: string): number {
  return new Set(edges.filter((e) => e.from === wallet).map((e) => e.to)).size;
}
