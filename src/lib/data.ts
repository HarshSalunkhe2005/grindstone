import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { dayKey, levelFor, streakFrom } from "@/lib/game";

export type Difficulty = "easy" | "medium" | "hard";
export type Topic = { id: number; slug: string; title: string; blurb: string | null; position: number };
export type Problem = { id: number; topic_id: number; title: string; url: string; difficulty: Difficulty; position: number };
export type SolvedRow = { problem_id: number; solved_at: string; source: string };

// cache() makes the layout and the page share one load per request.
export const loadUserContext = cache(async () => {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (!userId) redirect("/login");

  const [profileRes, topicsRes, problemsRes, solvedRes] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", userId).single(),
    supabase.from("topics").select("id, slug, title, blurb, position").eq("track", "dsa").order("position"),
    supabase.from("problems").select("id, topic_id, title, url, difficulty, position").order("topic_id").order("position"),
    supabase.from("user_problems").select("problem_id, solved_at, source").eq("user_id", userId),
  ]);

  const profile = profileRes.data;
  if (!profile) redirect("/login");

  const topics = (topicsRes.data ?? []) as Topic[];
  const problems = (problemsRes.data ?? []) as Problem[];
  const solved = (solvedRes.data ?? []) as SolvedRow[];
  const solvedIds = new Set(solved.map((s) => s.problem_id));

  const perDay = new Map<string, number>();
  for (const s of solved) {
    const k = dayKey(s.solved_at);
    perDay.set(k, (perDay.get(k) ?? 0) + 1);
  }

  return {
    supabase,
    userId,
    profile,
    topics,
    problems,
    solved,
    solvedIds,
    perDay,
    streak: streakFrom(new Set(perDay.keys())),
    level: levelFor(profile.xp),
  };
});

export type UserContext = Awaited<ReturnType<typeof loadUserContext>>;
