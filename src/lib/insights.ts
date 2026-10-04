import { isDue } from "@/lib/review";

export type Difficulty = "easy" | "medium" | "hard";

export interface Topic {
  id: number;
  slug: string;
  title: string;
  blurb: string | null;
  position: number;
}
export interface Problem {
  id: number;
  topic_id: number;
  title: string;
  url: string;
  difficulty: Difficulty;
  position: number;
}
export interface Progress {
  problem_id: number;
  solved_at: string;
  source: string;
  review_stage: number;
  next_review_at: string | null;
  last_reviewed_at: string | null;
  review_count: number;
  confidence: number | null;
  notes: string | null;
  recall_note: string | null;
  solve_minutes: number | null;
}
export interface Edge {
  from_topic: number;
  to_topic: number;
}

export type TopicState = "done" | "active" | "open" | "locked";

export interface TopicStat {
  topic: Topic;
  total: number;
  solved: number;
  shaky: number;
  due: number;
  /** 0..1, solved problems weighted by how confidently they are remembered. */
  mastery: number;
  state: TopicState;
  prereqs: number[];
}

const CONF_WEIGHT: Record<number, number> = { 1: 0.5, 2: 0.8, 3: 1 };

/** A topic opens up once every prerequisite is at least half solved. Locked is advice, not a wall. */
const UNLOCK_AT = 0.5;

export function topicStats(topics: Topic[], problems: Problem[], progress: Progress[], edges: Edge[], now = new Date()): TopicStat[] {
  const byProblem = new Map(progress.map((p) => [p.problem_id, p]));
  const stats = new Map<number, TopicStat>();

  for (const topic of topics) {
    const list = problems.filter((p) => p.topic_id === topic.id);
    let solved = 0;
    let shaky = 0;
    let due = 0;
    let weight = 0;
    for (const p of list) {
      const pr = byProblem.get(p.id);
      if (!pr) continue;
      solved += 1;
      weight += CONF_WEIGHT[pr.confidence ?? 0] ?? 0.7;
      if ((pr.confidence ?? 2) === 1) shaky += 1;
      if (isDue(pr.next_review_at, now)) due += 1;
    }
    stats.set(topic.id, {
      topic,
      total: list.length,
      solved,
      shaky,
      due,
      mastery: list.length ? weight / list.length : 0,
      state: "locked",
      prereqs: edges.filter((e) => e.to_topic === topic.id).map((e) => e.from_topic),
    });
  }

  for (const s of stats.values()) {
    const unlocked = s.prereqs.every((id) => {
      const pre = stats.get(id);
      return !pre || (pre.total > 0 && pre.solved / pre.total >= UNLOCK_AT);
    });
    s.state = s.solved === s.total && s.total > 0 ? "done" : s.solved > 0 ? "active" : unlocked ? "open" : "locked";
  }
  return topics.map((t) => stats.get(t.id)!);
}

export interface Recommendation {
  focus: TopicStat | null;
  kind: "weak" | "frontier" | "complete";
  reason: string;
}

/** Picks the topic to work on: shore up a shaky one first, otherwise advance the frontier. */
export function recommend(stats: TopicStat[]): Recommendation {
  const weak = stats
    .filter((s) => s.solved > 0 && (s.shaky >= 3 || (s.solved >= 4 && s.mastery < 0.6)))
    .sort((a, b) => b.shaky - a.shaky || a.mastery - b.mastery)[0];
  if (weak) {
    return { focus: weak, kind: "weak", reason: `${weak.shaky} shaky problems in ${weak.topic.title}. Shore it up before moving on.` };
  }
  const frontier =
    stats.find((s) => s.state === "active") ?? stats.find((s) => s.state === "open") ?? stats.find((s) => s.state === "locked" && s.solved < s.total);
  if (frontier) {
    const left = frontier.total - frontier.solved;
    return { focus: frontier, kind: "frontier", reason: `${left} left in ${frontier.topic.title}, the next step on your roadmap.` };
  }
  return { focus: null, kind: "complete", reason: "You have cleared the whole roadmap." };
}

/** Unsolved problems in learning order, starting with the recommended topic. */
export function nextProblems(stats: TopicStat[], problems: Problem[], solvedIds: Set<number>, focusId: number | null, count: number): Problem[] {
  if (count <= 0) return [];
  const order = new Map(stats.map((s) => [s.topic.id, s.topic.position]));
  const sorted = [...problems]
    .filter((p) => !solvedIds.has(p.id))
    .sort((a, b) => {
      const fa = a.topic_id === focusId ? 0 : 1;
      const fb = b.topic_id === focusId ? 0 : 1;
      return fa - fb || (order.get(a.topic_id) ?? 0) - (order.get(b.topic_id) ?? 0) || a.position - b.position;
    });
  return sorted.slice(0, count);
}

export interface Badge {
  id: string;
  title: string;
  hint: string;
  unlocked: boolean;
  /** 0..1 progress toward unlocking, for locked badges. */
  progress: number;
}

export function badges(ctx: {
  solved: number;
  hardSolved: number;
  bestStreak: number;
  reviews: number;
  topicsDone: number;
  notes: number;
}): Badge[] {
  const tier = (id: string, title: string, hint: string, value: number, target: number): Badge => ({
    id,
    title,
    hint,
    unlocked: value >= target,
    progress: Math.min(1, value / target),
  });
  return [
    tier("first", "First Pass", "Solve your first problem", ctx.solved, 1),
    tier("ten", "Getting Sharp", "Solve 10 problems", ctx.solved, 10),
    tier("fifty", "Half a Hundred", "Solve 50 problems", ctx.solved, 50),
    tier("hundred", "Centurion", "Solve 100 problems", ctx.solved, 100),
    tier("streak3", "On a Roll", "Hold a 3-day streak", ctx.bestStreak, 3),
    tier("streak7", "Week of Sparks", "Hold a 7-day streak", ctx.bestStreak, 7),
    tier("streak30", "Unbroken", "Hold a 30-day streak", ctx.bestStreak, 30),
    tier("hard", "Edge Case", "Solve a hard problem", ctx.hardSolved, 1),
    tier("topic", "Topic Cleared", "Finish every problem in a topic", ctx.topicsDone, 1),
    tier("reviewer", "Won't Forget", "Complete 10 revisions", ctx.reviews, 10),
    tier("notes", "Field Notes", "Write notes on 5 problems", ctx.notes, 5),
  ];
}
