import { z } from "zod";
import { fail, ok, rateLimit, requireUser, tooMany } from "@/lib/api";
import { HANDLE_RE } from "@/lib/platforms";

const handle = z
  .string()
  .trim()
  .max(40)
  .refine((v) => v === "" || HANDLE_RE.test(v), "Handles may use letters, numbers, dot, dash and underscore.")
  .transform((v) => (v === "" ? null : v));

const Patch = z
  .object({
    username: z
      .string()
      .trim()
      .toLowerCase()
      .regex(/^[a-z0-9_]{3,20}$/, "Username is 3-20 characters: letters, numbers, underscore.")
      .nullable()
      .or(z.literal("").transform(() => null)),
    displayName: z.string().trim().max(60),
    language: z.enum(["python", "java", "cpp"]),
    leetcodeHandle: handle,
    codeforcesHandle: handle,
    githubHandle: handle,
    targetDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().or(z.literal("").transform(() => null)),
  })
  .partial();

// GET /api/v1/me -> the signed-in user's profile
export async function GET() {
  const { supabase, userId } = await requireUser();
  if (!userId) return fail(401, "unauthorized", "Sign in first.");
  const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single();
  if (error) return fail(500, "db_error", "Could not load your profile.");
  return ok(data);
}

// PATCH /api/v1/me -> update any subset of the editable fields
export async function PATCH(request: Request) {
  const { supabase, userId } = await requireUser();
  if (!userId) return fail(401, "unauthorized", "Sign in first.");

  const limit = rateLimit(`me:${userId}`, 30, 60_000);
  if (!limit.allowed) return tooMany(limit.retryAfter);

  const parsed = Patch.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return fail(400, "invalid_body", parsed.error.issues[0]?.message ?? "Invalid input.");
  const v = parsed.data;

  const update: Record<string, unknown> = {};
  if ("username" in v) update.username = v.username;
  if ("displayName" in v) update.display_name = v.displayName;
  if ("language" in v) update.language = v.language;
  if ("leetcodeHandle" in v) update.leetcode_handle = v.leetcodeHandle;
  if ("codeforcesHandle" in v) update.codeforces_handle = v.codeforcesHandle;
  if ("githubHandle" in v) update.github_handle = v.githubHandle;
  if ("targetDate" in v) update.target_date = v.targetDate;
  if (!Object.keys(update).length) return fail(400, "invalid_body", "Nothing to update.");

  const { data, error } = await supabase.from("profiles").update(update).eq("id", userId).select().single();
  if (error) {
    return error.code === "23505"
      ? fail(409, "username_taken", "That username is taken.")
      : fail(500, "db_error", "Could not save your profile.");
  }
  return ok(data);
}
