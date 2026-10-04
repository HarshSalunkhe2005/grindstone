import { describe, expect, it } from "vitest";
import { addDays, daysAway, freezeBudget, streaks } from "@/lib/game";
import { readiness } from "@/lib/readiness";
import type { Problem, TopicStat } from "@/lib/insights";

const NOW = new Date("2026-03-10T12:00:00Z");
const TZ = "UTC";
const day = (n: number) => addDays("2026-03-10", n);

describe("streak freezes", () => {
  it("earns one freeze per 7 active days", () => {
    expect(freezeBudget(6)).toBe(0);
    expect(freezeBudget(7)).toBe(1);
    expect(freezeBudget(15)).toBe(2);
  });

  it("without a budget a single missed day breaks the streak", () => {
    const days = new Set([day(0), day(-1), day(-3), day(-4)]);
    expect(streaks(days, NOW, TZ).current).toBe(2);
  });

  it("a freeze bridges exactly one missed day without counting it", () => {
    const days = new Set([day(0), day(-1), day(-3), day(-4)]);
    const s = streaks(days, NOW, TZ, 1);
    expect(s.current).toBe(4);
    expect(s.frozen).toBe(1);
    expect(s.freezesLeft).toBe(0);
  });

  it("does not bridge a gap of two days", () => {
    const days = new Set([day(0), day(-3), day(-4)]);
    expect(streaks(days, NOW, TZ, 3).current).toBe(1);
  });

  it("keeps a streak alive when yesterday was missed but the day before was not", () => {
    const days = new Set([day(-2), day(-3)]);
    expect(streaks(days, NOW, TZ, 0).current).toBe(0);
    expect(streaks(days, NOW, TZ, 1).current).toBe(2);
  });

  it("best streak never drops below the current one", () => {
    const days = new Set([day(0), day(-1), day(-3)]);
    const s = streaks(days, NOW, TZ, 1);
    expect(s.best).toBeGreaterThanOrEqual(s.current);
  });
});

describe("daysAway", () => {
  it("counts days since the last solve", () => {
    expect(daysAway(new Set([day(0)]), NOW, TZ)).toBe(0);
    expect(daysAway(new Set([day(-5), day(-9)]), NOW, TZ)).toBe(5);
    expect(daysAway(new Set(), NOW, TZ)).toBeNull();
  });
});

const P = (id: number, difficulty: Problem["difficulty"]): Problem => ({ id, topic_id: 1, title: `p${id}`, url: "", difficulty, position: id });
const topic = (title: string, solved: number, mastery: number, state: TopicStat["state"] = "active") => ({ topic: { id: 1, title }, solved, mastery, state }) as unknown as TopicStat;

describe("readiness", () => {
  const problems = [P(1, "easy"), P(2, "medium"), P(3, "hard"), P(4, "easy")];

  it("is zero for a brand new user and never exceeds 100", () => {
    const empty = readiness({ problems, solvedIds: new Set(), stats: [], overdue: 0, solvedCount: 0, mockScores: [], activeLast14: 0 });
    expect(empty.score).toBe(0);
    const full = readiness({ problems, solvedIds: new Set([1, 2, 3, 4]), stats: [topic("Arrays", 4, 1, "done")], overdue: 0, solvedCount: 4, mockScores: [1, 1, 1], activeLast14: 14 });
    expect(full.score).toBe(100);
  });

  it("weights coverage by difficulty", () => {
    const hard = readiness({ problems, solvedIds: new Set([3]), stats: [], overdue: 0, solvedCount: 1, mockScores: [], activeLast14: 0 });
    const easy = readiness({ problems, solvedIds: new Set([1]), stats: [], overdue: 0, solvedCount: 1, mockScores: [], activeLast14: 0 });
    expect(hard.score).toBeGreaterThan(easy.score);
  });

  it("explains what to fix first, most useful first, at most three", () => {
    const r = readiness({ problems, solvedIds: new Set([1]), stats: [topic("Trees", 1, 0.2)], overdue: 3, solvedCount: 1, mockScores: [], activeLast14: 2 });
    expect(r.fixFirst.length).toBeLessThanOrEqual(3);
    expect(r.fixFirst[0]).toMatch(/overdue/);
    expect(r.fixFirst.join(" ")).toMatch(/mock/);
  });

  it("penalises overdue revisions in retention", () => {
    const base = { problems, solvedIds: new Set([1, 2]), stats: [topic("Arrays", 2, 0.8)], solvedCount: 2, mockScores: [], activeLast14: 5 };
    expect(readiness({ ...base, overdue: 2 }).score).toBeLessThan(readiness({ ...base, overdue: 0 }).score);
  });
});

import { PACKS, inPack } from "@/lib/packs";

describe("packs", () => {
  const pack = (id: string) => PACKS.find((p) => p.id === id)!;
  it("filters by topic and difficulty", () => {
    expect(inPack(pack("staples"), "trees", "medium")).toBe(true);
    expect(inPack(pack("staples"), "trees", "hard")).toBe(false);
    expect(inPack(pack("staples"), "stack", "easy")).toBe(false);
  });
  it("all-topic packs only look at difficulty", () => {
    expect(inPack(pack("easy-wins"), "anything", "easy")).toBe(true);
    expect(inPack(pack("easy-wins"), undefined, "medium")).toBe(false);
    expect(inPack(pack("hard-mode"), undefined, "hard")).toBe(true);
  });
  it("a topic-limited pack never matches an unknown topic", () => {
    expect(inPack(pack("fundamentals"), undefined, "easy")).toBe(false);
  });
});
