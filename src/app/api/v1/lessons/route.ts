import { z } from "zod";
import { readJson, fail, ok, rateLimit, requireUser, tooMany } from "@/lib/api";
import { findLesson } from "@/content/lessons";
import { QUIZZES } from "@/content/quizzes";

const Body = z.object({ slug: z.string().min(1).max(60), done: z.boolean(), quizScore: z.number().int().min(0).max(10).optional() });

// PUT /api/v1/lessons { slug, done } -> mark one web-dev lesson complete or not. Idempotent.
export async function PUT(request: Request) {
  const { supabase, userId } = await requireUser();
  if (!userId) return fail(401, "unauthorized", "Sign in first.");

  const limit = await rateLimit(supabase, "lessons", 60, 60_000);
  if (!limit.allowed) return tooMany(limit.retryAfter);

  const parsed = Body.safeParse(await readJson(request));
  if (!parsed.success) return fail(400, "invalid_body", parsed.error.issues[0]?.message ?? "Invalid input.");
  const { slug, done, quizScore } = parsed.data;
  if (!findLesson(slug)) return fail(404, "not_found", "No such lesson.");
  if (quizScore !== undefined && quizScore > (QUIZZES[slug]?.length ?? 0)) return fail(400, "invalid_body", "Score is higher than the number of questions.");

  let { error } = done
    ? await supabase.from("user_lessons").upsert({ user_id: userId, lesson_slug: slug }, { onConflict: "user_id,lesson_slug", ignoreDuplicates: true })
    : await supabase.from("user_lessons").delete().eq("user_id", userId).eq("lesson_slug", slug);
  // The score is a separate update: clients may only change quiz_score, never the row's identity.
  if (!error && done && quizScore !== undefined) {
    ({ error } = await supabase.from("user_lessons").update({ quiz_score: quizScore }).eq("user_id", userId).eq("lesson_slug", slug));
  }
  if (error) return fail(500, "db_error", "Could not save your progress.");
  return ok({ slug, done });
}
