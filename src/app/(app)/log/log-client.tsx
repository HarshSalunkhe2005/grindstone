"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/components/toast";
import { ROUNDS, ROUND_LABEL, type Round } from "@/lib/log";

export interface LogEntry {
  id: string;
  company: string;
  round: Round;
  roundLabel: string;
  question: string;
  notes: string | null;
  asked_on: string;
}

export function LogClient({ entries, today }: { entries: LogEntry[]; today: string }) {
  const router = useRouter();
  const [company, setCompany] = useState("");
  const [round, setRound] = useState<Round>("dsa");
  const [question, setQuestion] = useState("");
  const [notes, setNotes] = useState("");
  const [askedOn, setAskedOn] = useState(today);
  const [busy, setBusy] = useState(false);
  const [filter, setFilter] = useState<string | null>(null);

  const companies = useMemo(() => {
    const m = new Map<string, number>();
    for (const e of entries) m.set(e.company, (m.get(e.company) ?? 0) + 1);
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }, [entries]);
  const shown = filter ? entries.filter((e) => e.company === filter) : entries;

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetch("/api/v1/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ company, round, question, notes, askedOn }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.error?.message ?? "Could not save that entry");
      toast("Logged", "win");
      setQuestion("");
      setNotes("");
      router.refresh();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Could not save that entry", "error");
    }
    setBusy(false);
  }

  async function remove(id: string) {
    try {
      const res = await fetch("/api/v1/log", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
      if (!res.ok) throw new Error("Could not remove that entry");
      router.refresh();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Could not remove that entry", "error");
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[22rem_minmax(0,1fr)]">
      <form onSubmit={add} className="card space-y-4 self-start p-5">
        <h2 className="font-display text-lg font-semibold">Add a question</h2>
        <label className="block space-y-1.5">
          <span className="text-sm text-muted">Company</span>
          <input className="input" value={company} onChange={(e) => setCompany(e.target.value)} maxLength={80} required />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block space-y-1.5">
            <span className="text-sm text-muted">Round</span>
            <select className="input" value={round} onChange={(e) => setRound(e.target.value as Round)}>
              {ROUNDS.map((r) => (
                <option key={r} value={r}>
                  {ROUND_LABEL[r]}
                </option>
              ))}
            </select>
          </label>
          <label className="block space-y-1.5">
            <span className="text-sm text-muted">Date</span>
            <input className="input" type="date" value={askedOn} onChange={(e) => setAskedOn(e.target.value)} required />
          </label>
        </div>
        <label className="block space-y-1.5">
          <span className="text-sm text-muted">The question</span>
          <textarea className="input !min-h-28 resize-y py-2.5 leading-6" value={question} onChange={(e) => setQuestion(e.target.value)} maxLength={2000} required />
        </label>
        <label className="block space-y-1.5">
          <span className="text-sm text-muted">What happened (optional)</span>
          <textarea className="input !min-h-20 resize-y py-2.5 leading-6" value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={4000} placeholder="Your approach, where you got stuck, what you would do now" />
        </label>
        <button className="btn btn-ember w-full" disabled={busy}>
          {busy ? "Saving…" : "Save to log"}
        </button>
      </form>

      <section aria-labelledby="entries-title" className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <h2 id="entries-title" className="font-display mr-2 text-xl font-semibold">
            {entries.length} logged
          </h2>
          {companies.slice(0, 8).map(([c, n]) => (
            <button key={c} type="button" className="chip" aria-pressed={filter === c} onClick={() => setFilter(filter === c ? null : c)}>
              {c} <span className="num text-xs">{n}</span>
            </button>
          ))}
        </div>
        {shown.length === 0 ? (
          <div className="card p-8 text-center text-sm text-muted">Nothing here yet. After your next test or interview, write down what you were asked.</div>
        ) : (
          <ul className="space-y-3">
            {shown.map((e) => (
              <li key={e.id} className="card p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-display text-lg font-semibold">{e.company}</p>
                  <p className="num text-sm text-muted">
                    {e.roundLabel} · {e.asked_on}
                  </p>
                </div>
                <p className="mt-2 whitespace-pre-wrap leading-7">{e.question}</p>
                {e.notes && <p className="well mt-3 whitespace-pre-wrap px-3.5 py-2.5 text-sm leading-6 text-muted">{e.notes}</p>}
                <button type="button" onClick={() => remove(e.id)} className="mt-2 min-h-11 text-sm text-muted underline underline-offset-2 hover:text-text">
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
