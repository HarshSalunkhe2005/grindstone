import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { ALL_LESSONS, MODULES } from "@/content/lessons";

/** Completed lesson slugs mapped to their quick-check score (null if they skipped it). */
export const loadCompletedLessons = cache(async (): Promise<Map<string, number | null>> => {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (!userId) return new Map();
  const { data } = await supabase.from("user_lessons").select("lesson_slug, quiz_score").eq("user_id", userId);
  return new Map((data ?? []).map((r) => [r.lesson_slug, r.quiz_score ?? null] as const));
});

export function moduleProgress(done: ReadonlyMap<string, unknown>) {
  return MODULES.map((m) => {
    const finished = m.lessons.filter((l) => done.has(l.slug)).length;
    return { module: m, done: finished, total: m.lessons.length };
  });
}

/** First lesson not yet done, in reading order. */
export function nextLesson(done: ReadonlyMap<string, unknown>) {
  return ALL_LESSONS.find((l) => !done.has(l.slug)) ?? null;
}
