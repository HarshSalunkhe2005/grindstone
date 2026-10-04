import { z } from "zod";
import { fail, ok, rateLimit, readJson, requireUser, tooMany } from "@/lib/api";

const Username = z.object({ username: z.string().trim().toLowerCase().regex(/^[a-z0-9_]{3,20}$/, "Usernames are 3-20 characters: letters, numbers, underscore.") });

// GET /api/v1/friends -> you and the friends who opted in, ranked by XP.
export async function GET() {
  const { supabase, userId } = await requireUser();
  if (!userId) return fail(401, "unauthorized", "Sign in first.");
  const limit = await rateLimit(supabase, "friends-read", 60, 60_000);
  if (!limit.allowed) return tooMany(limit.retryAfter);

  const { data, error } = await supabase.rpc("friend_board");
  if (error) return fail(500, "db_error", "Could not load the leaderboard.");
  return ok(data);
}

// POST /api/v1/friends { username } -> follow someone who has opted in.
export async function POST(request: Request) {
  const { supabase, userId } = await requireUser();
  if (!userId) return fail(401, "unauthorized", "Sign in first.");
  // Tight limit: this is the one call that could be used to guess usernames.
  const limit = await rateLimit(supabase, "friends-add", 15, 60_000);
  if (!limit.allowed) return tooMany(limit.retryAfter);

  const parsed = Username.safeParse(await readJson(request));
  if (!parsed.success) return fail(400, "invalid_body", parsed.error.issues[0]?.message ?? "Invalid input.");

  const { data, error } = await supabase.rpc("add_friend", { p_username: parsed.data.username });
  if (error) return fail(500, "db_error", "Could not add that friend.");
  if (data === "limit") return fail(409, "friend_limit", "You can follow up to 50 friends.");
  if (data !== "ok") return fail(404, "not_found", "No one with that username has joined the leaderboard.");
  return ok({ username: parsed.data.username }, 201);
}

// DELETE /api/v1/friends { username } -> unfollow.
export async function DELETE(request: Request) {
  const { supabase, userId } = await requireUser();
  if (!userId) return fail(401, "unauthorized", "Sign in first.");
  const limit = await rateLimit(supabase, "friends-del", 30, 60_000);
  if (!limit.allowed) return tooMany(limit.retryAfter);

  const parsed = Username.safeParse(await readJson(request));
  if (!parsed.success) return fail(400, "invalid_body", parsed.error.issues[0]?.message ?? "Invalid input.");

  const { error } = await supabase.rpc("remove_friend", { p_username: parsed.data.username });
  if (error) return fail(500, "db_error", "Could not remove that friend.");
  return ok({ username: parsed.data.username });
}
