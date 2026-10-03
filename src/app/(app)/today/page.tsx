import type { Metadata } from "next";
import Link from "next/link";
import { ProblemRow } from "@/components/problem-row";
import { loadUserContext } from "@/lib/data";
import { dayKey, daysUntil } from "@/lib/game";

export const metadata: Metadata = { title: "Today" };

const DAILY_GOAL = 3;

export default async function TodayPage() {
  const { profile, topics, problems, solved, solvedIds, perDay, streak, level } = await loadUserContext();

  const today = dayKey(new Date());
  const solvedToday = perDay.get(today) ?? 0;
  const byId = new Map(problems.map((p) => [p.id, p]));
  const topicOrder = new Map(topics.map((t) => [t.id, t.position]));

  const doneToday = solved
    .filter((s) => dayKey(s.solved_at) === today)
    .map((s) => byId.get(s.problem_id))
    .filter((p): p is NonNullable<typeof p> => Boolean(p));

  const upcoming = problems
    .filter((p) => !solvedIds.has(p.id))
    .sort((a, b) => (topicOrder.get(a.topic_id) ?? 0) - (topicOrder.get(b.topic_id) ?? 0) || a.position - b.position)
    .slice(0, Math.max(0, DAILY_GOAL - doneToday.length));

  const picks = [...doneToday, ...upcoming];
  const topicTitle = new Map(topics.map((t) => [t.id, t.title]));
  const total = problems.length;
  const daysLeft = profile.target_date ? daysUntil(profile.target_date) : null;
  const name = profile.display_name?.split(" ")[0] ?? "there";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Hey {name}.</h1>
        <p className="mt-1 text-muted">
          {solvedToday >= DAILY_GOAL
            ? "Goal hit for today. Anything more is a bonus."
            : `${DAILY_GOAL - solvedToday} to go for today's goal.`}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Streak" value={`${streak}`} unit={streak === 1 ? "day" : "days"} />
        <Stat label="Solved" value={`${solvedIds.size}`} unit={`/ ${total}`} />
        <Stat label="Level" value={`${level.level}`} unit={level.title} />
        <Stat
          label="Target"
          value={daysLeft === null ? "—" : `${Math.max(daysLeft, 0)}`}
          unit={daysLeft === null ? "set a date" : "days left"}
        />
      </div>

      <section className="card p-5">
        <div className="flex items-baseline justify-between">
          <h2 className="font-semibold">Today&apos;s problems</h2>
          <span className="num text-sm text-muted">
            {Math.min(solvedToday, DAILY_GOAL)} / {DAILY_GOAL}
          </span>
        </div>
        {picks.length === 0 ? (
          <p className="mt-4 text-sm text-muted">You have cleared the whole roadmap. Time for mock interviews.</p>
        ) : (
          <ul className="mt-3">
            {picks.map((p) => (
              <ProblemRow
                key={p.id}
                id={p.id}
                title={p.title}
                url={p.url}
                difficulty={p.difficulty}
                solved={solvedIds.has(p.id)}
                hint={topicTitle.get(p.topic_id)}
              />
            ))}
          </ul>
        )}
        <p className="mt-4 text-xs text-muted">
          Solve it on LeetCode, then tick it here, or sync your profile in{" "}
          <Link href="/settings" className="underline">
            Settings
          </Link>{" "}
          and recent solves tick themselves.
        </p>
      </section>

      <section className="card p-5">
        <div className="flex items-baseline justify-between">
          <h2 className="font-semibold">Level {level.level}: {level.title}</h2>
          <span className="num text-sm text-muted">{level.toNext} XP to next level</span>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface-2" role="progressbar" aria-valuenow={Math.round(level.progress * 100)} aria-valuemin={0} aria-valuemax={100} aria-label="Level progress">
          <div className="h-full rounded-full bg-spark transition-[width] duration-500" style={{ width: `${Math.round(level.progress * 100)}%` }} />
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div className="card p-4">
      <p className="text-xs uppercase tracking-wider text-muted">{label}</p>
      <p className="num mt-1 text-3xl font-bold">{value}</p>
      <p className="text-xs text-muted">{unit}</p>
    </div>
  );
}
