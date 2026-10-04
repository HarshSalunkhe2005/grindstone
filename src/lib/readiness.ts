import type { Difficulty, Problem, TopicStat } from "@/lib/insights";
import { POINTS } from "@/lib/mock";

export interface ReadinessInput {
  problems: Problem[];
  solvedIds: Set<number>;
  stats: TopicStat[];
  /** Solved problems whose revision is overdue right now. */
  overdue: number;
  solvedCount: number;
  /** Scores 0..1 of finished mocks, newest first. */
  mockScores: number[];
  /** Active days among the last 14. */
  activeLast14: number;
}

export interface Readiness {
  score: number;
  parts: { key: string; label: string; value: number; weight: number }[];
  fixFirst: string[];
}

const clamp = (n: number) => Math.max(0, Math.min(1, n));

/**
 * One 0-100 number for "how ready am I", built from four things that actually move a placement:
 * how much of the roadmap you have covered (weighted by difficulty), whether it still sticks,
 * how you do under a clock, and whether you show up.
 */
export function readiness(i: ReadinessInput): Readiness {
  const weight = (d: Difficulty) => POINTS[d];
  const total = i.problems.reduce((n, p) => n + weight(p.difficulty), 0);
  const done = i.problems.filter((p) => i.solvedIds.has(p.id)).reduce((n, p) => n + weight(p.difficulty), 0);
  const coverage = total ? done / total : 0;

  const started = i.stats.filter((s) => s.solved > 0);
  const avgMastery = started.length ? started.reduce((n, s) => n + s.mastery, 0) / started.length : 0;
  const overdueShare = i.solvedCount ? i.overdue / i.solvedCount : 0;
  const retention = clamp(avgMastery * (1 - overdueShare));

  const recent = i.mockScores.slice(0, 3);
  const underClock = recent.length ? recent.reduce((n, s) => n + s, 0) / recent.length : 0;

  const consistency = clamp(i.activeLast14 / 14);

  const parts = [
    { key: "coverage", label: "Roadmap coverage", value: coverage, weight: 0.4 },
    { key: "retention", label: "Retention", value: retention, weight: 0.25 },
    { key: "clock", label: "Under the clock", value: underClock, weight: 0.2 },
    { key: "consistency", label: "Consistency", value: consistency, weight: 0.15 },
  ];
  const score = Math.round(parts.reduce((n, p) => n + p.value * p.weight, 0) * 100);

  const fixFirst: string[] = [];
  if (i.overdue > 0) fixFirst.push(`${i.overdue} revision${i.overdue === 1 ? " is" : "s are"} overdue. Clear them first.`);
  if (i.mockScores.length === 0) fixFirst.push("You have not taken a mock round yet. Try a 45 minute one.");
  else if (underClock < 0.5) fixFirst.push("Your mock scores are low. Practise a timed round on topics you know.");
  const weakest = started.filter((s) => s.state !== "done").sort((a, b) => a.mastery - b.mastery)[0];
  if (weakest && weakest.mastery < 0.6) fixFirst.push(`${weakest.topic.title} is your weakest topic at ${Math.round(weakest.mastery * 100)}%.`);
  if (i.activeLast14 < 7) fixFirst.push(`You solved on ${i.activeLast14} of the last 14 days. A little every day beats a lot sometimes.`);
  if (coverage < 0.2 && fixFirst.length < 3) fixFirst.push("Keep widening the roadmap: coverage is the biggest part of the score.");
  return { score, parts, fixFirst: fixFirst.slice(0, 3) };
}
