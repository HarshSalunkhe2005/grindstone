import type { Metadata } from "next";
import Link from "next/link";
import { CountUp } from "@/components/count-up";
import { ProblemRow } from "@/components/problem-row";
import { ReviewQueue, type DueItem } from "@/components/review-queue";
import { Bar, DIFF_COLOR, Emblem, Icon, Ring, WheelArt } from "@/components/ui";
import { loadUserContext } from "@/lib/data";
import { addDays, daysUntil, greeting, longDate } from "@/lib/game";

export const metadata: Metadata = { title: "Today" };

export default async function TodayPage() {
  const ctx = await loadUserContext();
  const { profile, tz, stats, badges, progress, rec, due, dueToday, picks, perDay, streak, today, solvedToday, goal, level, solvedIds } = ctx;

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
  const nextBadge = badges.filter((b) => !b.unlocked).sort((a, b) => b.progress - a.progress)[0];
  const problemById = new Map(ctx.problems.map((p) => [p.id, p]));
  const recent = [...progress]
    .sort((a, b) => b.solved_at.localeCompare(a.solved_at))
    .slice(0, 5)
    .map((r) => ({ row: r, problem: problemById.get(r.problem_id) }))
    .filter((r): r is { row: typeof r.row; problem: NonNullable<typeof r.problem> } => Boolean(r.problem));
  const daysLeft = profile.target_date ? daysUntil(profile.target_date, new Date(), tz) : null;
  const name = (profile.display_name ?? "there").split(" ")[0];
  const goalDone = solvedToday >= goal;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm text-muted">{longDate(tz)}</p>
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
          <section className="card card-hero relative overflow-hidden p-6 sm:p-8" aria-labelledby="hero-title">
            <div aria-hidden className="pointer-events-none absolute -bottom-20 -right-10 size-80 rounded-full opacity-70 blur-3xl" style={{ background: "radial-gradient(closest-side, rgba(255,138,61,.35), transparent)" }} />
            <WheelArt className="pointer-events-none absolute -bottom-24 -right-24 size-64 opacity-50 sm:-right-16 sm:size-96 sm:opacity-100" />
            <p className="relative text-sm font-medium text-ember">{hero.label}</p>
            <h2 id="hero-title" className="font-display relative mt-2 max-w-md text-3xl font-semibold leading-tight sm:text-4xl">
              {hero.title}
            </h2>
            <p className="relative mt-3 max-w-md text-muted">{hero.body}</p>
            <div className="relative mt-7 flex flex-wrap items-center gap-3">
              {hero.external ? (
                <a href={hero.href} target="_blank" rel="noopener noreferrer" className="btn btn-ember">
                  {hero.cta} <Icon name="external" size={15} />
                </a>
              ) : (
                <Link href={hero.href} className="btn btn-ember">
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
                <span className="text-sm text-faint">Press <span className="kbd">1</span> <span className="kbd">2</span> <span className="kbd">3</span> to rate</span>
              </div>
              <ReviewQueue items={dueItems} total={dueToday.length} />
            </section>
          )}

          <section className="card p-5" aria-labelledby="today-title">
            <div className="mb-2 flex items-baseline justify-between">
              <h2 id="today-title" className="font-display text-xl font-semibold">
                {goalDone ? "Goal hit. Bonus problems" : "New problems for today"}
              </h2>
              <span className="num text-sm text-muted">
                {Math.min(solvedToday, goal)} / {goal}
              </span>
            </div>
            {picks.length === 0 ? (
              <div className="relative overflow-hidden py-8 text-center">
                <WheelArt className="pointer-events-none absolute -left-10 -top-10 size-40 opacity-40" sparks={false} />
                <p className="font-display relative text-lg font-semibold">{solvedIds.size >= ctx.problems.length ? "Roadmap cleared." : "Goal reached."}</p>
                <p className="relative mt-1 text-sm text-muted">
                  {solvedIds.size >= ctx.problems.length ? "Every problem is solved. Keep revising." : "Rest is part of the work. The wheel keeps spinning tomorrow."}
                </p>
              </div>
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
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-2 text-xs text-muted">
              <span>Solve it on LeetCode, tick it here, watch the sparks.</span>
              <Link href="/settings" className="inline-flex min-h-11 items-center text-arc underline underline-offset-2">
                Auto-tick with your handle
              </Link>
            </div>
          </section>
        </div>

        <aside className="space-y-4">
          <section className="card flex items-center gap-5 p-5" aria-label="Daily goal">
            <Ring value={goal ? solvedToday / goal : 0} label={`${solvedToday} of ${goal} problems today`} color={goalDone ? "var(--easy)" : "var(--arc)"}>
              <p className="num text-2xl font-semibold leading-none">
                <CountUp value={solvedToday} />
                <span className="text-sm text-faint">/{goal}</span>
              </p>
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
              <span className="num text-xs text-muted">best {streak.best}</span>
            </div>
            <div className="mt-4 grid grid-cols-7 gap-1.5" role="img" aria-label={`Problems solved in the last 7 days: ${week.map((w) => w.count).join(", ")}`}>
              {week.map((w, i) => (
                <div key={w.day} className="text-center">
                  <div
                    className={`mx-auto grid h-9 w-full place-items-center rounded-lg border text-xs font-semibold ${
                      w.count > 0 ? "border-ember/50 bg-ember-soft text-ember" : "border-line text-faint"
                    } ${i === 6 ? "ring-1 ring-ember/60" : ""}`}
                  >
                    {w.count > 0 ? w.count : ""}
                  </div>
                  <span className="mt-1 block text-xs text-faint">{w.label}</span>
                </div>
              ))}
            </div>
            {!streak.todayDone && streak.current > 0 && <p className="mt-3 text-xs text-ember">Solve one today to keep it alive.</p>}
          </section>

          <section className="card p-5" aria-label="Level">
            <div className="flex items-baseline justify-between">
              <p className="font-display text-lg font-semibold">{level.title}</p>
              <span className="num text-xs text-muted">Lv {level.level}</span>
            </div>
            <div className="mt-3">
              <Bar heat value={level.progress} label="Progress to next level" />
            </div>
            <p className="num mt-2 text-xs text-muted">
              {profile.xp} XP · {level.toNext} to the next edge
            </p>
          </section>

          {nextBadge && (
            <section className="card flex items-center gap-4 p-5" aria-label="Next badge">
              <Emblem id={nextBadge.id} unlocked={false} size={56} />
              <div className="min-w-0 flex-1">
                <p className="text-sm text-muted">Next badge</p>
                <p className="font-display text-lg font-semibold leading-tight">{nextBadge.title}</p>
                <p className="mb-2 text-xs text-muted">{nextBadge.hint}</p>
                <Bar heat value={nextBadge.progress} label={`${nextBadge.title} progress`} />
              </div>
            </section>
          )}

          {weakest.length > 0 && (
            <section className="card p-5" aria-label="Weakest topics">
              <h2 className="font-display mb-3 text-lg font-semibold">{rec.kind === "weak" ? "Needs work" : "How well it sticks"}</h2>
              <ul className="space-y-3.5">
                {weakest.map((s) => (
                  <li key={s.topic.id}>
                    <div className="mb-1.5 flex justify-between text-sm">
                      <span>{s.topic.title}</span>
                      <span className="num text-sm text-muted">{Math.round(s.mastery * 100)}%</span>
                    </div>
                    <Bar heat value={s.mastery} label={`${s.topic.title} mastery`} />
                  </li>
                ))}
              </ul>
            </section>
          )}

          {recent.length > 0 && (
            <section className="card p-5" aria-label="Recently solved">
              <h2 className="font-display mb-2 text-lg font-semibold">Recently solved</h2>
              <ul className="divide-y divide-line">
                {recent.map(({ row, problem }) => (
                  <li key={problem.id} className="flex items-center gap-3 py-2.5">
                    <span className="size-1.5 shrink-0 rounded-full" style={{ background: DIFF_COLOR[problem.difficulty] }} />
                    <span className="min-w-0 flex-1 truncate text-sm">{problem.title}</span>
                    <span className="num shrink-0 text-xs text-muted">{new Intl.DateTimeFormat("en", { day: "numeric", month: "short", timeZone: tz }).format(new Date(row.solved_at))}</span>
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
