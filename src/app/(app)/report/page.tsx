import type { Metadata } from "next";
import Link from "next/link";
import { Bar } from "@/components/ui";
import { ReadinessCard } from "@/components/readiness-card";
import { loadUserContext } from "@/lib/data";
import { addDays, dayKey } from "@/lib/game";
import { loadReadiness } from "@/lib/readiness-data";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Weekly report" };

const XP = { easy: 10, medium: 20, hard: 40 } as const;

export default async function ReportPage() {
  const ctx = await loadUserContext();
  const supabase = await createClient();
  const ready = await loadReadiness(ctx);

  const weekStart = addDays(ctx.today, -6);
  const prevStart = addDays(ctx.today, -13);
  const inWeek = (iso: string | null) => {
    if (!iso) return false;
    const d = dayKey(iso, ctx.tz);
    return d >= weekStart && d <= ctx.today;
  };
  const inPrev = (iso: string | null) => {
    if (!iso) return false;
    const d = dayKey(iso, ctx.tz);
    return d >= prevStart && d < weekStart;
  };

  const { data: lessonRows } = await supabase.from("user_lessons").select("completed_at");
  const { data: mockRows } = await supabase.from("mock_attempts").select("finished_at").not("finished_at", "is", null);

  const solvedWeek = ctx.progress.filter((p) => inWeek(p.solved_at));
  const solvedPrev = ctx.progress.filter((p) => inPrev(p.solved_at));
  const xpWeek = solvedWeek.reduce((n, p) => n + XP[ctx.problemById.get(p.problem_id)?.difficulty ?? "easy"], 0);
  const revisionsWeek = ctx.progress.filter((p) => inWeek(p.last_reviewed_at)).length;
  const lessonsWeek = (lessonRows ?? []).filter((l) => inWeek(l.completed_at)).length;
  const mocksWeek = (mockRows ?? []).filter((m) => inWeek(m.finished_at)).length;

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const perDay = days.map((d) => ({ day: d, count: ctx.perDay.get(d) ?? 0 }));
  const activeDays = perDay.filter((d) => d.count > 0).length;
  const best = perDay.reduce((a, b) => (b.count > a.count ? b : a), perDay[0]);
  const label = (d: string) => new Intl.DateTimeFormat("en", { weekday: "short", timeZone: "UTC" }).format(new Date(`${d}T00:00:00Z`));
  const maxCount = Math.max(1, ...perDay.map((d) => d.count));

  const topicName = new Map(ctx.topics.map((t) => [t.id, t.title]));
  const touched = new Map<string, number>();
  for (const p of solvedWeek) {
    const t = topicName.get(ctx.problemById.get(p.problem_id)?.topic_id ?? -1);
    if (t) touched.set(t, (touched.get(t) ?? 0) + 1);
  }
  const hardest = solvedWeek
    .map((p) => ctx.problemById.get(p.problem_id))
    .filter((p): p is NonNullable<typeof p> => Boolean(p))
    .sort((a, b) => XP[b.difficulty] - XP[a.difficulty])[0];

  const delta = solvedWeek.length - solvedPrev.length;
  const stats: [string, number][] = [
    ["Problems solved", solvedWeek.length],
    ["XP earned", xpWeek],
    ["Revisions", revisionsWeek],
    ["Lessons", lessonsWeek],
    ["Mock rounds", mocksWeek],
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-4xl font-semibold sm:text-5xl">Your week</h1>
        <p className="mt-2 max-w-xl text-muted">
          {new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(`${weekStart}T00:00:00Z`))} to today.{" "}
          {solvedWeek.length === 0
            ? "A quiet week. One problem today restarts it."
            : delta > 0
              ? `${delta} more problem${delta === 1 ? "" : "s"} than the week before.`
              : delta < 0
                ? `${-delta} fewer than the week before. Still moving.`
                : "The same as the week before. Steady."}
        </p>
      </div>

      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {stats.map(([name, value]) => (
          <div key={name} className="card p-4">
            <dd className="num font-display text-4xl font-semibold text-ember">{value}</dd>
            <dt className="text-sm text-muted">{name}</dt>
          </div>
        ))}
      </dl>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="space-y-6">
          <section className="card p-5" aria-labelledby="days-title">
            <h2 id="days-title" className="font-display mb-4 text-xl font-semibold">
              Day by day
            </h2>
            <ul className="grid grid-cols-7 items-end gap-2" aria-label="Problems solved each day this week">
              {perDay.map((d) => (
                <li key={d.day} className="text-center">
                  <div className="flex h-28 items-end justify-center">
                    <div
                      className="w-full max-w-10 rounded-t-lg"
                      style={{
                        height: `${Math.max(d.count ? 14 : 4, (d.count / maxCount) * 100)}%`,
                        background: d.count ? "linear-gradient(180deg, var(--ember-hot), var(--ember), var(--ember-deep))" : "var(--line)",
                      }}
                    />
                  </div>
                  <p className="num mt-1.5 text-sm">{d.count}</p>
                  <p className="text-xs text-muted">{label(d.day)}</p>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-sm text-muted">
              Active on {activeDays} of 7 days{best.count > 0 ? `. Best day: ${label(best.day)} with ${best.count}.` : "."}
            </p>
          </section>

          <section className="card p-5" aria-labelledby="topics-title">
            <h2 id="topics-title" className="font-display mb-3 text-xl font-semibold">
              What you worked on
            </h2>
            {touched.size === 0 ? (
              <p className="text-sm text-muted">Nothing solved yet this week.</p>
            ) : (
              <ul className="space-y-3">
                {[...touched.entries()]
                  .sort((a, b) => b[1] - a[1])
                  .map(([name, n]) => (
                    <li key={name}>
                      <div className="mb-1 flex justify-between text-sm">
                        <span>{name}</span>
                        <span className="num text-muted">{n}</span>
                      </div>
                      <Bar heat value={n / Math.max(...touched.values())} label={`${name}: ${n} solved`} />
                    </li>
                  ))}
              </ul>
            )}
            {hardest && <p className="mt-4 text-sm text-muted">Toughest solve: {hardest.title} ({hardest.difficulty}).</p>}
          </section>

          <section className="card card-hero p-5" aria-labelledby="next-title">
            <h2 id="next-title" className="font-display text-xl font-semibold">
              Next week
            </h2>
            <p className="mt-2 text-muted">{ready.fixFirst[0] ?? "Keep your rhythm: a little every day, and clear revisions before new problems."}</p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link href="/today" className="btn btn-ember btn-sm">
                Open Today
              </Link>
              <Link href="/mock" className="btn btn-quiet btn-sm">
                Take a mock
              </Link>
            </div>
          </section>
        </div>

        <aside className="space-y-6">
          <ReadinessCard r={ready} />
        </aside>
      </div>
    </div>
  );
}
