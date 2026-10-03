"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { DIFF_TEXT, Icon, WheelArt } from "@/components/ui";
import { fireSparks, sparksFromElement } from "@/components/spark-layer";
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

const RATINGS: { rating: Rating; label: string; key: string; tone: string }[] = [
  { rating: "again", label: "Forgot", key: "1", tone: "hover:border-hard hover:text-hard" },
  { rating: "good", label: "Got it", key: "2", tone: "hover:border-arc hover:text-arc" },
  { rating: "easy", label: "Easy", key: "3", tone: "hover:border-easy hover:text-easy" },
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

/**
 * The revision ritual: one problem at a time, "3 of 5", rate with the buttons or
 * the 1 / 2 / 3 keys. Clearing the last one fires a finale.
 */
export function ReviewQueue({ items, total }: { items: DueItem[]; total: number }) {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(0);
  const cardRef = useRef<HTMLLIElement>(null);

  const item = items[index];
  const hidden = Math.max(0, total - items.length);
  const finished = index >= items.length;

  const rate = useCallback(
    async (rating: Rating) => {
      if (!item || busy) return;
      setBusy(true);
      try {
        const res = await fetch("/api/v1/review", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ problemId: item.problemId, rating }),
        });
        const json = await res.json().catch(() => null);
        if (!res.ok) throw new Error(json?.error?.message ?? "Could not save the review");
        const last = index === items.length - 1;
        if (rating !== "again") sparksFromElement(cardRef.current, rating === "easy" ? 1.3 : 0.9);
        if (last) {
          // The finale: a burst from either side of the card.
          const box = cardRef.current?.getBoundingClientRect();
          if (box) {
            fireSparks(box.left + box.width * 0.25, box.top + box.height * 0.5, 1.6);
            window.setTimeout(() => fireSparks(box.left + box.width * 0.75, box.top + box.height * 0.5, 1.6), 140);
          }
        }
        toast(
          json.data.mastered ? `Mastered: ${item.title}` : rating === "again" ? `${item.title} goes back to day one` : `${item.title} ${nextLabel(item.stage, rating)}`,
          rating === "again" ? "info" : "win",
        );
        setDone((d) => d + 1);
        setIndex((i) => i + 1);
        softRefresh(router);
      } catch (e) {
        toast(e instanceof Error ? e.message : "Could not save the review", "error");
      }
      setBusy(false);
    },
    [item, busy, index, items.length, router],
  );

  // 1 / 2 / 3 rate the current card, unless the user is typing somewhere.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      if (target && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName))) return;
      const hit = RATINGS.find((r) => r.key === e.key);
      if (hit) {
        e.preventDefault();
        void rate(hit.rating);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [rate]);

  if (finished) {
    return (
      <div className="card card-hero relative overflow-hidden px-6 py-10 text-center">
        <WheelArt className="pointer-events-none absolute -bottom-24 -right-24 size-64 opacity-60" />
        <p className="font-display relative text-2xl font-semibold">{done > 0 ? `${done} sharpened.` : "Nothing to revise."}</p>
        <p className="relative mx-auto mt-2 max-w-sm text-sm text-muted">
          {hidden > 0
            ? `${hidden} more come up soon. Clear today's new problems in the meantime.`
            : done > 0
              ? "Revision cleared. Each one is back on the wheel at a longer interval."
              : "New solves come back after a day."}
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-3 flex items-center gap-3" aria-label={`Revision ${index + 1} of ${items.length}`}>
        <div className="flex flex-1 gap-1.5" aria-hidden>
          {items.map((it, i) => (
            <span
              key={it.problemId}
              className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${i < index ? "bg-ember" : i === index ? "bg-arc" : "bg-line-strong"}`}
            />
          ))}
        </div>
        <span className="num text-sm text-muted">
          {index + 1} of {items.length}
        </span>
      </div>

      <ul>
        <li key={item.problemId} ref={cardRef} className="slide-in card p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-display inline-flex min-h-11 items-center gap-2 text-xl font-semibold hover:underline"
              >
                {item.title} <Icon name="external" size={15} className="text-faint" />
              </a>
              <p className="text-sm text-faint">
                {item.topic} · solved {ago(item.solvedAt)} · <span className={`capitalize ${DIFF_TEXT[item.difficulty]}`}>{item.difficulty}</span>
              </p>
            </div>
            <span className="num rounded-full border border-line-strong px-2.5 py-1 text-xs text-muted">rung {item.stage + 1} of 4</span>
          </div>

          {item.notes && <p className="well mt-4 px-3.5 py-2.5 text-sm leading-6 text-muted">{item.notes}</p>}

          <p className="mt-5 text-sm text-muted">Try it from memory, then rate how it went.</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            {RATINGS.map((r) => (
              <button
                key={r.rating}
                type="button"
                disabled={busy}
                onClick={() => rate(r.rating)}
                className={`btn btn-quiet h-auto flex-col items-start gap-1 !py-3 ${r.tone}`}
              >
                <span className="flex w-full items-center justify-between">
                  {r.label}
                  <span className="kbd hidden sm:inline-grid" aria-hidden>
                    {r.key}
                  </span>
                </span>
                <span className="text-xs font-normal text-faint">{nextLabel(item.stage, r.rating)}</span>
              </button>
            ))}
          </div>
        </li>
      </ul>
      {hidden > 0 && <p className="mt-3 text-center text-xs text-faint">+{hidden} more waiting. Clear these first.</p>}
    </div>
  );
}
