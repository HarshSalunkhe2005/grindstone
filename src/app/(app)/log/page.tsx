import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { loadUserContext } from "@/lib/data";
import { ROUND_LABEL, type Round } from "@/lib/log";
import { LogClient, type LogEntry } from "./log-client";

export const metadata: Metadata = { title: "Interview log" };

export default async function LogPage() {
  const { tz } = await loadUserContext();
  const supabase = await createClient();
  const { data } = await supabase
    .from("interview_log")
    .select("id, company, round, question, notes, asked_on")
    .order("asked_on", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(500);
  const entries = ((data ?? []) as Omit<LogEntry, "roundLabel">[]).map((e) => ({ ...e, roundLabel: ROUND_LABEL[e.round as Round] ?? "Other" }));
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: tz }).format(new Date());

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-4xl font-semibold sm:text-5xl">Interview log</h1>
        <p className="mt-2 max-w-xl text-muted">
          Write down every question you meet in a test, interview or mock, while you still remember it. Private to you. Patterns show up faster than you expect.
        </p>
      </div>
      <LogClient entries={entries} today={today} />
    </div>
  );
}
