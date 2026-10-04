import { fail, rateLimit, requireUser, tooMany } from "@/lib/api";

// GET /api/v1/export -> everything Grindstone stores about you, as a JSON download.
export async function GET() {
  const { supabase, userId } = await requireUser();
  if (!userId) return fail(401, "unauthorized", "Sign in first.");

  const limit = await rateLimit(supabase, "export", 5, 60_000);
  if (!limit.allowed) return tooMany(limit.retryAfter);

  const [profile, progress, stats, lessons, mocks, log] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", userId).single(),
    supabase.from("user_problems").select("*").eq("user_id", userId).order("solved_at"),
    supabase.from("platform_stats").select("platform, data, fetched_at").eq("user_id", userId),
    supabase.from("user_lessons").select("lesson_slug, completed_at").eq("user_id", userId),
    supabase.from("mock_attempts").select("*").eq("user_id", userId),
    supabase.from("interview_log").select("*").eq("user_id", userId),
  ]);
  if (profile.error || progress.error || stats.error || lessons.error || mocks.error || log.error) return fail(500, "db_error", "Could not export your data.");

  const body = JSON.stringify(
    {
      exportedAt: new Date().toISOString(),
      profile: profile.data,
      progress: progress.data,
      platformStats: stats.data,
      lessonsCompleted: lessons.data,
      mockRounds: mocks.data,
      interviewLog: log.data,
    },
    null,
    2,
  );
  return new Response(body, {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": 'attachment; filename="grindstone-export.json"',
      "Cache-Control": "no-store",
    },
  });
}
