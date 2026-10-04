import { z } from "zod";
import { readJson, fail, ok, rateLimit, requireUser, tooMany } from "@/lib/api";

const Body = z.object({
  problemId: z.number().int().positive(),
  solved: z.boolean(),
});

// GET /api/v1/progress -> { data: { solved: [{ problemId, solvedAt, source }] } }
export async function GET() {
  const { supabase, userId } = await requireUser();
  if (!userId) return fail(401, "unauthorized", "Sign in first.");

  const { data, error } = await supabase
    .from("user_problems")
    .select("problem_id, solved_at, source")
    .eq("user_id", userId)
    .order("solved_at", { ascending: false });
  if (error) return fail(500, "db_error", "Could not load progress.");

  return ok({
    solved: data.map((r) => ({ problemId: r.problem_id, solvedAt: r.solved_at, source: r.source })),
  });
}

// POST /api/v1/progress { problemId, solved } -> marks or unmarks one problem.
export async function POST(request: Request) {
  const { supabase, userId } = await requireUser();
  if (!userId) return fail(401, "unauthorized", "Sign in first.");

  const limit = await rateLimit(supabase, "progress", 120, 60_000);
  if (!limit.allowed) return tooMany(limit.retryAfter);

  const parsed = Body.safeParse(await readJson(request));
  if (!parsed.success) return fail(400, "invalid_body", "Expected { problemId: number, solved: boolean }.");
  const { problemId, solved } = parsed.data;

  if (solved) {
    const { error } = await supabase
      .from("user_problems")
      .upsert({ user_id: userId, problem_id: problemId, source: "manual" }, { onConflict: "user_id,problem_id", ignoreDuplicates: true });
    if (error) {
      return error.code === "23503"
        ? fail(404, "not_found", "That problem does not exist.")
        : fail(500, "db_error", "Could not save progress.");
    }
  } else {
    const { error } = await supabase.from("user_problems").delete().eq("user_id", userId).eq("problem_id", problemId);
    if (error) return fail(500, "db_error", "Could not save progress.");
  }

  const { data: profile } = await supabase.from("profiles").select("xp").eq("id", userId).single();
  return ok({ problemId, solved, xp: profile?.xp ?? 0 });
}
