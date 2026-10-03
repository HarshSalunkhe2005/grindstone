"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Values = {
  displayName: string;
  username: string;
  language: string;
  leetcodeHandle: string;
  codeforcesHandle: string;
  githubHandle: string;
  targetDate: string;
};

const LANGUAGES = [
  ["python", "Python"],
  ["java", "Java"],
  ["cpp", "C++"],
];

export function SettingsForm({ initial }: { initial: Values }) {
  const router = useRouter();
  const [v, setV] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<{ kind: "ok" | "error"; text: string } | null>(null);

  const set = (key: keyof Values) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setV({ ...v, [key]: e.target.value });

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setNote(null);
    try {
      const res = await fetch("/api/v1/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(v),
      });
      const json = await res.json();
      if (!res.ok) {
        setNote({ kind: "error", text: json.error?.message ?? "Could not save." });
      } else {
        setNote({ kind: "ok", text: "Saved." });
        router.refresh();
      }
    } catch {
      setNote({ kind: "error", text: "Network error. Try again." });
    }
    setBusy(false);
  }

  return (
    <form onSubmit={save} className="card space-y-5 p-6">
      <Field label="Display name">
        <input className="input" value={v.displayName} onChange={set("displayName")} maxLength={60} />
      </Field>
      <Field label="Username" hint="3-20 characters: letters, numbers, underscore.">
        <input className="input" value={v.username} onChange={set("username")} maxLength={20} autoCapitalize="none" />
      </Field>
      <Field label="Solving language">
        <select className="input" value={v.language} onChange={set("language")}>
          {LANGUAGES.map(([id, name]) => (
            <option key={id} value={id}>
              {name}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Placement target date" hint="Optional. Powers the countdown on Today.">
        <input className="input" type="date" value={v.targetDate} onChange={set("targetDate")} />
      </Field>

      <div className="space-y-4 border-t border-line pt-5">
        <p className="text-sm font-medium">Connected platforms</p>
        <Field label="LeetCode username">
          <input className="input" value={v.leetcodeHandle} onChange={set("leetcodeHandle")} maxLength={40} autoCapitalize="none" />
        </Field>
        <Field label="Codeforces handle">
          <input className="input" value={v.codeforcesHandle} onChange={set("codeforcesHandle")} maxLength={40} autoCapitalize="none" />
        </Field>
        <Field label="GitHub username">
          <input className="input" value={v.githubHandle} onChange={set("githubHandle")} maxLength={40} autoCapitalize="none" />
        </Field>
      </div>

      <div className="flex items-center gap-4">
        <button className="btn btn-spark" disabled={busy}>
          {busy ? "Saving…" : "Save changes"}
        </button>
        {note && (
          <span role="status" className={`text-sm ${note.kind === "ok" ? "text-easy" : "text-hard"}`}>
            {note.text}
          </span>
        )}
      </div>
    </form>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm text-muted">{label}</span>
      {children}
      {hint && <span className="block text-xs text-muted">{hint}</span>}
    </label>
  );
}
