import { z } from "zod";
import { readJson, fail, ok, rateLimit, requireUser, tooMany } from "@/lib/api";

const Body = z
  .object({
    problemId: z.number().int().positive(),
    notes: z.string().max(2000).optional(),
    confidence: z.union([z.literal(1), z.literal(2), z.literal(3)]).optional(),
  })
  .refine((v) => v.notes !== undefined || v.confidence !== undefined, "Nothing to update.");

// PATCH /api/v1/notes { problemId, notes?, confidence? } -> your own notes and confidence on a solved problem.
export async function PATCH(request: Request) {
  const { supabase, userId } = await requireUser();
  if (!userId) return fail(401, "unauthorized", "Sign in first.");

  const limit = await rateLimit(supabase, "notes", 120, 60_000);
  if (!limit.allowed) return tooMany(limit.retryAfter);

  const parsed = Body.safeParse(await readJson(request));
  if (!parsed.success) return fail(400, "invalid_body", parsed.error.issues[0]?.message ?? "Invalid input.");
  const { problemId, notes, confidence } = parsed.data;

  const update: Record<string, unknown> = {};
  if (notes !== undefined) update.notes = notes.trim() === "" ? null : notes;
  if (confidence !== undefined) update.confidence = confidence;

  const { data, error } = await supabase
    .from("user_problems")
    .update(update)
    .eq("user_id", userId)
    .eq("problem_id", problemId)
    .select("problem_id, notes, confidence")
    .maybeSingle();
  if (error) return fail(500, "db_error", "Could not save your notes.");
  if (!data) return fail(404, "not_found", "Solve this problem first to add notes.");
  return ok(data);
}
