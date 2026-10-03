"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icon, DIFF_TEXT } from "@/components/ui";
import { sparksFromElement } from "@/components/spark-layer";
import { toast } from "@/components/toast";
import type { Difficulty } from "@/lib/insights";
import { softRefresh } from "@/lib/refresh";
import { scheduleReview, type Rating } from "@/lib/review";

export interface DueItem {
  problemId: number;
  title: string;
  url: string;
  difficulty: Difficulty;
  topic: string;
  stage: number;
  notes: string | null;
  solvedAt: string;
}

const RATINGS: { rating: Rating; label: string; tone: string }[] = [
  { rating: "again", label: "Forgot", tone: "hover:border-hard hover:text-hard" },
  { rating: "good", label: "Got it", tone: "hover:border-arc hover:text-arc" },
  { rating: "easy", label: "Easy", tone: "hover:border-easy hover:text-easy" },
];

function nextLabel(stage: number, rating: Rating): string {
  const out = scheduleReview(stage, rating);
  if (out.mastered) return "mastered";
  const days = Math.round((out.nextReviewAt!.getTime() - Date.now()) / 86_400_000);
  return `back in ${days}d`;
}

function ago(iso: string): string {
  const days = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 86_400_000));
  return days === 0 ? "today" : days === 1 ? "yesterday" : `${days} days ago`;
}

export function ReviewQueue({ items, total }: { items: DueItem[]; total: number }) {
  const router = useRouter();
  const [gone, setGone] = useState<Set<number>>(new Set());
  const [busy, setBusy] = useState<number | null>(null);

  async function rate(item: DueItem, rating: Rating, button: HTMLElement) {
    setBusy(item.problemId);
    try {
      const res = await fetch("/api/v1/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ problemId: item.problemId, rating }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.error?.message ?? "Could not save the review");
      if (rating !== "again") sparksFromElement(button, rating === "easy" ? 1.2 : 0.8);
      toast(
        json.data.mastered ? `Mastered: ${item.title}` : rating === "again" ? `${item.title} goes back to day one` : `${item.title} ${nextLabel(item.stage, rating)}`,
        rating === "again" ? "info" : "win",
      );
      setGone((g) => new Set(g).add(item.problemId));
      softRefresh(router);
    } catch (e) {
      toast(e instanceof Error ? e.message : "Could not save the review", "error");
    }
    setBusy(null);
  }

  const visible = items.filter((i) => !gone.has(i.problemId));
  const hidden = Math.max(0, total - items.length);

  if (visible.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-line-strong px-4 py-8 text-center text-sm text-muted">
        Nothing to revise right now. {hidden > 0 ? `${hidden} more are waiting.` : "New solves come back after a day."}
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {visible.map((item) => (
        <li key={item.problemId} className="rise rounded-xl border border-line bg-panel-2 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <a href={item.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 font-medium hover:underline">
                {item.title} <Icon name="external" size={13} className="text-faint" />
              </a>
              <p className="mt-0.5 text-xs text-faint">
                {item.topic} · solved {ago(item.solvedAt)} · <span className={`capitalize ${DIFF_TEXT[item.difficulty]}`}>{item.difficulty}</span>
              </p>
            </div>
            <span className="num text-xs text-faint">rung {item.stage + 1} of 4</span>
          </div>

          {item.notes && <p className="mt-3 rounded-lg bg-bg px-3 py-2 text-sm leading-6 text-muted">{item.notes}</p>}

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="mr-1 text-xs text-faint">Try it from memory, then rate:</span>
            {RATINGS.map((r) => (
              <button
                key={r.rating}
                type="button"
                disabled={busy === item.problemId}
                onClick={(e) => rate(item, r.rating, e.currentTarget)}
                className={`btn btn-quiet btn-sm ${r.tone}`}
              >
                {r.label}
                <span className="text-[0.7rem] font-normal text-faint">{nextLabel(item.stage, r.rating)}</span>
              </button>
            ))}
          </div>
        </li>
      ))}
      {hidden > 0 && <li className="text-center text-xs text-faint">+{hidden} more waiting. Clear these first.</li>}
    </ul>
  );
}
