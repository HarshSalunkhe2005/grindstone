import type { Metadata } from "next";
import { ProblemRow } from "@/components/problem-row";
import { loadUserContext } from "@/lib/data";

export const metadata: Metadata = { title: "Roadmap" };

export default async function RoadmapPage() {
  const { topics, problems, solvedIds } = await loadUserContext();

  const byTopic = new Map<number, typeof problems>();
  for (const p of problems) byTopic.set(p.topic_id, [...(byTopic.get(p.topic_id) ?? []), p]);

  const firstOpen = topics.find((t) => (byTopic.get(t.id) ?? []).some((p) => !solvedIds.has(p.id)))?.id;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">DSA roadmap</h1>
        <p className="mt-1 text-muted">
          <span className="num">{solvedIds.size}</span> of <span className="num">{problems.length}</span> solved. Work top to bottom; each topic makes the next one easier.
        </p>
      </div>

      <div className="space-y-3">
        {topics.map((t, i) => {
          const list = byTopic.get(t.id) ?? [];
          const done = list.filter((p) => solvedIds.has(p.id)).length;
          const pct = list.length ? Math.round((done / list.length) * 100) : 0;
          return (
            <details key={t.id} open={t.id === firstOpen} className="card group">
              <summary className="flex cursor-pointer list-none items-center gap-4 p-4">
                <span className="num w-6 text-sm text-muted">{String(i + 1).padStart(2, "0")}</span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{t.title}</p>
                  <p className="truncate text-xs text-muted">{t.blurb}</p>
                </div>
                <div className="hidden w-28 sm:block">
                  <div className="h-1.5 overflow-hidden rounded-full bg-surface-2">
                    <div className="h-full rounded-full bg-spark" style={{ width: `${pct}%` }} />
                  </div>
                </div>
                <span className="num w-14 text-right text-sm text-muted">
                  {done}/{list.length}
                </span>
                <svg viewBox="0 0 12 12" className="size-3 text-muted transition-transform group-open:rotate-90" aria-hidden>
                  <path d="M4 2l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </summary>
              <ul className="border-t border-line p-2">
                {list.map((p) => (
                  <ProblemRow key={p.id} id={p.id} title={p.title} url={p.url} difficulty={p.difficulty} solved={solvedIds.has(p.id)} />
                ))}
              </ul>
            </details>
          );
        })}
      </div>
    </div>
  );
}
