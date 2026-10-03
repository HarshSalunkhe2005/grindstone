import { describe, expect, it } from "vitest";
import { addDays, dayKey, daysUntil, heatmapWeeks, levelFor, streaks } from "@/lib/game";
import { badges, nextProblems, recommend, topicStats, type Edge, type Problem, type Progress, type Topic } from "@/lib/insights";
import { LADDER_DAYS, isDue, scheduleReview } from "@/lib/review";

const NOW = new Date("2026-10-04T10:00:00Z"); // 15:30 on 4 Oct in IST

describe("dayKey and timezones", () => {
  it("uses the user's timezone for the calendar day", () => {
    const lateUtc = new Date("2026-10-03T20:00:00Z"); // already 4 Oct 01:30 in IST
    expect(dayKey(lateUtc, "Asia/Kolkata")).toBe("2026-10-04");
    expect(dayKey(lateUtc, "UTC")).toBe("2026-10-03");
  });
  it("does date arithmetic across month ends", () => {
    expect(addDays("2026-10-31", 1)).toBe("2026-11-01");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
  });
  it("counts days until a target date", () => {
    expect(daysUntil("2026-10-14", NOW)).toBe(10);
    expect(daysUntil("2026-10-04", NOW)).toBe(0);
  });
});

describe("streaks", () => {
  it("counts back from today", () => {
    expect(streaks(new Set(["2026-10-04", "2026-10-03", "2026-10-02"]), NOW)).toMatchObject({ current: 3, todayDone: true });
  });
  it("stays alive until the end of the day after your last solve", () => {
    expect(streaks(new Set(["2026-10-03", "2026-10-02"]), NOW)).toMatchObject({ current: 2, todayDone: false });
  });
  it("breaks after a missed day and remembers the best run", () => {
    const r = streaks(new Set(["2026-09-20", "2026-09-21", "2026-09-22", "2026-09-23", "2026-10-03"]), NOW);
    expect(r.current).toBe(1);
    expect(r.best).toBe(4);
    expect(streaks(new Set(["2026-09-20"]), NOW).current).toBe(0);
  });
});

describe("heatmapWeeks", () => {
  const { cols, months } = heatmapWeeks(new Map([["2026-10-04", 5], ["2026-10-02", 1]]), 26, NOW);
  it("builds Monday-first columns ending with the current week", () => {
    expect(cols).toHaveLength(26);
    expect(cols[0]).toHaveLength(7);
    expect(new Date(cols[25][0].day + "T00:00:00Z").getUTCDay()).toBe(1); // Monday
    expect(cols[25][6].day).toBe("2026-10-04"); // 4 Oct 2026 is a Sunday
    expect(cols[25][6]).toMatchObject({ today: true, count: 5, level: 4, future: false });
  });
  it("marks days after today as future", () => {
    const wed = heatmapWeeks(new Map(), 2, new Date("2026-10-07T10:00:00Z")).cols[1];
    expect(wed.map((c) => c.future)).toEqual([false, false, false, true, true, true, true]);
  });
  it("labels the first column of each month", () => {
    expect(months[0].col).toBe(0);
    // A month is labelled on the first week whose Monday falls in it, so Oct (starting Thu 1 Oct) is not labelled yet.
    expect(months.map((m) => m.label)).toEqual(["Apr", "May", "Jun", "Jul", "Aug", "Sep"]);
  });
});

describe("levels", () => {
  it("climbs on a square-root curve and reports progress", () => {
    expect(levelFor(0)).toMatchObject({ level: 1, title: "Raw Steel", toNext: 40 });
    expect(levelFor(40).level).toBe(2);
    expect(levelFor(940)).toMatchObject({ level: 5, title: "Razor" });
    expect(levelFor(100).progress).toBeCloseTo((100 - 40) / (160 - 40));
  });
});

describe("spaced revision", () => {
  it("climbs the ladder on good reviews", () => {
    const a = scheduleReview(0, "good", NOW);
    expect(a).toMatchObject({ stage: 1, mastered: false, confidence: 2 });
    expect(a.nextReviewAt!.getTime() - NOW.getTime()).toBe(LADDER_DAYS[1] * 86_400_000);
  });
  it("skips a rung on easy and restarts on again", () => {
    expect(scheduleReview(0, "easy", NOW).stage).toBe(2);
    const again = scheduleReview(3, "again", NOW);
    expect(again).toMatchObject({ stage: 0, confidence: 1 });
    expect(again.nextReviewAt!.getTime() - NOW.getTime()).toBe(86_400_000);
  });
  it("masters a problem at the end of the ladder", () => {
    expect(scheduleReview(3, "good", NOW)).toMatchObject({ stage: 4, mastered: true, nextReviewAt: null });
    expect(scheduleReview(2, "easy", NOW).mastered).toBe(true);
  });
  it("knows what is due", () => {
    expect(isDue("2026-10-04T09:00:00Z", NOW)).toBe(true);
    expect(isDue("2026-10-05T09:00:00Z", NOW)).toBe(false);
    expect(isDue(null, NOW)).toBe(false);
  });
});

const topics: Topic[] = [
  { id: 1, slug: "a", title: "Arrays", blurb: null, position: 1 },
  { id: 2, slug: "b", title: "Two Pointers", blurb: null, position: 2 },
  { id: 3, slug: "c", title: "Trees", blurb: null, position: 3 },
];
const edges: Edge[] = [
  { from_topic: 1, to_topic: 2 },
  { from_topic: 2, to_topic: 3 },
];
const problems: Problem[] = [1, 2, 3, 4, 5, 6].map((n) => ({
  id: n,
  topic_id: n <= 2 ? 1 : n <= 4 ? 2 : 3,
  title: `P${n}`,
  url: "https://x.test",
  difficulty: n === 6 ? "hard" : "easy",
  position: n,
}));
const solved = (id: number, over: Partial<Progress> = {}): Progress => ({
  problem_id: id,
  solved_at: "2026-10-01T00:00:00Z",
  source: "manual",
  review_stage: 0,
  next_review_at: "2026-10-09T00:00:00Z",
  last_reviewed_at: null,
  review_count: 0,
  confidence: 2,
  notes: null,
  ...over,
});

describe("topicStats and recommendations", () => {
  it("locks topics until their prerequisites are half done", () => {
    const s = topicStats(topics, problems, [], edges, NOW);
    expect(s.map((x) => x.state)).toEqual(["open", "locked", "locked"]);
  });

  it("opens the next topic at 50% and marks finished ones done", () => {
    const s = topicStats(topics, problems, [solved(1), solved(2), solved(3)], edges, NOW);
    expect(s.map((x) => x.state)).toEqual(["done", "active", "open"]); // Trees opens at exactly 50% of Two Pointers
    expect(s[0].mastery).toBeCloseTo(0.8); // two solved at confidence 2
  });

  it("recommends the frontier when nothing is shaky", () => {
    const r = recommend(topicStats(topics, problems, [solved(1), solved(2)], edges, NOW));
    expect(r).toMatchObject({ kind: "frontier" });
    expect(r.focus!.topic.slug).toBe("b");
  });

  it("recommends shoring up a topic with several shaky problems", () => {
    const wide: Problem[] = [1, 2, 3, 4, 5, 6, 7, 8].map((n) => ({
      id: n,
      topic_id: n <= 4 ? 1 : n <= 6 ? 2 : 3,
      title: `W${n}`,
      url: "https://x.test",
      difficulty: "easy",
      position: n,
    }));
    const shaky = [1, 2, 3].map((id) => solved(id, { confidence: 1 }));
    const r = recommend(topicStats(topics, wide, shaky, edges, NOW));
    expect(r.focus!.topic.slug).toBe("a");
    expect(r.kind).toBe("weak");
    expect(r.reason).toMatch(/shaky/);
  });

  it("counts due reviews per topic", () => {
    const s = topicStats(topics, problems, [solved(1, { next_review_at: "2026-10-03T00:00:00Z" }), solved(2)], edges, NOW);
    expect(s[0].due).toBe(1);
  });

  it("serves unsolved problems starting with the focus topic", () => {
    const stats = topicStats(topics, problems, [solved(1)], edges, NOW);
    const picks = nextProblems(stats, problems, new Set([1]), 2, 3);
    expect(picks.map((p) => p.id)).toEqual([3, 4, 2]);
    expect(nextProblems(stats, problems, new Set(), null, 0)).toEqual([]);
  });
});

describe("badges", () => {
  it("unlocks by threshold and reports progress toward the rest", () => {
    const b = badges({ solved: 12, hardSolved: 0, bestStreak: 5, reviews: 4, topicsDone: 0, notes: 0 });
    const by = Object.fromEntries(b.map((x) => [x.id, x]));
    expect(by.ten.unlocked).toBe(true);
    expect(by.streak3.unlocked).toBe(true);
    expect(by.fifty).toMatchObject({ unlocked: false, progress: 12 / 50 });
    expect(by.reviewer.progress).toBeCloseTo(0.4);
  });
});
