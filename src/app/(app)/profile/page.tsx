import type { Metadata } from "next";
import { CountUp } from "@/components/count-up";
import { Heatmap } from "@/components/heatmap";
import { SyncButton } from "@/components/sync-button";
import Link from "next/link";
import { Bar, DIFF_COLOR, DIFF_TEXT, Emblem, Icon, Ring } from "@/components/ui";
import { loadUserContext } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";
import { heatmapWeeks } from "@/lib/game";
import type { CodeforcesStats, GithubStats, LeetCodeStats } from "@/lib/platforms";

export const metadata: Metadata = { title: "Profile" };

const DIFFS = ["easy", "medium", "hard"] as const;

export default async function ProfilePage() {
  // The platform-stats query runs alongside the main load instead of after it.
  const statsRequest = (async () => {
    const supabase = await createClient();
    const { data: claims } = await supabase.auth.getClaims();
    return supabase.from("platform_stats").select("platform, data, fetched_at").eq("user_id", claims?.claims?.sub ?? "");
  })();
  const [{ profile, tz, problems, solvedIds, perDay, streak, level, stats, badges, progress }, { data: statRows }] = await Promise.all([
    loadUserContext(),
    statsRequest,
  ]);

  const platform = new Map((statRows ?? []).map((r) => [r.platform, r]));
  const lc = platform.get("leetcode")?.data as LeetCodeStats | undefined;
  const cf = platform.get("codeforces")?.data as CodeforcesStats | undefined;
  const gh = platform.get("github")?.data as GithubStats | undefined;

  const diff = Object.fromEntries(DIFFS.map((d) => [d, { solved: 0, total: 0 }])) as Record<(typeof DIFFS)[number], { solved: number; total: number }>;
  for (const p of problems) {
    diff[p.difficulty].total += 1;
    if (solvedIds.has(p.id)) diff[p.difficulty].solved += 1;
  }

  const { cols, months } = heatmapWeeks(perDay, 30, new Date(), tz);
  const counts = cols.flat().filter((c) => !c.future).map((c) => c.count);
  const activeDays = counts.filter((n) => n > 0).length;
  const bestDay = Math.max(0, ...counts);
  const thisWeek = counts.slice(-7).reduce((n, c) => n + c, 0);
  const hasHandles = Boolean(profile.leetcode_handle || profile.codeforces_handle || profile.github_handle);
  const lastSync = [...platform.values()].map((s) => s.fetched_at).sort().at(-1);
  const reviews = progress.reduce((n, p) => n + p.review_count, 0);
  const unlocked = badges.filter((b) => b.unlocked).length;
  const initials = (profile.display_name ?? "?").split(" ").map((w: string) => w[0]).slice(0, 2).join("").toUpperCase();

  return (
    <div className="space-y-6">
      <header className="card card-hero flex flex-wrap items-center gap-5 p-6 sm:p-7">
        <div className="grid size-16 shrink-0 place-items-center rounded-2xl border border-ember/50 bg-ember-soft font-display text-2xl font-semibold text-ember">
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
              <span className="num text-muted">{profile.xp} XP</span>
            </div>
            <Bar heat value={level.progress} label="Progress to next level" />
          </div>
        </div>
        <dl className="grid grid-cols-3 gap-6 text-center">
          {[
            ["Solved", solvedIds.size],
            ["Streak", streak.current],
            ["Revisions", reviews],
          ].map(([label, value]) => (
            <div key={label as string}>
              <dd className="num font-display text-4xl font-semibold">
                <CountUp value={value as number} />
              </dd>
              <dt className="text-sm text-muted">{label}</dt>
            </div>
          ))}
        </dl>
      </header>

      <nav aria-label="More tools" className="grid grid-cols-3 gap-3">
        {[
          ["/mock", "Mock interview", "clock"],
          ["/friends", "Friends", "trophy"],
          ["/log", "Interview log", "list"],
        ].map(([href, label, icon]) => (
          <Link key={href} href={href} className="card card-lift glint flex min-h-14 items-center justify-center gap-2 px-3 text-sm font-medium">
            <Icon name={icon as "clock"} size={16} className="text-ember" /> {label}
          </Link>
        ))}
      </nav>

      <section className="card p-5" aria-labelledby="activity-title">
        <h2 id="activity-title" className="font-display mb-4 text-xl font-semibold">
          Activity
        </h2>
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_14rem]">
          <Heatmap cols={cols} months={months} />
          <dl className="grid grid-cols-3 content-start gap-4 border-t border-line pt-5 lg:grid-cols-1 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
            {[
              ["Active days", activeDays],
              ["Best day", bestDay],
              ["This week", thisWeek],
            ].map(([label, value]) => (
              <div key={label as string}>
                <dd className="num font-display text-3xl font-semibold text-ember">{value}</dd>
                <dt className="text-sm text-muted">{label}</dt>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card flex flex-col p-5" aria-labelledby="diff-title">
          <h2 id="diff-title" className="font-display mb-4 text-xl font-semibold">
            By difficulty
          </h2>
          <div className="grid grid-cols-3 gap-3">
            {DIFFS.map((d) => (
              <div key={d} className="flex flex-col items-center gap-2">
                <Ring value={diff[d].solved / Math.max(1, diff[d].total)} size={96} stroke={8} color={DIFF_COLOR[d]} label={`${diff[d].solved} of ${diff[d].total} ${d} solved`}>
                  <span className="num text-lg font-semibold">{diff[d].solved}</span>
                </Ring>
                <p className={`text-sm font-medium capitalize ${DIFF_TEXT[d]}`}>{d}</p>
                <p className="num text-sm text-muted">of {diff[d].total}</p>
              </div>
            ))}
          </div>
          <dl className="mt-auto grid grid-cols-3 gap-3 border-t border-line pt-5 text-center">
            {[
              ["Notes written", progress.filter((p) => p.notes).length],
              ["Best streak", streak.best],
              ["Roadmap done", `${Math.round((solvedIds.size / Math.max(1, problems.length)) * 100)}%`],
            ].map(([label, value]) => (
              <div key={label as string}>
                <dd className="num font-display text-2xl font-semibold">{value}</dd>
                <dt className="text-sm text-muted">{label}</dt>
              </div>
            ))}
          </dl>
        </section>

        <section className="card p-5" aria-labelledby="mastery-title">
          <h2 id="mastery-title" className="font-display mb-4 text-xl font-semibold">
            Topic mastery
          </h2>
          {stats.every((s) => s.solved === 0) && <p className="text-sm text-muted">Solve a problem and its topic lights up here, cold steel heating toward white.</p>}
          <ul className="space-y-3">
            {stats.filter((s) => s.solved > 0).map((s) => (
              <li key={s.topic.id} className="grid grid-cols-[9rem_1fr_3rem] items-center gap-3 text-sm">
                <span className="truncate">{s.topic.title}</span>
                <Bar heat value={s.mastery} label={`${s.topic.title} mastery`} />
                <span className="num text-right text-sm text-muted">{Math.round(s.mastery * 100)}%</span>
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
          <span className="num text-sm text-muted">
            {unlocked} / {badges.length}
          </span>
        </div>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {badges.map((b) => (
            <li
              key={b.id}
              className={`flex items-center gap-3 rounded-xl border p-3 ${b.unlocked ? "border-ember/40 bg-ember-soft" : "border-line bg-bg/40"}`}
            >
              <Emblem id={b.id} unlocked={b.unlocked} size={52} />
              <div className="min-w-0 flex-1">
                <p className={`text-sm font-semibold ${b.unlocked ? "text-text" : "text-muted"}`}>{b.title}</p>
                <p className="text-xs text-muted">{b.hint}</p>
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
