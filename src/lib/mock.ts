import type { Difficulty, Problem, TopicStat } from "@/lib/insights";

export const MOCK_LENGTHS = [
  { minutes: 45, label: "Quick round", shape: ["easy", "medium"] as Difficulty[] },
  { minutes: 60, label: "Standard round", shape: ["medium", "medium"] as Difficulty[] },
  { minutes: 90, label: "Full round", shape: ["easy", "medium", "hard"] as Difficulty[] },
] as const;

export const POINTS: Record<Difficulty, number> = { easy: 1, medium: 2, hard: 3 };

/**
 * Chooses the problems for a mock: a difficulty mix per round length, only
 * unsolved ones, preferring topics the user has already started so the round is
 * fair rather than a cold ambush. Falls back to any unsolved problem.
 */
export function pickMock(
  minutes: number,
  problems: Problem[],
  solvedIds: Set<number>,
  stats: TopicStat[],
  rng: () => number = Math.random,
): number[] {
  const shape = MOCK_LENGTHS.find((l) => l.minutes === minutes)?.shape ?? MOCK_LENGTHS[1].shape;
  const started = new Set(stats.filter((s) => s.solved > 0 && s.state !== "locked").map((s) => s.topic.id));
  const chosen: Problem[] = [];

  for (const want of shape) {
    const open = problems.filter((p) => !solvedIds.has(p.id) && !chosen.some((c) => c.id === p.id));
    const exact = open.filter((p) => p.difficulty === want);
    const pools = [exact.filter((p) => started.has(p.topic_id)), exact, open.filter((p) => started.has(p.topic_id)), open];
    const pool = pools.find((p) => p.length > 0);
    if (!pool) break;
    chosen.push(pool[Math.floor(rng() * pool.length)]);
  }
  return chosen.map((p) => p.id);
}

/** Share of the available points earned, 0..1. */
export function mockScore(problems: { id: number; difficulty: Difficulty }[], solvedIds: number[]): number {
  const total = problems.reduce((n, p) => n + POINTS[p.difficulty], 0);
  if (total === 0) return 0;
  const solved = new Set(solvedIds);
  return problems.filter((p) => solved.has(p.id)).reduce((n, p) => n + POINTS[p.difficulty], 0) / total;
}

export function msLeft(startedAt: string | Date, minutes: number, now = Date.now()): number {
  return new Date(startedAt).getTime() + minutes * 60_000 - now;
}
