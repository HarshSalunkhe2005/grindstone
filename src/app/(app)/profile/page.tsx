import type { Metadata } from "next";
import { Heatmap } from "@/components/heatmap";
import { SyncButton } from "@/components/sync-button";
import { loadUserContext } from "@/lib/data";
import { heatmap, TIMEZONE } from "@/lib/game";
import type { CodeforcesStats, GithubStats, LeetCodeStats } from "@/lib/platforms";

export const metadata: Metadata = { title: "Profile" };

const DIFF_TEXT = { easy: "text-easy", medium: "text-medium", hard: "text-hard" } as const;

export default async function ProfilePage() {
  const { supabase, userId, profile, problems, solvedIds, perDay, streak, level } = await loadUserContext();

  const { data: statRows } = await supabase.from("platform_stats").select("platform, data, fetched_at").eq("user_id", userId);
  const stats = new Map((statRows ?? []).map((r) => [r.platform, r]));
  const lc = stats.get("leetcode")?.data as LeetCodeStats | undefined;
  const cf = stats.get("codeforces")?.data as CodeforcesStats | undefined;
  const gh = stats.get("github")?.data as GithubStats | undefined;

  const byDifficulty = { easy: 0, medium: 0, hard: 0 };
  for (const p of problems) if (solvedIds.has(p.id)) byDifficulty[p.difficulty] += 1;

  const hasHandles = Boolean(profile.leetcode_handle || profile.codeforces_handle || profile.github_handle);
  const lastSync = [...stats.values()].map((s) => s.fetched_at).sort().at(-1);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{profile.display_name || "Your profile"}</h1>
          <p className="mt-1 text-muted">
            {profile.username ? `@${profile.username} · ` : ""}Level {level.level} {level.title} ·{" "}
            <span className="num">{profile.xp}</span> XP · <span className="num">{streak}</span> day streak
          </p>
        </div>
      </div>

      <section className="card p-5">
        <h2 className="mb-4 font-semibold">Activity</h2>
        <Heatmap cells={heatmap(perDay)} />
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        {(["easy", "medium", "hard"] as const).map((d) => (
          <div key={d} className="card p-4">
            <p className={`text-xs font-medium uppercase tracking-wider ${DIFF_TEXT[d]}`}>{d}</p>
            <p className="num mt-1 text-3xl font-bold">{byDifficulty[d]}</p>
            <p className="text-xs text-muted">solved on the roadmap</p>
          </div>
        ))}
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-semibold">Connected platforms</h2>
          <SyncButton hasHandles={hasHandles} />
        </div>
        {lastSync && <p className="text-xs text-muted">Last synced {new Date(lastSync).toLocaleString("en-IN", { timeZone: TIMEZONE, dateStyle: "medium", timeStyle: "short" })}</p>}

        <div className="grid gap-3 sm:grid-cols-3">
          <PlatformCard name="LeetCode" handle={profile.leetcode_handle}>
            {lc && (
              <>
                <Big value={lc.total} label="problems solved" />
                <p className="num text-sm text-muted">
                  <span className="text-easy">{lc.easy}</span> / <span className="text-medium">{lc.medium}</span> /{" "}
                  <span className="text-hard">{lc.hard}</span>
                </p>
                {lc.ranking && <p className="text-xs text-muted">Rank {lc.ranking.toLocaleString("en-IN")}</p>}
              </>
            )}
          </PlatformCard>
          <PlatformCard name="Codeforces" handle={profile.codeforces_handle}>
            {cf && (
              <>
                <Big value={cf.rating ?? 0} label={cf.rank ?? "unrated"} />
                <p className="text-xs text-muted">
                  {cf.solved} solved · max {cf.maxRating ?? "—"}
                </p>
              </>
            )}
          </PlatformCard>
          <PlatformCard name="GitHub" handle={profile.github_handle}>
            {gh && (
              <>
                <Big value={gh.repos} label="public repos" />
                <p className="text-xs text-muted">{gh.followers.toLocaleString("en-IN")} followers</p>
              </>
            )}
          </PlatformCard>
        </div>
      </section>
    </div>
  );
}

function Big({ value, label }: { value: number; label: string }) {
  return (
    <div>
      <p className="num text-3xl font-bold">{value.toLocaleString("en-IN")}</p>
      <p className="text-xs text-muted">{label}</p>
    </div>
  );
}

function PlatformCard({ name, handle, children }: { name: string; handle: string | null; children: React.ReactNode }) {
  return (
    <div className="card space-y-2 p-4">
      <div className="flex items-baseline justify-between">
        <p className="font-medium">{name}</p>
        <p className="truncate text-xs text-muted">{handle ? `@${handle}` : "not connected"}</p>
      </div>
      {handle ? children || <p className="text-sm text-muted">Press Sync to load stats.</p> : <p className="text-sm text-muted">Add your handle in Settings.</p>}
    </div>
  );
}
