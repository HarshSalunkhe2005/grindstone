import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DEFAULT_TZ, dayKey, levelFor, streaks } from "@/lib/game";
import {
  badges as computeBadges,
  nextProblems,
  recommend,
  topicStats,
  type Edge,
  type Problem,
  type Progress,
  type Topic,
} from "@/lib/insights";
import { isDue } from "@/lib/review";

export type { Difficulty, Problem, Progress, Topic } from "@/lib/insights";

function safeTimezone(tz: string | null | undefined): string {
  try {
    new Intl.DateTimeFormat("en", { timeZone: tz ?? DEFAULT_TZ });
    return tz ?? DEFAULT_TZ;
  } catch {
    return DEFAULT_TZ;
  }
}

/** Most revisions served in one day, so a long break never turns into an avalanche. */
export const REVIEW_CAP = 8;

const PROGRESS_COLUMNS =
  "problem_id, solved_at, source, review_stage, next_review_at, last_reviewed_at, review_count, confidence, notes";

// cache() makes the layout and the page share one load per request.
export const loadUserContext = cache(async () => {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (!userId) redirect("/login");

  const [profileRes, topicsRes, edgesRes, problemsRes, progressRes] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", userId).single(),
    supabase.from("topics").select("id, slug, title, blurb, position").eq("track", "dsa").order("position"),
    supabase.from("topic_edges").select("from_topic, to_topic"),
    supabase.from("problems").select("id, topic_id, title, url, difficulty, position").order("topic_id").order("position"),
    supabase.from("user_problems").select(PROGRESS_COLUMNS).eq("user_id", userId),
  ]);

  const profile = profileRes.data;
  if (!profile) redirect("/login");

  const tz = safeTimezone(profile.timezone);
  const now = new Date();
  const topics = (topicsRes.data ?? []) as Topic[];
  const edges = (edgesRes.data ?? []) as Edge[];
  const problems = (problemsRes.data ?? []) as Problem[];
  const progress = (progressRes.data ?? []) as Progress[];

  const progressById = new Map(progress.map((p) => [p.problem_id, p]));
  const problemById = new Map(problems.map((p) => [p.id, p]));
  const solvedIds = new Set(progress.map((p) => p.problem_id));

  const perDay = new Map<string, number>();
  for (const p of progress) {
    const k = dayKey(p.solved_at, tz);
    perDay.set(k, (perDay.get(k) ?? 0) + 1);
  }

  const streak = streaks(new Set(perDay.keys()), now, tz);
  const today = dayKey(now, tz);
  const solvedToday = perDay.get(today) ?? 0;
  const stats = topicStats(topics, problems, progress, edges, now);
  const rec = recommend(stats);

  const due = progress
    .filter((p) => isDue(p.next_review_at, now))
    .sort((a, b) => new Date(a.next_review_at!).getTime() - new Date(b.next_review_at!).getTime())
    .map((p) => ({ progress: p, problem: problemById.get(p.problem_id)! }))
    .filter((d) => d.problem);

  const goal = profile.daily_goal as number;
  const picks = nextProblems(stats, problems, solvedIds, rec.focus?.topic.id ?? null, Math.max(0, goal - solvedToday));

  const bySolved = problems.filter((p) => solvedIds.has(p.id));
  const badgeList = computeBadges({
    solved: solvedIds.size,
    hardSolved: bySolved.filter((p) => p.difficulty === "hard").length,
    bestStreak: streak.best,
    reviews: progress.reduce((n, p) => n + p.review_count, 0),
    topicsDone: stats.filter((s) => s.state === "done").length,
    notes: progress.filter((p) => (p.notes ?? "").trim().length > 0).length,
  });

  return {
    supabase,
    userId,
    profile,
    tz,
    topics,
    edges,
    problems,
    progress,
    progressById,
    problemById,
    solvedIds,
    perDay,
    streak,
    today,
    solvedToday,
    goal,
    stats,
    rec,
    due,
    dueToday: due.slice(0, REVIEW_CAP),
    picks,
    badges: badgeList,
    level: levelFor(profile.xp),
  };
});

export type UserContext = Awaited<ReturnType<typeof loadUserContext>>;
