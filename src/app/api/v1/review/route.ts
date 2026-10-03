import { z } from "zod";
import { fail, ok, rateLimit, requireUser, tooMany } from "@/lib/api";
import { scheduleReview } from "@/lib/review";

const Body = z.object({
  problemId: z.number().int().positive(),
  rating: z.enum(["again", "good", "easy"]),
});

// POST /api/v1/review { problemId, rating } -> records a revision and schedules the next one.
export async function POST(request: Request) {
  const { supabase, userId } = await requireUser();
  if (!userId) return fail(401, "unauthorized", "Sign in first.");

  const limit = rateLimit(`review:${userId}`, 120, 60_000);
  if (!limit.allowed) return tooMany(limit.retryAfter);

  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return fail(400, "invalid_body", "Expected { problemId: number, rating: 'again' | 'good' | 'easy' }.");
  const { problemId, rating } = parsed.data;

  const { data: row, error: readError } = await supabase
    .from("user_problems")
    .select("review_stage, review_count")
    .eq("user_id", userId)
    .eq("problem_id", problemId)
    .maybeSingle();
  if (readError) return fail(500, "db_error", "Could not load that problem.");
  if (!row) return fail(404, "not_found", "Solve this problem before reviewing it.");

  const outcome = scheduleReview(row.review_stage, rating);
  const { error } = await supabase
    .from("user_problems")
    .update({
      review_stage: outcome.stage,
      next_review_at: outcome.nextReviewAt?.toISOString() ?? null,
      last_reviewed_at: new Date().toISOString(),
      review_count: row.review_count + 1,
      confidence: outcome.confidence,
    })
    .eq("user_id", userId)
    .eq("problem_id", problemId);
  if (error) return fail(500, "db_error", "Could not save the review.");

  return ok({
    problemId,
    stage: outcome.stage,
    mastered: outcome.mastered,
    nextReviewAt: outcome.nextReviewAt?.toISOString() ?? null,
    confidence: outcome.confidence,
  });
}
