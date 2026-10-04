import { z } from "zod";
import { fail, ok, rateLimit, requireUser, tooMany } from "@/lib/api";
import { MOCK_LENGTHS, pickMock } from "@/lib/mock";
import { topicStats, type Edge, type Problem, type Progress, type Topic } from "@/lib/insights";

const Start = z.object({ minutes: z.number().int().refine((m) => MOCK_LENGTHS.some((l) => l.minutes === m), "Pick 45, 60 or 90 minutes.") });
const Update = z.object({
  id: z.string().uuid(),
  solvedIds: z.array(z.number().int().positive()).max(5),
  finish: z.boolean().optional(),
});

// POST /api/v1/mock { minutes } -> starts a timed mock, or returns the one already running.
export async function POST(request: Request) {
  const { supabase, userId } = await requireUser();
  if (!userId) return fail(401, "unauthorized", "Sign in first.");

  const limit = rateLimit(`mock:${userId}`, 20, 60_000);
  if (!limit.allowed) return tooMany(limit.retryAfter);

  const parsed = Start.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return fail(400, "invalid_body", parsed.error.issues[0]?.message ?? "Invalid input.");

  const { data: active } = await supabase.from("mock_attempts").select("id").eq("user_id", userId).is("finished_at", null).maybeSingle();
  if (active) return ok({ id: active.id, resumed: true });

  const [topicsRes, edgesRes, problemsRes, progressRes] = await Promise.all([
    supabase.from("topics").select("id, slug, title, blurb, position").eq("track", "dsa").order("position"),
    supabase.from("topic_edges").select("from_topic, to_topic"),
    supabase.from("problems").select("id, topic_id, title, url, difficulty, position"),
    supabase
      .from("user_problems")
      .select("problem_id, solved_at, source, review_stage, next_review_at, last_reviewed_at, review_count, confidence, notes")
      .eq("user_id", userId),
  ]);
  const problems = (problemsRes.data ?? []) as Problem[];
  const progress = (progressRes.data ?? []) as Progress[];
  const stats = topicStats((topicsRes.data ?? []) as Topic[], problems, progress, (edgesRes.data ?? []) as Edge[]);

  const ids = pickMock(parsed.data.minutes, problems, new Set(progress.map((p) => p.problem_id)), stats);
  if (ids.length === 0) return fail(409, "nothing_left", "You have solved every problem. Nothing left to mock.");

  const { data, error } = await supabase
    .from("mock_attempts")
    .insert({ user_id: userId, duration_min: parsed.data.minutes, problem_ids: ids })
    .select("id")
    .single();
  if (error || !data) return fail(500, "db_error", "Could not start the mock.");
  return ok({ id: data.id, resumed: false }, 201);
}

// PATCH /api/v1/mock { id, solvedIds, finish? } -> saves ticks; finishing also records the solves as progress.
export async function PATCH(request: Request) {
  const { supabase, userId } = await requireUser();
  if (!userId) return fail(401, "unauthorized", "Sign in first.");

  const limit = rateLimit(`mock-save:${userId}`, 120, 60_000);
  if (!limit.allowed) return tooMany(limit.retryAfter);

  const parsed = Update.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return fail(400, "invalid_body", parsed.error.issues[0]?.message ?? "Invalid input.");
  const { id, solvedIds, finish } = parsed.data;

  const { data: attempt } = await supabase.from("mock_attempts").select("id, problem_ids, finished_at").eq("id", id).eq("user_id", userId).maybeSingle();
  if (!attempt) return fail(404, "not_found", "No such mock.");
  if (attempt.finished_at) return fail(409, "already_finished", "This mock is finished.");

  // Only problems that were in the round can be ticked.
  const allowed = new Set<number>(attempt.problem_ids);
  const solved = [...new Set(solvedIds)].filter((s) => allowed.has(s));

  const { error } = await supabase
    .from("mock_attempts")
    .update({ solved_ids: solved, ...(finish ? { finished_at: new Date().toISOString() } : {}) })
    .eq("id", id)
    .eq("user_id", userId);
  if (error) return fail(500, "db_error", "Could not save the mock.");

  if (finish && solved.length > 0) {
    // Solving in a mock counts like solving anywhere: the database trigger awards XP and starts the revision ladder.
    await supabase
      .from("user_problems")
      .upsert(solved.map((problem_id) => ({ user_id: userId, problem_id, source: "manual" })), { onConflict: "user_id,problem_id", ignoreDuplicates: true });
  }
  return ok({ id, solvedIds: solved, finished: Boolean(finish) });
}
