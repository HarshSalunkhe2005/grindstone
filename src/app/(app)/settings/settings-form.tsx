"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui";
import { toast } from "@/components/toast";
import { GOALS, LANGUAGES, TIMEZONES } from "@/lib/options";

interface Values {
  displayName: string;
  username: string;
  language: string;
  dailyGoal: number;
  timezone: string;
  targetDate: string;
  leetcodeHandle: string;
  codeforcesHandle: string;
  githubHandle: string;
  leaderboardVisible: boolean;
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm text-muted">{label}</span>
      {children}
      {hint && <span className="block text-xs text-faint">{hint}</span>}
    </label>
  );
}

export function SettingsForm({ initial }: { initial: Values }) {
  const router = useRouter();
  const [v, setV] = useState(initial);
  const [busy, setBusy] = useState(false);

  const text = (key: keyof Values) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setV({ ...v, [key]: e.target.value });
  const zones = TIMEZONES.includes(v.timezone as (typeof TIMEZONES)[number]) ? TIMEZONES : [v.timezone, ...TIMEZONES];

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetch("/api/v1/me", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(v) });
      const json = await res.json();
      if (!res.ok) toast(json.error?.message ?? "Could not save.", "error");
      else {
        toast("Settings saved.", "win");
        router.refresh();
      }
    } catch {
      toast("Network error. Try again.", "error");
    }
    setBusy(false);
  }

  return (
    <form onSubmit={save} className="space-y-6">
      <section className="card space-y-5 p-6">
        <h2 className="font-display text-xl font-semibold">You</h2>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Display name">
            <input className="input" value={v.displayName} onChange={text("displayName")} maxLength={60} />
          </Field>
          <Field label="Username" hint="3-20 characters: letters, numbers, underscore.">
            <input className="input" value={v.username} onChange={text("username")} maxLength={20} autoCapitalize="none" />
          </Field>
        </div>
      </section>

      <section className="card space-y-5 p-6">
        <h2 className="font-display text-xl font-semibold">Practice</h2>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Solving language">
            <select className="input" value={v.language} onChange={text("language")}>
              {LANGUAGES.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Placement target date" hint="Powers the countdown on Today.">
            <input className="input" type="date" value={v.targetDate} onChange={text("targetDate")} />
          </Field>
        </div>
        <div>
          <p className="mb-2 text-sm text-muted">Daily goal: new problems per day</p>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Daily goal">
            {GOALS.map((g) => (
              <button key={g} type="button" className="chip num !min-h-10 !px-4" aria-pressed={v.dailyGoal === g} onClick={() => setV({ ...v, dailyGoal: g })}>
                {g}
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-faint">Revisions are on top of this. A small goal you never miss beats a big one you do.</p>
        </div>
        <Field label="Timezone" hint="Decides when your day (and your streak) rolls over.">
          <select className="input" value={v.timezone} onChange={text("timezone")}>
            {zones.map((z) => (
              <option key={z} value={z}>
                {z.replace("_", " ")}
              </option>
            ))}
          </select>
        </Field>
      </section>

      <section className="card space-y-5 p-6">
        <div>
          <h2 className="font-display text-xl font-semibold">Connected platforms</h2>
          <p className="mt-1 text-sm text-muted">Public usernames only. Grindstone reads your public stats and never asks for a password.</p>
        </div>
        <div className="grid gap-5 sm:grid-cols-3">
          <Field label="LeetCode">
            <input className="input" value={v.leetcodeHandle} onChange={text("leetcodeHandle")} maxLength={40} autoCapitalize="none" />
          </Field>
          <Field label="Codeforces">
            <input className="input" value={v.codeforcesHandle} onChange={text("codeforcesHandle")} maxLength={40} autoCapitalize="none" />
          </Field>
          <Field label="GitHub">
            <input className="input" value={v.githubHandle} onChange={text("githubHandle")} maxLength={40} autoCapitalize="none" />
          </Field>
        </div>
      </section>

      <section className="card flex flex-wrap items-center justify-between gap-4 p-6">
        <div className="max-w-md">
          <h2 className="font-display text-xl font-semibold">Friends leaderboard</h2>
          <p className="mt-1 text-sm text-muted">
            When on, friends who follow your username can see your name, XP and solved count. Nothing else, and you can turn it off any time. You need a username first.
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={v.leaderboardVisible}
          aria-label="Show me on friends' leaderboards"
          onClick={() => setV({ ...v, leaderboardVisible: !v.leaderboardVisible })}
          className="group grid h-11 w-16 place-items-center"
        >
          <span className={`relative h-7 w-12 rounded-full border transition-colors ${v.leaderboardVisible ? "border-ember bg-ember" : "border-line-strong bg-bg"}`}>
            <span className={`absolute top-0.5 size-5 rounded-full transition-all ${v.leaderboardVisible ? "left-6 bg-[#2a1105]" : "left-0.5 bg-muted"}`} />
          </span>
        </button>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <button className="btn btn-arc" disabled={busy}>
          {busy ? "Saving…" : "Save changes"}
        </button>
        <a href="/api/v1/export" className="btn btn-quiet btn-sm">
          <Icon name="download" size={14} /> Export my data
        </a>
      </div>
    </form>
  );
}
