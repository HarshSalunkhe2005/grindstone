"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon, WheelArt, DIFF_TEXT } from "@/components/ui";
import { fireSparks } from "@/components/spark-layer";
import { toast } from "@/components/toast";
import { MOCK_LENGTHS, mockScore, msLeft } from "@/lib/mock";
import type { Difficulty } from "@/lib/insights";

interface MockProblem {
  id: number;
  title: string;
  url: string;
  difficulty: Difficulty;
  topic: string;
}

async function api(method: "POST" | "PATCH", body: unknown) {
  const res = await fetch("/api/v1/mock", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const json = await res.json().catch(() => null);
  if (!res.ok) throw new Error(json?.error?.message ?? "Something went wrong");
  return json.data;
}

export function MockStart() {
  const router = useRouter();
  const [busy, setBusy] = useState<number | null>(null);

  async function start(minutes: number) {
    setBusy(minutes);
    try {
      await api("POST", { minutes });
      router.refresh();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Could not start the mock", "error");
    }
    setBusy(null);
  }

  return (
    <section className="card card-hero relative overflow-hidden p-6 sm:p-8" aria-labelledby="start-title">
      <WheelArt className="pointer-events-none absolute -bottom-28 -right-20 size-80 opacity-70" sparks={false} />
      <h2 id="start-title" className="font-display relative text-2xl font-semibold">
        Pick a round
      </h2>
      <p className="relative mt-1 max-w-md text-muted">The clock starts the moment you begin. Close the tab and it keeps running.</p>
      <div className="relative mt-6 grid gap-3 sm:grid-cols-3">
        {MOCK_LENGTHS.map((l) => (
          <button key={l.minutes} type="button" disabled={busy !== null} onClick={() => start(l.minutes)} className="btn btn-quiet h-auto flex-col items-start gap-1 !py-4 text-left">
            <span className="num font-display text-3xl font-semibold">{l.minutes}<span className="text-base text-muted"> min</span></span>
            <span className="text-sm">{l.label}</span>
            <span className="text-xs font-normal capitalize text-muted">{l.shape.join(" + ")}</span>
          </button>
        ))}
      </div>
    </section>
  );
}

function clock(ms: number) {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return `${h > 0 ? `${h}:` : ""}${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function MockRunner({
  id,
  startedAt,
  minutes,
  initialSolved,
  problems,
}: {
  id: string;
  startedAt: string;
  minutes: number;
  initialSolved: number[];
  problems: MockProblem[];
}) {
  const router = useRouter();
  const [solved, setSolved] = useState<number[]>(initialSolved);
  const [left, setLeft] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const finishRef = useRef<HTMLButtonElement>(null);

  // The clock is derived from the server's start time, so reloads and other tabs agree.
  useEffect(() => {
    const tick = () => setLeft(msLeft(startedAt, minutes));
    tick();
    const t = window.setInterval(tick, 1000);
    return () => window.clearInterval(t);
  }, [startedAt, minutes]);

  async function toggle(problemId: number) {
    const next = solved.includes(problemId) ? solved.filter((s) => s !== problemId) : [...solved, problemId];
    setSolved(next);
    try {
      await api("PATCH", { id, solvedIds: next });
    } catch (e) {
      setSolved(solved);
      toast(e instanceof Error ? e.message : "Could not save", "error");
    }
  }

  async function finish() {
    setBusy(true);
    try {
      await api("PATCH", { id, solvedIds: solved, finish: true });
      const box = finishRef.current?.getBoundingClientRect();
      if (box && solved.length > 0) fireSparks(box.left + box.width / 2, box.top, 1.4);
      toast(solved.length ? `Round done: ${solved.length} of ${problems.length} solved` : "Round ended. Review what tripped you up.", solved.length ? "win" : "info");
      router.refresh();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Could not finish the round", "error");
      setBusy(false);
    }
  }

  const over = left !== null && left <= 0;
  const low = left !== null && left > 0 && left < 5 * 60_000;
  const score = Math.round(mockScore(problems, solved) * 100);

  return (
    <section className="card card-hero p-6 sm:p-8" aria-label="Mock in progress">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-muted">{over ? "Time is up" : "Time left"}</p>
          <p
            className={`num font-display text-6xl font-semibold leading-none sm:text-7xl ${over ? "text-hard" : low ? "text-ember" : ""}`}
            role="timer"
            aria-live="off"
          >
            {left === null ? "--:--" : clock(left)}
          </p>
        </div>
        <p className="num text-right text-sm text-muted">
          {solved.length} of {problems.length} solved
          <span className="block font-display text-3xl font-semibold text-text">{score}%</span>
        </p>
      </div>

      <ul className="mt-6 divide-y divide-line rounded-xl border border-line bg-bg/40">
        {problems.map((p, i) => {
          const done = solved.includes(p.id);
          return (
            <li key={p.id} className="flex items-center gap-3 px-3 py-1">
              <button
                type="button"
                role="checkbox"
                aria-checked={done}
                aria-label={`Mark ${p.title} as ${done ? "not solved" : "solved"}`}
                onClick={() => toggle(p.id)}
                className="grid size-11 shrink-0 place-items-center"
              >
                <span className={`grid size-6 place-items-center rounded-lg border transition-colors ${done ? "pop border-ember bg-ember text-[#2a1105]" : "border-line-strong"}`}>
                  {done && <Icon name="check" size={14} />}
                </span>
              </button>
              <div className="min-w-0 flex-1 py-2">
                <a href={p.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 font-medium hover:underline">
                  <span className="num text-muted">{i + 1}.</span> {p.title} <Icon name="external" size={13} className="text-muted" />
                </a>
                <p className="text-xs text-muted">{p.topic}</p>
              </div>
              <span className={`text-sm font-medium capitalize ${DIFF_TEXT[p.difficulty]}`}>{p.difficulty}</span>
            </li>
          );
        })}
      </ul>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-md text-sm text-muted">Solve each on LeetCode, then tick it here. Finishing records your solves, awards XP and starts their revision ladder.</p>
        <button ref={finishRef} type="button" disabled={busy} onClick={finish} className={`btn ${over || solved.length === problems.length ? "btn-ember" : "btn-quiet"}`}>
          {busy ? "Saving…" : "Finish round"}
        </button>
      </div>
    </section>
  );
}
