"use client";

import { useMemo, useState } from "react";
import { ProblemRow } from "@/components/problem-row";
import { SkillTree, type TreeTopic } from "@/components/skill-tree";
import { Bar, Icon } from "@/components/ui";
import { inPack, PACKS } from "@/lib/packs";
import type { Difficulty } from "@/lib/insights";
import type { TreeEdge } from "@/lib/tree-layout";

export interface RoadmapProblem {
  id: number;
  topicId: number;
  title: string;
  url: string;
  difficulty: Difficulty;
  solved: boolean;
  confidence: number | null;
  notes: string | null;
  minutes: number | null;
  due: boolean;
}

export interface RoadmapTopic extends TreeTopic {
  slug: string;
  blurb: string | null;
  prereqs: number[];
}

const DIFFS: Difficulty[] = ["easy", "medium", "hard"];

export function RoadmapClient({
  topics,
  edges,
  problems,
  focusId,
}: {
  topics: RoadmapTopic[];
  edges: TreeEdge[];
  problems: RoadmapProblem[];
  focusId: number | null;
}) {
  const [view, setView] = useState<"tree" | "list">("tree");
  const [selected, setSelected] = useState<number | null>(focusId ?? topics[0]?.id ?? null);
  const [query, setQuery] = useState("");
  const [diffs, setDiffs] = useState<Set<Difficulty>>(new Set());
  const [unsolvedOnly, setUnsolvedOnly] = useState(false);
  const [dueOnly, setDueOnly] = useState(false);
  const [packId, setPackId] = useState<string | null>(null);
  const pack = PACKS.find((p) => p.id === packId) ?? null;
  const slugOf = useMemo(() => new Map(topics.map((t) => [t.id, t.slug])), [topics]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return problems.filter(
      (p) =>
        (!q || p.title.toLowerCase().includes(q)) &&
        (diffs.size === 0 || diffs.has(p.difficulty)) &&
        (!unsolvedOnly || !p.solved) &&
        (!dueOnly || p.due) &&
        (!pack || (inPack(pack, slugOf.get(p.topicId), p.difficulty) && !p.solved)),
    );
  }, [problems, query, diffs, unsolvedOnly, dueOnly, pack, slugOf]);

  const byTopic = useMemo(() => {
    const m = new Map<number, RoadmapProblem[]>();
    for (const p of filtered) m.set(p.topicId, [...(m.get(p.topicId) ?? []), p]);
    return m;
  }, [filtered]);

  const filtering = query.trim() !== "" || diffs.size > 0 || unsolvedOnly || dueOnly || pack !== null;
  const current = topics.find((t) => t.id === selected) ?? null;
  const solvedTotal = problems.filter((p) => p.solved).length;

  const toggleDiff = (d: Difficulty) =>
    setDiffs((prev) => {
      const next = new Set(prev);
      if (next.has(d)) next.delete(d);
      else next.add(d);
      return next;
    });

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex rounded-xl border border-line-strong p-1" role="group" aria-label="Roadmap view">
          {(["tree", "list"] as const).map((v) => (
            <button
              key={v}
              type="button"
              aria-pressed={view === v}
              onClick={() => setView(v)}
              className={`flex min-h-10 items-center gap-2 rounded-lg px-3.5 text-sm font-medium transition-colors ${
                view === v ? "bg-panel-3 text-text" : "text-muted hover:text-text"
              }`}
            >
              <Icon name={v === "tree" ? "tree" : "list"} size={15} />
              {v === "tree" ? "Skill tree" : "All problems"}
            </button>
          ))}
        </div>
        <p className="num text-sm text-muted">
          {solvedTotal} / {problems.length} solved
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2" role="search">
        <label className="relative min-w-[12rem] flex-1 sm:max-w-xs">
          <span className="sr-only">Search problems</span>
          <Icon name="search" size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-faint" />
          <input className="input pl-10" placeholder="Search problems" value={query} onChange={(e) => setQuery(e.target.value)} />
        </label>
        {DIFFS.map((d) => (
          <button key={d} type="button" className="chip capitalize" aria-pressed={diffs.has(d)} onClick={() => toggleDiff(d)}>
            {d}
          </button>
        ))}
        <button type="button" className="chip" aria-pressed={unsolvedOnly} onClick={() => setUnsolvedOnly((v) => !v)}>
          Unsolved
        </button>
        <button type="button" className="chip" aria-pressed={dueOnly} onClick={() => setDueOnly((v) => !v)}>
          Due for revision
        </button>
        {filtering && (
          <button
            type="button"
            className="min-h-11 px-2 text-sm text-muted underline underline-offset-2 hover:text-text"
            onClick={() => {
              setQuery("");
              setDiffs(new Set());
              setUnsolvedOnly(false);
              setDueOnly(false);
              setPackId(null);
            }}
          >
            Clear filters
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2" aria-label="Problem packs">
        <span className="text-sm text-muted">Packs</span>
        {PACKS.map((p) => {
          const left = problems.filter((x) => !x.solved && inPack(p, slugOf.get(x.topicId), x.difficulty)).length;
          return (
            <button
              key={p.id}
              type="button"
              className="chip"
              aria-pressed={packId === p.id}
              title={p.blurb}
              onClick={() => {
                setPackId(packId === p.id ? null : p.id);
                setView("list");
              }}
            >
              {p.label} <span className="num text-xs">{left} left</span>
            </button>
          );
        })}
      </div>
      {pack && <p className="-mt-2 text-sm text-muted">{pack.blurb}. Showing only what you have not solved yet.</p>}

      {view === "tree" && !pack ? (
        <>
          <SkillTree topics={topics} edges={edges} selectedId={selected} focusId={focusId} onSelect={setSelected} />
          {current && (
            <section className="card card-hero rise p-5 sm:p-6" aria-labelledby="topic-title" key={current.id}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="max-w-xl">
                  <h2 id="topic-title" className="font-display text-2xl font-semibold">
                    {current.title}
                  </h2>
                  {current.blurb && <p className="mt-1 text-sm text-muted">{current.blurb}</p>}
                  {current.prereqs.length > 0 && (
                    <p className="mt-2 text-sm text-muted">
                      Builds on: {current.prereqs.map((id) => topics.find((t) => t.id === id)?.title).filter(Boolean).join(", ")}
                    </p>
                  )}
                </div>
                <div className="w-48">
                  <div className="mb-1.5 flex justify-between text-xs text-faint">
                    <span>Mastery heat</span>
                    <span className="num">
                      {current.solved}/{current.total} solved
                    </span>
                  </div>
                  <Bar heat value={current.mastery} label={`${current.title} mastery`} />
                  <p className="num mt-2 text-xs text-muted">
                    mastery {Math.round(current.mastery * 100)}%{current.due > 0 ? ` · ${current.due} to revise` : ""}
                  </p>
                </div>
              </div>
              <ul className="mt-4 border-t border-line pt-3">
                {(byTopic.get(current.id) ?? []).map((p) => (
                  <ProblemRow key={p.id} id={p.id} title={p.title} url={p.url} difficulty={p.difficulty} solved={p.solved} confidence={p.confidence} notes={p.notes} minutes={p.minutes} />
                ))}
              </ul>
              {(byTopic.get(current.id) ?? []).length === 0 && <p className="py-6 text-center text-sm text-faint">No problems match these filters.</p>}
            </section>
          )}
        </>
      ) : (
        <div className="space-y-3">
          {topics.map((t) => {
            const list = byTopic.get(t.id) ?? [];
            if (filtering && list.length === 0) return null;
            return (
              <details key={t.id} open={filtering || t.id === focusId} className="card group">
                <summary className="flex min-h-14 cursor-pointer list-none items-center gap-4 p-4">
                  <div className="min-w-0 flex-1">
                    <p className="font-display text-lg font-semibold">{t.title}</p>
                    <p className="truncate text-xs text-faint">{t.blurb}</p>
                  </div>
                  <div className="hidden w-32 sm:block">
                    <Bar value={t.solved / Math.max(1, t.total)} label={`${t.title} progress`} />
                  </div>
                  <span className="num w-14 text-right text-sm text-muted">
                    {t.solved}/{t.total}
                  </span>
                  <Icon name="arrow" size={14} className="text-faint transition-transform group-open:rotate-90" />
                </summary>
                <ul className="border-t border-line p-2">
                  {list.map((p) => (
                    <ProblemRow key={p.id} id={p.id} title={p.title} url={p.url} difficulty={p.difficulty} solved={p.solved} confidence={p.confidence} notes={p.notes} minutes={p.minutes} />
                  ))}
                </ul>
              </details>
            );
          })}
          {filtering && filtered.length === 0 && <p className="py-10 text-center text-sm text-faint">No problems match these filters.</p>}
        </div>
      )}
    </div>
  );
}
