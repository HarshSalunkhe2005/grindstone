import { z } from "zod";
import { ROUNDS } from "@/lib/log";
import { fail, ok, rateLimit, readJson, requireUser, tooMany } from "@/lib/api";

const Entry = z.object({
  company: z.string().trim().min(1, "Which company?").max(80),
  round: z.enum(ROUNDS),
  question: z.string().trim().min(1, "Write the question.").max(2000),
  notes: z.string().trim().max(4000).optional(),
  askedOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use a valid date.").refine((d) => {
      const t = new Date(`${d}T00:00:00Z`);
      return !Number.isNaN(t.getTime()) && t.toISOString().startsWith(d);
    }, "Use a valid date."),
});
const Remove = z.object({ id: z.string().uuid() });

// POST /api/v1/log -> add a question you met in an interview. Private to you.
export async function POST(request: Request) {
  const { supabase, userId } = await requireUser();
  if (!userId) return fail(401, "unauthorized", "Sign in first.");
  const limit = await rateLimit(supabase, "log-write", 30, 60_000);
  if (!limit.allowed) return tooMany(limit.retryAfter);

  const parsed = Entry.safeParse(await readJson(request));
  if (!parsed.success) return fail(400, "invalid_body", parsed.error.issues[0]?.message ?? "Invalid input.");
  const v = parsed.data;

  const { data, error } = await supabase
    .from("interview_log")
    .insert({ user_id: userId, company: v.company, round: v.round, question: v.question, notes: v.notes || null, asked_on: v.askedOn })
    .select("id")
    .single();
  if (error) return error.code === "54000" ? fail(409, "log_full", "Your log is full (500 entries).") : fail(500, "db_error", "Could not save that entry.");
  return ok(data, 201);
}

// DELETE /api/v1/log { id } -> remove one of your entries.
export async function DELETE(request: Request) {
  const { supabase, userId } = await requireUser();
  if (!userId) return fail(401, "unauthorized", "Sign in first.");
  const limit = await rateLimit(supabase, "log-write", 30, 60_000);
  if (!limit.allowed) return tooMany(limit.retryAfter);

  const parsed = Remove.safeParse(await readJson(request));
  if (!parsed.success) return fail(400, "invalid_body", "Expected { id }.");
  const { error } = await supabase.from("interview_log").delete().eq("id", parsed.data.id).eq("user_id", userId);
  if (error) return fail(500, "db_error", "Could not remove that entry.");
  return ok({ id: parsed.data.id });
}
