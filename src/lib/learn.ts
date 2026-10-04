import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { ALL_LESSONS, MODULES } from "@/content/lessons";

/** The signed-in user's completed lesson slugs. Pages are already behind the auth proxy. */
export const loadCompletedLessons = cache(async (): Promise<Set<string>> => {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (!userId) return new Set();
  const { data } = await supabase.from("user_lessons").select("lesson_slug").eq("user_id", userId);
  return new Set((data ?? []).map((r) => r.lesson_slug));
});

export function moduleProgress(done: Set<string>) {
  return MODULES.map((m) => {
    const finished = m.lessons.filter((l) => done.has(l.slug)).length;
    return { module: m, done: finished, total: m.lessons.length };
  });
}

/** First lesson not yet done, in reading order. */
export function nextLesson(done: Set<string>) {
  return ALL_LESSONS.find((l) => !done.has(l.slug)) ?? null;
}
