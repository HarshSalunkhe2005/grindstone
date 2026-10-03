"use client";

import { useMemo } from "react";
import { NODE_H, NODE_W, layoutTree, type TreeEdge } from "@/lib/tree-layout";
import type { TopicState } from "@/lib/insights";

export interface TreeTopic {
  id: number;
  position: number;
  title: string;
  solved: number;
  total: number;
  mastery: number;
  due: number;
  state: TopicState;
}

const STATE_LABEL: Record<TopicState, string> = { done: "Cleared", active: "In progress", open: "Ready", locked: "Later" };

function clip(text: string, max = 25) {
  return text.length > max ? text.slice(0, max - 1) + "…" : text;
}

/**
 * The roadmap as a skill tree: topics are nodes, prerequisites are the threads
 * between them. Cleared threads light up in arc blue. Locked is advice (finish
 * half of what feeds it), never a wall: every node can be opened.
 */
export function SkillTree({
  topics,
  edges,
  selectedId = null,
  focusId = null,
  onSelect,
}: {
  topics: TreeTopic[];
  edges: TreeEdge[];
  selectedId?: number | null;
  focusId?: number | null;
  /** Omit for a static diagram (the nodes are then not buttons). */
  onSelect?: (id: number) => void;
}) {
  const interactive = Boolean(onSelect);
  const layout = useMemo(() => layoutTree(topics, edges), [topics, edges]);
  const byId = useMemo(() => new Map(topics.map((t) => [t.id, t])), [topics]);

  return (
    <div className="overflow-x-auto rounded-2xl border border-line bg-panel">
      <svg
        viewBox={`0 0 ${layout.width} ${layout.height}`}
        className="mx-auto block w-full"
        style={{ minWidth: Math.min(layout.width, 640) }}
        role="group"
        aria-label="Skill tree of DSA topics"
      >
        <defs>
          <filter id="node-glow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="6" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {layout.edges.map(({ from, to }) => {
          const parent = byId.get(from.id);
          const x1 = from.x + NODE_W / 2;
          const y1 = from.y + NODE_H;
          const x2 = to.x + NODE_W / 2;
          const y2 = to.y;
          const mid = (y2 - y1) / 2;
          const lit = parent?.state === "done" || (parent && parent.solved / Math.max(1, parent.total) >= 0.5);
          return (
            <path
              key={`${from.id}-${to.id}`}
              d={`M ${x1} ${y1} C ${x1} ${y1 + mid}, ${x2} ${y2 - mid}, ${x2} ${y2}`}
              fill="none"
              stroke={lit ? "var(--arc)" : "var(--line-strong)"}
              strokeOpacity={lit ? 0.7 : 1}
              strokeWidth={lit ? 2 : 1.5}
              strokeDasharray={lit ? undefined : "4 5"}
            />
          );
        })}

        {layout.nodes.map((n) => {
          const t = byId.get(n.id);
          if (!t) return null;
          const selected = selectedId === t.id;
          const ratio = t.total ? t.solved / t.total : 0;
          const stroke =
            t.state === "done" ? "var(--easy)" : selected ? "var(--arc)" : t.state === "active" ? "color-mix(in srgb, var(--arc) 60%, var(--line-strong))" : "var(--line-strong)";
          return (
            <g
              key={t.id}
              transform={`translate(${n.x} ${n.y})`}
              role={interactive ? "button" : "group"}
              tabIndex={interactive ? 0 : undefined}
              aria-pressed={interactive ? selected : undefined}
              aria-label={`${t.title}: ${t.solved} of ${t.total} solved, ${STATE_LABEL[t.state]}${t.due ? `, ${t.due} to revise` : ""}`}
              onClick={interactive ? () => onSelect!(t.id) : undefined}
              onKeyDown={
                interactive
                  ? (e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        onSelect!(t.id);
                      }
                    }
                  : undefined
              }
              style={{ cursor: interactive ? "pointer" : "default", outline: "none" }}
              filter={selected ? "url(#node-glow)" : undefined}
            >
              <rect
                width={NODE_W}
                height={NODE_H}
                rx={16}
                fill={selected ? "var(--panel-3)" : "var(--panel-2)"}
                stroke={stroke}
                strokeWidth={selected ? 2 : 1.5}
                strokeDasharray={t.state === "locked" ? "5 5" : undefined}
              />
              <title>{t.title}</title>
              <text x={14} y={27} fontSize={14} fontWeight={650} fill={t.state === "locked" ? "var(--muted)" : "var(--text)"}>
                {clip(t.title)}
              </text>
              <text x={14} y={46} fontSize={12.5} fill="var(--muted)" fontFamily="var(--font-geist-mono), monospace">
                {t.solved}/{t.total}
                {t.due > 0 ? ` · ${t.due} due` : ""}
              </text>
              <rect x={14} y={57} width={NODE_W - 28} height={4} rx={2} fill="var(--line)" />
              <rect x={14} y={57} width={(NODE_W - 28) * ratio} height={4} rx={2} fill={t.state === "done" ? "var(--easy)" : "var(--arc)"} />

              {t.state === "done" && (
                <g transform={`translate(${NODE_W - 32} 33)`}>
                  <circle cx={9} cy={9} r={9} fill="var(--easy)" />
                  <path d="m5 9.5 3 3 5-6" stroke="var(--arc-ink)" strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
                </g>
              )}
              {t.state === "locked" && (
                <g transform={`translate(${NODE_W - 30} 34)`} stroke="var(--faint)" strokeWidth={1.6} fill="none" strokeLinecap="round">
                  <rect x={1} y={7} width={12} height={9} rx={2} />
                  <path d="M3.5 7V5a3.5 3.5 0 0 1 7 0v2" />
                </g>
              )}
              {focusId === t.id && t.state !== "done" && (
                <g transform={`translate(${NODE_W - 64} -10)`}>
                  <rect width={58} height={20} rx={10} fill="var(--ember)" />
                  <text x={29} y={14} textAnchor="middle" fontSize={11.5} fontWeight={700} fill="#2a1105">
                    FOCUS
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
