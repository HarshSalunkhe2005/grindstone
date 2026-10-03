"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui";
import { GOALS, LANGUAGES, TIMEZONES } from "@/lib/options";

const STEPS = ["Language", "Plan", "Profiles"] as const;

function weeksFromNow(weeks: number) {
  const d = new Date();
  d.setDate(d.getDate() + weeks * 7);
  return d.toISOString().slice(0, 10);
}

export function WelcomeFlow({ name }: { name: string }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [language, setLanguage] = useState("python");
  const [goal, setGoal] = useState(3);
  const [target, setTarget] = useState("");
  const [tz, setTz] = useState(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Kolkata";
    } catch {
      return "Asia/Kolkata";
    }
  });
  const [handles, setHandles] = useState({ leetcode: "", codeforces: "", github: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function finish() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          language,
          dailyGoal: goal,
          timezone: tz,
          targetDate: target,
          leetcodeHandle: handles.leetcode,
          codeforcesHandle: handles.codeforces,
          githubHandle: handles.github,
          onboarded: true,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message ?? "Could not save.");
      router.replace("/today");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setBusy(false);
    }
  }

  const zones = TIMEZONES.includes(tz as (typeof TIMEZONES)[number]) ? TIMEZONES : [tz, ...TIMEZONES];

  return (
    <div className="card rise space-y-6 p-7">
      <ol className="flex gap-2" aria-label="Setup progress">
        {STEPS.map((s, i) => (
          <li key={s} className="flex-1" aria-current={i === step ? "step" : undefined}>
            <div className={`h-1 rounded-full ${i <= step ? "bg-arc" : "bg-line"}`} />
            <span className={`mt-1.5 block text-xs ${i === step ? "text-text" : "text-faint"}`}>{s}</span>
          </li>
        ))}
      </ol>

      {step === 0 && (
        <div className="space-y-5">
          <div>
            <h1 className="font-display text-3xl font-semibold">{name ? `Welcome, ${name}.` : "Welcome."}</h1>
            <p className="mt-2 text-muted">Let&apos;s set your edge. What will you solve in?</p>
          </div>
          <div className="grid grid-cols-3 gap-3" role="group" aria-label="Language">
            {LANGUAGES.map((l) => (
              <button
                key={l.id}
                type="button"
                aria-pressed={language === l.id}
                onClick={() => setLanguage(l.id)}
                className={`rounded-2xl border px-3 py-6 text-center font-display text-xl font-semibold transition-all ${
                  language === l.id ? "border-arc bg-arc-soft text-arc" : "border-line-strong hover:border-faint"
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="space-y-6">
          <div>
            <h1 className="font-display text-3xl font-semibold">Your plan</h1>
            <p className="mt-2 text-muted">Small and steady wins. You can change all of this later.</p>
          </div>
          <div>
            <p className="mb-2 text-sm text-muted">New problems per day</p>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Daily goal">
              {GOALS.map((g) => (
                <button key={g} type="button" className="chip num !min-h-10 !px-4" aria-pressed={goal === g} onClick={() => setGoal(g)}>
                  {g}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 text-sm text-muted">When do placements start? (optional)</p>
            <div className="mb-2 flex flex-wrap gap-2">
              {[8, 12, 16].map((w) => (
                <button key={w} type="button" className="chip" aria-pressed={target === weeksFromNow(w)} onClick={() => setTarget(weeksFromNow(w))}>
                  In {w} weeks
                </button>
              ))}
            </div>
            <input className="input" type="date" value={target} onChange={(e) => setTarget(e.target.value)} aria-label="Target date" />
          </div>
          <label className="block space-y-1.5">
            <span className="text-sm text-muted">Timezone, so your streak rolls over at midnight your time</span>
            <select className="input" value={tz} onChange={(e) => setTz(e.target.value)}>
              {zones.map((z) => (
                <option key={z} value={z}>
                  {z.replace("_", " ")}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-5">
          <div>
            <h1 className="font-display text-3xl font-semibold">Connect your profiles</h1>
            <p className="mt-2 text-muted">Optional. Public usernames only: recent LeetCode solves then tick themselves.</p>
          </div>
          {(["leetcode", "codeforces", "github"] as const).map((k) => (
            <label key={k} className="block space-y-1.5">
              <span className="text-sm capitalize text-muted">{k}</span>
              <input
                className="input"
                value={handles[k]}
                onChange={(e) => setHandles({ ...handles, [k]: e.target.value })}
                maxLength={40}
                autoCapitalize="none"
                placeholder="username"
              />
            </label>
          ))}
          {error && (
            <p role="alert" className="text-sm text-hard">
              {error}
            </p>
          )}
        </div>
      )}

      <div className="flex items-center justify-between gap-3 pt-2">
        <button type="button" className="text-sm text-faint hover:text-text disabled:invisible" disabled={step === 0 || busy} onClick={() => setStep(step - 1)}>
          Back
        </button>
        {step < 2 ? (
          <button type="button" className="btn btn-arc" onClick={() => setStep(step + 1)}>
            Continue <Icon name="arrow" size={16} />
          </button>
        ) : (
          <button type="button" className="btn btn-arc" onClick={finish} disabled={busy}>
            {busy ? "Starting…" : "Light the wheel"} {!busy && <Icon name="spark" size={16} />}
          </button>
        )}
      </div>
    </div>
  );
}
