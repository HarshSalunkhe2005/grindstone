"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Difficulty } from "@/lib/data";

const DIFF_STYLE: Record<Difficulty, string> = {
  easy: "text-easy",
  medium: "text-medium",
  hard: "text-hard",
};

export function ProblemRow({
  id,
  title,
  url,
  difficulty,
  solved: initial,
  hint,
}: {
  id: number;
  title: string;
  url: string;
  difficulty: Difficulty;
  solved: boolean;
  hint?: string;
}) {
  const router = useRouter();
  const [solved, setSolved] = useState(initial);
  const [error, setError] = useState(false);
  const [, startTransition] = useTransition();

  async function toggle() {
    const next = !solved;
    setSolved(next);
    setError(false);
    try {
      const res = await fetch("/api/v1/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ problemId: id, solved: next }),
      });
      if (!res.ok) throw new Error();
      startTransition(() => router.refresh());
    } catch {
      setSolved(!next);
      setError(true);
    }
  }

  return (
    <li className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-surface-2">
      <button
        role="checkbox"
        aria-checked={solved}
        aria-label={`Mark ${title} as ${solved ? "not solved" : "solved"}`}
        onClick={toggle}
        className={`grid size-5 shrink-0 place-items-center rounded-md border transition-colors ${
          solved ? "border-spark bg-spark text-spark-ink" : "border-line hover:border-muted"
        }`}
      >
        {solved && (
          <svg viewBox="0 0 12 12" className="size-3" aria-hidden>
            <path d="M2.5 6.5l2.5 2.5 4.5-5.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>
      <div className="min-w-0 flex-1">
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className={`text-sm hover:underline ${solved ? "text-muted line-through" : ""}`}
        >
          {title}
        </a>
        {hint && <p className="text-xs text-muted">{hint}</p>}
      </div>
      {error && <span className="text-xs text-hard">Could not save</span>}
      <span className={`text-xs font-medium capitalize ${DIFF_STYLE[difficulty]}`}>{difficulty}</span>
    </li>
  );
}
