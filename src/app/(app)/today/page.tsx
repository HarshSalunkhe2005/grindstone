import type { Metadata } from "next";
import Link from "next/link";
import { CountUp } from "@/components/count-up";
import { ProblemRow } from "@/components/problem-row";
import { ReviewQueue, type DueItem } from "@/components/review-queue";
import { Bar, DIFF_TEXT, Icon, Ring } from "@/components/ui";
import { loadUserContext } from "@/lib/data";
import { addDays, daysUntil, greeting, longDate } from "@/lib/game";

export const metadata: Metadata = { title: "Today" };

export default async function TodayPage() {
  const ctx = await loadUserContext();
  const { profile, tz, stats, rec, due, dueToday, picks, perDay, streak, today, solvedToday, goal, level, solvedIds } = ctx;

  const topicName = new Map(ctx.topics.map((t) => [t.id, t.title]));
  const dueItems: DueItem[] = dueToday.map(({ progress, problem }) => ({
    problemId: problem.id,
    title: problem.title,
    url: problem.url,
    difficulty: problem.difficulty,
    topic: topicName.get(problem.topic_id) ?? "",
    stage: progress.review_stage,
    notes: progress.notes,
    solvedAt: progress.solved_at,
  }));

  const first = picks[0];
  const waiting = due.length - dueToday.length;
  const hero = dueToday.length > 0
    ? {
        label: "Revision due",
        title: `${dueToday.length} problem${dueToday.length === 1 ? "" : "s"} to revise`,
        body: `Recall beats new content. Rate each one honestly and the schedule adapts.${waiting > 0 ? ` ${waiting} more are waiting; they come up as you clear these.` : ""}`,
        cta: "Start revising",
        href: "#revise",
        external: false,
      }
    : first
      ? {
          label: rec.kind === "weak" ? "Shore it up" : "Next up",
          title: first.title,
          body: rec.reason,
          cta: "Open on LeetCode",
          href: first.url,
          external: true,
        }
      : { label: "Roadmap cleared", title: "Every problem solved", body: "Time for mock interviews and system design.", cta: "See your profile", href: "/profile", external: false };

  const week = Array.from({ length: 7 }, (_, i) => {
    const day = addDays(today, i - 6);
    return { day, count: perDay.get(day) ?? 0, label: new Intl.DateTimeFormat("en", { weekday: "narrow", timeZone: "UTC" }).format(new Date(`${day}T00:00:00Z`)) };
  });

  const weakest = stats
    .filter((s) => s.solved > 0 && s.state !== "done")
    .sort((a, b) => a.mastery - b.mastery)
    .slice(0, 3);
  const daysLeft = profile.target_date ? daysUntil(profile.target_date, new Date(), tz) : null;
  const name = (profile.display_name ?? "there").split(" ")[0];
  const goalDone = solvedToday >= goal;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm text-faint">{longDate(tz)}</p>
          <h1 className="font-display text-4xl font-semibold sm:text-5xl">
            {greeting(tz)}, {name}.
          </h1>
        </div>
        {daysLeft !== null && (
          <span className="chip" title="Days until your target date">
            <Icon name="target" size={14} />
            <span className="num">{Math.max(daysLeft, 0)}</span> days to your target
          </span>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="space-y-6">
          <section className="card relative overflow-hidden p-6 sm:p-8" aria-labelledby="hero-title">
            <div
              aria-hidden
              className="pointer-events-none absolute -right-16 -top-16 size-64 rounded-full opacity-60 blur-3xl"
              style={{ background: "radial-gradient(closest-side, rgba(92,200,255,.22), transparent)" }}
            />
            <p className="chip !border-arc/40 !text-arc w-fit">{hero.label}</p>
            <h2 id="hero-title" className="font-display mt-4 max-w-xl text-3xl font-semibold leading-tight sm:text-4xl">
              {hero.title}
            </h2>
            <p className="mt-3 max-w-lg text-muted">{hero.body}</p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              {hero.external ? (
                <a href={hero.href} target="_blank" rel="noopener noreferrer" className="btn btn-arc">
                  {hero.cta} <Icon name="external" size={15} />
                </a>
              ) : (
                <Link href={hero.href} className="btn btn-arc">
                  {hero.cta} <Icon name="arrow" size={16} />
                </Link>
              )}
              {first && dueToday.length === 0 && <span className="text-xs text-faint">Solve it there, then tick it below.</span>}
            </div>
          </section>

          {dueToday.length > 0 && (
            <section id="revise" className="scroll-mt-24" aria-labelledby="revise-title">
              <div className="mb-3 flex items-baseline justify-between">
                <h2 id="revise-title" className="font-display text-xl font-semibold">
                  Revision queue
                </h2>
                <span className="num text-sm text-faint">{dueToday.length} today{waiting > 0 ? ` · ${waiting} waiting` : ""}</span>
              </div>
              <ReviewQueue items={dueItems} total={dueToday.length} />
            </section>
          )}

          <section className="card p-5" aria-labelledby="today-title">
            <div className="mb-2 flex items-baseline justify-between">
              <h2 id="today-title" className="font-display text-xl font-semibold">
                {goalDone ? "Goal hit. Bonus problems" : "New problems for today"}
              </h2>
              <span className="num text-sm text-faint">
                {Math.min(solvedToday, goal)} / {goal}
              </span>
            </div>
            {picks.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted">
                {solvedIds.size >= ctx.problems.length ? "You have cleared the whole roadmap." : "Daily goal reached. Rest is part of the work."}
              </p>
            ) : (
              <ul>
                {picks.map((p) => {
                  const pr = ctx.progressById.get(p.id);
                  return (
                    <ProblemRow
                      key={p.id}
                      id={p.id}
                      title={p.title}
                      url={p.url}
                      difficulty={p.difficulty}
                      solved={Boolean(pr)}
                      confidence={pr?.confidence ?? null}
                      notes={pr?.notes ?? null}
                      hint={topicName.get(p.topic_id)}
                    />
                  );
                })}
              </ul>
            )}
            <p className="mt-3 border-t border-line pt-3 text-xs text-faint">
              Solve it on LeetCode, tick it here, and watch the sparks. Add your handle in{" "}
              <Link href="/settings" className="underline underline-offset-2">
                Settings
              </Link>{" "}
              and recent solves tick themselves.
            </p>
          </section>
        </div>

        <aside className="space-y-6">
          <section className="card flex items-center gap-5 p-5" aria-label="Daily goal">
            <Ring value={goal ? solvedToday / goal : 0} label={`${solvedToday} of ${goal} problems today`} color={goalDone ? "var(--easy)" : "var(--arc)"}>
              <div>
                <p className="num text-2xl font-semibold leading-none">
                  <CountUp value={solvedToday} />
                  <span className="text-sm text-faint">/{goal}</span>
                </p>
              </div>
            </Ring>
            <div>
              <p className="font-display text-lg font-semibold">{goalDone ? "Goal hit" : "Daily goal"}</p>
              <p className="text-sm text-muted">{goalDone ? "Sparks earned." : `${goal - solvedToday} more to go.`}</p>
            </div>
          </section>

          <section className="card p-5" aria-label="Streak">
            <div className="flex items-center justify-between">
              <p className="flex items-center gap-2 font-display text-lg font-semibold">
                <Icon name="flame" size={20} className={streak.current > 0 ? "text-ember" : "text-faint"} />
                <span className="num">
                  <CountUp value={streak.current} />
                </span>{" "}
                day streak
              </p>
              <span className="num text-xs text-faint">best {streak.best}</span>
            </div>
            <div className="mt-4 grid grid-cols-7 gap-1.5" role="img" aria-label={`Problems solved in the last 7 days: ${week.map((w) => w.count).join(", ")}`}>
              {week.map((w, i) => (
                <div key={w.day} className="text-center">
                  <div
                    className={`mx-auto grid h-9 w-full place-items-center rounded-lg border text-xs font-semibold ${
                      w.count > 0 ? "border-arc/50 bg-arc-soft text-arc" : "border-line text-faint"
                    } ${i === 6 ? "ring-1 ring-arc/60" : ""}`}
                  >
                    {w.count > 0 ? w.count : ""}
                  </div>
                  <span className="mt-1 block text-[0.65rem] text-faint">{w.label}</span>
                </div>
              ))}
            </div>
            {!streak.todayDone && streak.current > 0 && <p className="mt-3 text-xs text-ember">Solve one today to keep it alive.</p>}
          </section>

          <section className="card p-5" aria-label="Level">
            <div className="flex items-baseline justify-between">
              <p className="font-display text-lg font-semibold">{level.title}</p>
              <span className="num text-xs text-faint">Lv {level.level}</span>
            </div>
            <div className="mt-3">
              <Bar value={level.progress} label="Progress to next level" />
            </div>
            <p className="num mt-2 text-xs text-faint">
              {profile.xp} XP · {level.toNext} to the next edge
            </p>
          </section>

          {rec.focus && (
            <section className="card p-5" aria-label="Focus topic">
              <p className="text-xs uppercase tracking-wider text-faint">{rec.kind === "weak" ? "Needs work" : "Focus topic"}</p>
              <p className="font-display mt-1 text-lg font-semibold">{rec.focus.topic.title}</p>
              <div className="mt-3">
                <Bar value={rec.focus.solved / Math.max(1, rec.focus.total)} label="Topic progress" />
              </div>
              <p className="num mt-2 text-xs text-faint">
                {rec.focus.solved}/{rec.focus.total} solved
              </p>
            </section>
          )}

          {weakest.length > 0 && (
            <section className="card p-5" aria-label="Weakest topics">
              <p className="mb-3 text-xs uppercase tracking-wider text-faint">How well it sticks</p>
              <ul className="space-y-3">
                {weakest.map((s) => (
                  <li key={s.topic.id}>
                    <div className="mb-1 flex justify-between text-sm">
                      <span>{s.topic.title}</span>
                      <span className={`num text-xs ${s.mastery < 0.6 ? DIFF_TEXT.hard : "text-muted"}`}>{Math.round(s.mastery * 100)}%</span>
                    </div>
                    <Bar value={s.mastery} color={s.mastery < 0.6 ? "var(--hard)" : "var(--arc)"} label={`${s.topic.title} mastery`} />
                  </li>
                ))}
              </ul>
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}
