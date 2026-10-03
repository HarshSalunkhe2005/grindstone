import { fail, ok, rateLimit, requireUser, tooMany } from "@/lib/api";
import { fetchCodeforces, fetchGithub, fetchLeetCode, HANDLE_RE } from "@/lib/platforms";

type PlatformResult = { status: "ok" | "skipped" | "error"; message?: string };

// POST /api/v1/sync -> refreshes stats for every handle saved on the profile.
export async function POST() {
  const { supabase, userId } = await requireUser();
  if (!userId) return fail(401, "unauthorized", "Sign in first.");

  const limit = rateLimit(`sync:${userId}`, 3, 60_000);
  if (!limit.allowed) return tooMany(limit.retryAfter);

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("leetcode_handle, codeforces_handle, github_handle")
    .eq("id", userId)
    .single();
  if (error || !profile) return fail(500, "db_error", "Could not load your profile.");

  const results: Record<string, PlatformResult> = {};
  let newlySolved = 0;

  async function run<T>(
    platform: "leetcode" | "codeforces" | "github",
    handle: string | null,
    fetcher: (h: string) => Promise<T>,
    after?: (stats: T) => Promise<void>,
  ) {
    if (!handle) {
      results[platform] = { status: "skipped", message: "No handle saved." };
      return;
    }
    if (!HANDLE_RE.test(handle)) {
      results[platform] = { status: "error", message: "Handle has invalid characters." };
      return;
    }
    try {
      const stats = await fetcher(handle);
      const { error: upErr } = await supabase
        .from("platform_stats")
        .upsert({ user_id: userId!, platform, data: stats as object, fetched_at: new Date().toISOString() });
      if (upErr) throw new Error("save failed");
      if (after) await after(stats);
      results[platform] = { status: "ok" };
    } catch (e) {
      results[platform] = { status: "error", message: e instanceof Error ? e.message : "Fetch failed." };
    }
  }

  await Promise.all([
    run("leetcode", profile.leetcode_handle, fetchLeetCode, async (stats) => {
      const slugs = stats.recent.map((r) => r.slug);
      if (!slugs.length) return;
      const { data: matches } = await supabase.from("problems").select("id, slug").in("slug", slugs);
      const at = new Map(stats.recent.map((r) => [r.slug, r.at]));
      const rows = (matches ?? []).map((p) => ({
        user_id: userId!,
        problem_id: p.id,
        source: "sync",
        solved_at: new Date((at.get(p.slug!) ?? Date.now() / 1000) * 1000).toISOString(),
      }));
      if (!rows.length) return;
      const { data: inserted } = await supabase
        .from("user_problems")
        .upsert(rows, { onConflict: "user_id,problem_id", ignoreDuplicates: true })
        .select("problem_id");
      newlySolved = inserted?.length ?? 0;
    }),
    run("codeforces", profile.codeforces_handle, fetchCodeforces),
    run("github", profile.github_handle, fetchGithub),
  ]);

  return ok({ results, newlySolved });
}
