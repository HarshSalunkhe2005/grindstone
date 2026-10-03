"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon, DIFF_TEXT } from "@/components/ui";
import { sparksFromElement } from "@/components/spark-layer";
import { toast } from "@/components/toast";
import { levelFor } from "@/lib/game";
import { softRefresh } from "@/lib/refresh";
import type { Difficulty } from "@/lib/insights";

const XP: Record<Difficulty, number> = { easy: 10, medium: 20, hard: 40 };
const CONF_LABEL = ["Shaky", "Okay", "Solid"];

async function call(path: string, method: string, body: unknown) {
  const res = await fetch(path, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const json = await res.json().catch(() => null);
  if (!res.ok) throw new Error(json?.error?.message ?? "Request failed");
  return json?.data;
}

export function ProblemRow({
  id,
  title,
  url,
  difficulty,
  solved: initialSolved,
  confidence: initialConfidence = null,
  notes: initialNotes = null,
  hint,
}: {
  id: number;
  title: string;
  url: string;
  difficulty: Difficulty;
  solved: boolean;
  confidence?: number | null;
  notes?: string | null;
  hint?: string;
}) {
  const router = useRouter();
  const box = useRef<HTMLButtonElement>(null);
  const [solved, setSolved] = useState(initialSolved);
  const [confidence, setConfidence] = useState(initialConfidence);
  const [notes, setNotes] = useState(initialNotes ?? "");
  const [savedNotes, setSavedNotes] = useState(initialNotes ?? "");
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  async function toggle() {
    const next = !solved;
    setSolved(next);
    try {
      const out = await call("/api/v1/progress", "POST", { problemId: id, solved: next });
      if (next) {
        const after = levelFor(out.xp);
        const before = levelFor(Math.max(0, out.xp - XP[difficulty]));
        const levelUp = after.level > before.level;
        sparksFromElement(box.current, levelUp ? 2.4 : difficulty === "hard" ? 1.6 : 1);
        toast(levelUp ? `Level up: ${after.title}. Your edge just got sharper.` : `+${XP[difficulty]} XP · ${title}`, "win");
      } else {
        setConfidence(null);
        setOpen(false);
      }
      softRefresh(router);
    } catch (e) {
      setSolved(!next);
      toast(e instanceof Error ? e.message : "Could not save", "error");
    }
  }

  async function setConf(value: 1 | 2 | 3) {
    const prev = confidence;
    setConfidence(value);
    try {
      await call("/api/v1/notes", "PATCH", { problemId: id, confidence: value });
      softRefresh(router);
    } catch (e) {
      setConfidence(prev);
      toast(e instanceof Error ? e.message : "Could not save", "error");
    }
  }

  async function saveNotes() {
    if (notes === savedNotes) return;
    setSaving(true);
    try {
      await call("/api/v1/notes", "PATCH", { problemId: id, notes });
      setSavedNotes(notes);
    } catch (e) {
      toast(e instanceof Error ? e.message : "Could not save your notes", "error");
    }
    setSaving(false);
  }

  return (
    <li className="group rounded-xl pr-1 transition-colors hover:bg-panel-2">
      <div className="flex items-center gap-3">
        <button
          ref={box}
          type="button"
          role="checkbox"
          aria-checked={solved}
          aria-label={`Mark ${title} as ${solved ? "not solved" : "solved"}`}
          onClick={toggle}
          className="group/box grid size-11 shrink-0 place-items-center"
        >
          <span
            className={`grid size-6 place-items-center rounded-lg border transition-all duration-150 ${
              solved ? "pop border-arc bg-arc text-arc-ink" : "border-line-strong group-hover/box:border-arc"
            }`}
          >
            {solved && <Icon name="check" size={14} />}
          </span>
        </button>

        <div className="min-w-0 flex-1">
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex min-h-6 items-center text-sm font-medium hover:underline ${solved ? "text-muted" : ""}`}
          >
            {title}
          </a>
          {hint && <p className="truncate text-xs text-faint">{hint}</p>}
        </div>

        {solved && (
          <div className="hidden items-center sm:flex" role="group" aria-label="How well do you remember it?">
            {([1, 2, 3] as const).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setConf(v)}
                aria-pressed={confidence === v}
                title={CONF_LABEL[v - 1]}
                aria-label={CONF_LABEL[v - 1]}
                className="group/dot grid size-11 place-items-center"
              >
                <span
                  className={`size-3 rounded-full border transition-colors ${
                    confidence != null && v <= confidence
                      ? v === 1
                        ? "border-hard bg-hard"
                        : v === 2
                          ? "border-medium bg-medium"
                          : "border-easy bg-easy"
                      : "border-line-strong group-hover/dot:border-faint"
                  }`}
                />
              </button>
            ))}
          </div>
        )}

        {solved && (
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-label={notes ? "Edit your notes" : "Add notes"}
            className={`grid size-11 place-items-center rounded-lg transition-colors hover:bg-panel-3 ${
              notes ? "text-arc" : "text-faint hover:text-text"
            }`}
          >
            <Icon name="note" size={16} />
          </button>
        )}

        <span className={`w-14 text-right text-xs font-medium capitalize ${DIFF_TEXT[difficulty]}`}>{difficulty}</span>
      </div>

      {open && solved && (
        <div className="rise mb-1 ml-9 mt-2 space-y-2 pr-2">
          <label className="block">
            <span className="sr-only">Notes on {title}</span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onBlur={saveNotes}
              maxLength={2000}
              rows={3}
              placeholder="The key insight, the trap you fell into, the complexity…"
              className="input !min-h-0 resize-y py-2.5 text-sm leading-6"
            />
          </label>
          <div className="flex items-center justify-between text-xs text-faint">
            <span>Saved when you click away. Shown again when this problem comes back for revision.</span>
            <span className="num">{saving ? "Saving…" : `${notes.length}/2000`}</span>
          </div>
        </div>
      )}
    </li>
  );
}
