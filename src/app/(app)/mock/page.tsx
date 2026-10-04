import type { Metadata } from "next";
import { Bar } from "@/components/ui";
import { loadUserContext } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";
import { mockScore } from "@/lib/mock";
import { MockRunner, MockStart } from "./mock-client";

export const metadata: Metadata = { title: "Mock interview" };

interface Attempt {
  id: string;
  started_at: string;
  duration_min: number;
  problem_ids: number[];
  solved_ids: number[];
  finished_at: string | null;
}

export default async function MockPage() {
  const ctx = await loadUserContext();
  const supabase = await createClient();
  const { data } = await supabase
    .from("mock_attempts")
    .select("id, started_at, duration_min, problem_ids, solved_ids, finished_at")
    .order("started_at", { ascending: false })
    .limit(12);
  const attempts = (data ?? []) as Attempt[];

  const topicName = new Map(ctx.topics.map((t) => [t.id, t.title]));
  const byId = new Map(ctx.problems.map((p) => [p.id, p]));
  const shape = (a: Attempt) =>
    a.problem_ids.flatMap((id) => {
      const p = byId.get(id);
      return p ? [{ id: p.id, title: p.title, url: p.url, difficulty: p.difficulty, topic: topicName.get(p.topic_id) ?? "" }] : [];
    });

  const active = attempts.find((a) => !a.finished_at);
  const history = attempts.filter((a) => a.finished_at);
  const fmt = new Intl.DateTimeFormat("en", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", timeZone: ctx.tz });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-4xl font-semibold sm:text-5xl">Mock interview</h1>
        <p className="mt-2 max-w-xl text-muted">
          A timed round of problems you have not solved yet, drawn from topics you have started. Solve them on LeetCode against the clock, tick what you finish, and score yourself honestly.
        </p>
      </div>

      {active ? (
        <MockRunner
          id={active.id}
          startedAt={active.started_at}
          minutes={active.duration_min}
          initialSolved={active.solved_ids}
          problems={shape(active)}
        />
      ) : (
        <MockStart />
      )}

      <section aria-labelledby="history-title" className="card p-5">
        <h2 id="history-title" className="font-display mb-3 text-xl font-semibold">
          Past rounds
        </h2>
        {history.length === 0 ? (
          <p className="py-4 text-sm text-muted">Your finished rounds show up here, with a score weighted by difficulty.</p>
        ) : (
          <ul className="divide-y divide-line">
            {history.map((a) => {
              const ps = shape(a);
              const score = mockScore(ps, a.solved_ids);
              return (
                <li key={a.id} className="grid items-center gap-x-6 gap-y-2 py-3 sm:grid-cols-[11rem_1fr_6rem]">
                  <div>
                    <p className="text-sm font-medium">{fmt.format(new Date(a.started_at))}</p>
                    <p className="num text-xs text-muted">{a.duration_min} min round</p>
                  </div>
                  <div>
                    <Bar heat value={score} label={`Score ${Math.round(score * 100)} percent`} />
                    <p className="mt-1.5 truncate text-xs text-muted">{ps.map((p) => `${a.solved_ids.includes(p.id) ? "✓ " : ""}${p.title}`).join(" · ")}</p>
                  </div>
                  <p className="num text-right font-display text-2xl font-semibold">
                    {Math.round(score * 100)}
                    <span className="text-sm text-muted">%</span>
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
