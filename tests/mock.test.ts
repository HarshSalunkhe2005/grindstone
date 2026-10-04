import { describe, expect, it } from "vitest";
import { mockScore, msLeft, pickMock } from "@/lib/mock";
import type { Problem, TopicStat } from "@/lib/insights";

const P = (id: number, topic_id: number, difficulty: Problem["difficulty"]): Problem => ({ id, topic_id, title: `p${id}`, url: "", difficulty, position: id });
const problems = [P(1, 1, "easy"), P(2, 1, "medium"), P(3, 2, "medium"), P(4, 2, "hard"), P(5, 3, "easy"), P(6, 3, "medium")];
const stat = (id: number, solved: number, state: TopicStat["state"]) => ({ topic: { id }, solved, state }) as unknown as TopicStat;
const stats = [stat(1, 2, "active"), stat(2, 0, "open"), stat(3, 0, "locked")];
const first = () => 0;

describe("pickMock", () => {
  it("matches the difficulty shape of the round", () => {
    const ids = pickMock(90, problems, new Set(), stats, first);
    expect(ids.map((id) => problems.find((p) => p.id === id)!.difficulty)).toEqual(["easy", "medium", "hard"]);
  });

  it("never picks solved problems or repeats one", () => {
    const ids = pickMock(60, problems, new Set([2]), stats, first);
    expect(ids).not.toContain(2);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("prefers topics already started", () => {
    expect(pickMock(45, problems, new Set(), stats, first)).toEqual([1, 2]);
  });

  it("falls back to anything unsolved, and returns fewer if the pool runs dry", () => {
    expect(pickMock(45, problems.slice(0, 1), new Set(), stats, first)).toEqual([1]);
    expect(pickMock(45, problems, new Set(problems.map((p) => p.id)), stats, first)).toEqual([]);
  });
});

describe("mockScore", () => {
  const set = [{ id: 1, difficulty: "easy" as const }, { id: 2, difficulty: "medium" as const }, { id: 3, difficulty: "hard" as const }];
  it("weights by difficulty", () => {
    expect(mockScore(set, [3])).toBeCloseTo(0.5);
    expect(mockScore(set, [1, 2, 3])).toBe(1);
    expect(mockScore(set, [])).toBe(0);
    expect(mockScore([], [1])).toBe(0);
  });
  it("ignores ids that are not in the round", () => {
    expect(mockScore(set, [99])).toBe(0);
  });
});

describe("msLeft", () => {
  it("counts down from the start time", () => {
    const start = new Date("2026-01-01T10:00:00Z");
    expect(msLeft(start, 45, start.getTime() + 15 * 60_000)).toBe(30 * 60_000);
    expect(msLeft(start, 45, start.getTime() + 50 * 60_000)).toBeLessThan(0);
  });
});
