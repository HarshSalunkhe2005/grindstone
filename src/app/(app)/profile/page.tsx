import type { Metadata } from "next";
import { CountUp } from "@/components/count-up";
import { Heatmap } from "@/components/heatmap";
import { SyncButton } from "@/components/sync-button";
import { Bar, DIFF_COLOR, DIFF_TEXT, Icon, Ring } from "@/components/ui";
import { loadUserContext } from "@/lib/data";
import { heatmapWeeks } from "@/lib/game";
import type { CodeforcesStats, GithubStats, LeetCodeStats } from "@/lib/platforms";

export const metadata: Metadata = { title: "Profile" };

const DIFFS = ["easy", "medium", "hard"] as const;

export default async function ProfilePage() {
  const { supabase, userId, profile, tz, problems, solvedIds, perDay, streak, level, stats, badges, progress } = await loadUserContext();

  const { data: statRows } = await supabase.from("platform_stats").select("platform, data, fetched_at").eq("user_id", userId);
  const platform = new Map((statRows ?? []).map((r) => [r.platform, r]));
  const lc = platform.get("leetcode")?.data as LeetCodeStats | undefined;
  const cf = platform.get("codeforces")?.data as CodeforcesStats | undefined;
  const gh = platform.get("github")?.data as GithubStats | undefined;

  const diff = Object.fromEntries(DIFFS.map((d) => [d, { solved: 0, total: 0 }])) as Record<(typeof DIFFS)[number], { solved: number; total: number }>;
  for (const p of problems) {
    diff[p.difficulty].total += 1;
    if (solvedIds.has(p.id)) diff[p.difficulty].solved += 1;
  }

  const { cols, months } = heatmapWeeks(perDay, 36, new Date(), tz);
  const hasHandles = Boolean(profile.leetcode_handle || profile.codeforces_handle || profile.github_handle);
  const lastSync = [...platform.values()].map((s) => s.fetched_at).sort().at(-1);
  const reviews = progress.reduce((n, p) => n + p.review_count, 0);
  const unlocked = badges.filter((b) => b.unlocked).length;
  const initials = (profile.display_name ?? "?").split(" ").map((w: string) => w[0]).slice(0, 2).join("").toUpperCase();

  return (
    <div className="space-y-6">
      <header className="card flex flex-wrap items-center gap-5 p-6">
        <div className="grid size-16 shrink-0 place-items-center rounded-2xl border border-arc/40 bg-arc-soft font-display text-2xl font-semibold text-arc">
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-3xl font-semibold">{profile.display_name || "Your profile"}</h1>
          <p className="mt-0.5 text-sm text-muted">{profile.username ? `@${profile.username}` : "Set a username in Settings"}</p>
          <div className="mt-3 max-w-sm">
            <div className="mb-1.5 flex justify-between text-xs">
              <span className="font-medium text-text">
                Lv {level.level} · {level.title}
              </span>
              <span className="num text-faint">{profile.xp} XP</span>
            </div>
            <Bar value={level.progress} label="Progress to next level" />
          </div>
        </div>
        <dl className="grid grid-cols-3 gap-6 text-center">
          {[
            ["Solved", solvedIds.size],
            ["Streak", streak.current],
            ["Revisions", reviews],
          ].map(([label, value]) => (
            <div key={label as string}>
              <dd className="num font-display text-3xl font-semibold">
                <CountUp value={value as number} />
              </dd>
              <dt className="text-xs text-faint">{label}</dt>
            </div>
          ))}
        </dl>
      </header>

      <section className="card p-5" aria-labelledby="activity-title">
        <h2 id="activity-title" className="font-display mb-4 text-xl font-semibold">
          Activity
        </h2>
        <Heatmap cols={cols} months={months} />
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card p-5" aria-labelledby="diff-title">
          <h2 id="diff-title" className="font-display mb-4 text-xl font-semibold">
            By difficulty
          </h2>
          <div className="grid grid-cols-3 gap-3">
            {DIFFS.map((d) => (
              <div key={d} className="flex flex-col items-center gap-2">
                <Ring value={diff[d].solved / Math.max(1, diff[d].total)} size={88} stroke={8} color={DIFF_COLOR[d]} label={`${diff[d].solved} of ${diff[d].total} ${d} solved`}>
                  <span className="num text-lg font-semibold">{diff[d].solved}</span>
                </Ring>
                <p className={`text-xs font-medium capitalize ${DIFF_TEXT[d]}`}>{d}</p>
                <p className="num text-xs text-faint">of {diff[d].total}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="card p-5" aria-labelledby="mastery-title">
          <h2 id="mastery-title" className="font-display mb-4 text-xl font-semibold">
            Topic mastery
          </h2>
          <ul className="space-y-2.5">
            {stats.map((s) => (
              <li key={s.topic.id} className="grid grid-cols-[8.5rem_1fr_2.5rem] items-center gap-3 text-sm">
                <span className={`truncate ${s.solved === 0 ? "text-faint" : ""}`}>{s.topic.title}</span>
                <Bar value={s.mastery} color={s.state === "done" ? "var(--easy)" : s.mastery < 0.6 && s.solved > 0 ? "var(--hard)" : "var(--arc)"} label={`${s.topic.title} mastery`} />
                <span className="num text-right text-xs text-faint">{Math.round(s.mastery * 100)}%</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="card p-5" aria-labelledby="badges-title">
        <div className="mb-4 flex items-baseline justify-between">
          <h2 id="badges-title" className="font-display text-xl font-semibold">
            Badges
          </h2>
          <span className="num text-sm text-faint">
            {unlocked} / {badges.length}
          </span>
        </div>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {badges.map((b) => (
            <li
              key={b.id}
              className={`flex items-center gap-3 rounded-xl border p-3 ${b.unlocked ? "border-arc/40 bg-arc-soft" : "border-line"}`}
            >
              <span
                className={`grid size-10 shrink-0 place-items-center rounded-xl ${b.unlocked ? "bg-arc text-arc-ink" : "bg-panel-3 text-faint"}`}
              >
                <Icon name={b.unlocked ? "trophy" : "lock"} size={18} />
              </span>
              <div className="min-w-0 flex-1">
                <p className={`text-sm font-semibold ${b.unlocked ? "" : "text-muted"}`}>{b.title}</p>
                <p className="truncate text-xs text-faint">{b.hint}</p>
                {!b.unlocked && b.progress > 0 && (
                  <div className="mt-1.5">
                    <Bar value={b.progress} label={`${b.title} progress`} />
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="platforms-title" className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="platforms-title" className="font-display text-xl font-semibold">
            Connected platforms
          </h2>
          <SyncButton hasHandles={hasHandles} />
        </div>
        {lastSync && (
          <p className="-mt-2 text-xs text-faint">
            Last synced {new Date(lastSync).toLocaleString("en-IN", { timeZone: tz, dateStyle: "medium", timeStyle: "short" })}
          </p>
        )}
        <div className="grid gap-3 sm:grid-cols-3">
          <PlatformCard name="LeetCode" handle={profile.leetcode_handle}>
            {lc && (
              <>
                <Big value={lc.total} label="problems solved" />
                <p className="num text-sm">
                  <span className="text-easy">{lc.easy}</span> / <span className="text-medium">{lc.medium}</span> / <span className="text-hard">{lc.hard}</span>
                </p>
                {lc.ranking && <p className="text-xs text-faint">Rank {lc.ranking.toLocaleString("en-IN")}</p>}
              </>
            )}
          </PlatformCard>
          <PlatformCard name="Codeforces" handle={profile.codeforces_handle}>
            {cf && (
              <>
                <Big value={cf.rating ?? 0} label={cf.rank ?? "unrated"} />
                <p className="text-xs text-faint">
                  {cf.solved} solved · max {cf.maxRating ?? "n/a"}
                </p>
              </>
            )}
          </PlatformCard>
          <PlatformCard name="GitHub" handle={profile.github_handle}>
            {gh && (
              <>
                <Big value={gh.repos} label="public repos" />
                <p className="text-xs text-faint">{gh.followers.toLocaleString("en-IN")} followers</p>
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
      <p className="num font-display text-3xl font-semibold">{value.toLocaleString("en-IN")}</p>
      <p className="text-xs text-faint">{label}</p>
    </div>
  );
}

function PlatformCard({ name, handle, children }: { name: string; handle: string | null; children: React.ReactNode }) {
  return (
    <div className="card space-y-2 p-4">
      <div className="flex items-baseline justify-between">
        <p className="font-medium">{name}</p>
        <p className="truncate text-xs text-faint">{handle ? `@${handle}` : "not connected"}</p>
      </div>
      {handle ? children || <p className="text-sm text-muted">Press Sync to load stats.</p> : <p className="text-sm text-muted">Add your handle in Settings.</p>}
    </div>
  );
}
