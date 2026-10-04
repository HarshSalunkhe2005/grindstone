"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui";
import { sparksFromElement } from "@/components/spark-layer";
import { toast } from "@/components/toast";
import type { Question } from "@/content/quizzes";

interface Props {
  slug: string;
  initiallyDone: boolean;
  initialScore: number | null;
  nextHref: string;
  questions: Question[];
}

/** The quick check, then completion. The quiz is optional; finishing without it is fine. */
export function CompleteButton({ slug, initiallyDone, initialScore, nextHref, questions }: Props) {
  const router = useRouter();
  const [done, setDone] = useState(initiallyDone);
  const [busy, setBusy] = useState(false);
  const [picked, setPicked] = useState<(number | null)[]>(() => questions.map(() => null));
  const [checked, setChecked] = useState(false);
  const [score, setScore] = useState<number | null>(initialScore);

  const total = questions.length;
  const live = checked ? picked.filter((p, i) => p === questions[i].answer).length : score;

  function check() {
    const s = picked.filter((p, i) => p === questions[i].answer).length;
    setChecked(true);
    setScore(s);
  }

  async function save(next: boolean, el: HTMLElement) {
    setBusy(true);
    try {
      const res = await fetch("/api/v1/lessons", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, done: next, ...(next && score !== null ? { quizScore: score } : {}) }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.error?.message ?? "Could not save your progress");
      setDone(next);
      if (next) {
        sparksFromElement(el, 1);
        toast("Lesson done", "win");
      }
      router.refresh();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Could not save your progress", "error");
    }
    setBusy(false);
  }

  return (
    <div className="space-y-6">
      {total > 0 && (
        <section className="card p-6" aria-labelledby="quick-check">
          <div className="flex items-baseline justify-between gap-3">
            <h2 id="quick-check" className="font-display text-xl font-semibold">
              Quick check
            </h2>
            {live !== null && (
              <span className={`num text-sm ${live === total ? "text-ember" : "text-muted"}`}>
                {live} of {total}
              </span>
            )}
          </div>
          <ol className="mt-4 space-y-6">
            {questions.map((q, qi) => (
              <li key={qi}>
                <p className="font-medium leading-6">{q.q}</p>
                <div className="mt-3 grid gap-2 sm:grid-cols-2" role="radiogroup" aria-label={q.q}>
                  {q.options.map((opt, oi) => {
                    const isPicked = picked[qi] === oi;
                    const isRight = checked && oi === q.answer;
                    const isWrong = checked && isPicked && oi !== q.answer;
                    return (
                      <button
                        key={oi}
                        type="button"
                        role="radio"
                        aria-checked={isPicked}
                        disabled={checked}
                        onClick={() => setPicked((p) => p.map((v, i) => (i === qi ? oi : v)))}
                        className={`min-h-11 rounded-xl border px-3.5 py-2.5 text-left text-sm transition-colors ${
                          isRight
                            ? "border-easy bg-easy/10 text-text"
                            : isWrong
                              ? "border-hard bg-hard/10 text-text"
                              : isPicked
                                ? "border-arc bg-arc-soft text-text"
                                : "border-line-strong text-muted hover:border-faint hover:text-text"
                        }`}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
                {checked && <p className="mt-2 text-sm text-muted">{q.why}</p>}
              </li>
            ))}
          </ol>
          {!checked && (
            <button type="button" className="btn btn-quiet mt-5" disabled={picked.some((p) => p === null)} onClick={check}>
              Check answers
            </button>
          )}
          {checked && live !== null && live < total && (
            <p className="mt-4 text-sm text-ember">Worth a second read of the key points before you move on. It is marked as shaky on your Learn page.</p>
          )}
        </section>
      )}

      {!done ? (
        <button type="button" disabled={busy} className="btn btn-ember" onClick={(e) => save(true, e.currentTarget)}>
          <Icon name="check" size={16} /> Mark as done
        </button>
      ) : (
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" className="btn btn-arc" onClick={() => router.push(nextHref)}>
            Next lesson <Icon name="arrow" size={16} />
          </button>
          <button type="button" disabled={busy} className="btn btn-quiet btn-sm" onClick={(e) => save(false, e.currentTarget)}>
            Undo
          </button>
        </div>
      )}
    </div>
  );
}
