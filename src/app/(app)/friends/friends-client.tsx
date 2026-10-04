"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/components/toast";

export interface BoardRow {
  username: string | null;
  display_name: string | null;
  xp: number;
  solved: number;
  is_me: boolean;
}

async function api(method: "POST" | "DELETE", username: string) {
  const res = await fetch("/api/v1/friends", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username }) });
  const json = await res.json().catch(() => null);
  if (!res.ok) throw new Error(json?.error?.message ?? "Something went wrong");
}

export function FriendsClient({ rows }: { rows: BoardRow[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    try {
      await api("POST", name.trim().replace(/^@/, ""));
      toast("Friend added", "win");
      setName("");
      router.refresh();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Could not add that friend", "error");
    }
    setBusy(false);
  }

  async function remove(username: string) {
    try {
      await api("DELETE", username);
      router.refresh();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Could not remove that friend", "error");
    }
  }

  const top = rows[0]?.xp ?? 0;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <section className="card p-5" aria-labelledby="board-title">
        <h2 id="board-title" className="font-display mb-3 text-xl font-semibold">
          Leaderboard
        </h2>
        <ol className="divide-y divide-line">
          {rows.map((r, i) => (
            <li key={r.username ?? i} className={`grid grid-cols-[2.5rem_1fr_auto] items-center gap-3 rounded-xl px-2 py-3 ${r.is_me ? "bg-ember-soft" : ""}`}>
              <span className={`num font-display text-2xl font-semibold ${i === 0 ? "text-ember" : "text-muted"}`}>{i + 1}</span>
              <div className="min-w-0">
                <p className="truncate font-medium">
                  {r.display_name || r.username || "You"} {r.is_me && <span className="text-sm text-ember">· you</span>}
                </p>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-bg ring-1 ring-line">
                  <div
                    className="h-full w-full rounded-full"
                    style={{ background: "linear-gradient(90deg, #4a5a72, var(--ember))", transform: `scaleX(${top ? r.xp / top : 0})`, transformOrigin: "left center" }}
                  />
                </div>
              </div>
              <div className="flex items-center gap-3 text-right">
                <div>
                  <p className="num font-display text-xl font-semibold">{r.xp}</p>
                  <p className="num text-xs text-muted">{r.solved} solved</p>
                </div>
                {!r.is_me && r.username && (
                  <button type="button" onClick={() => remove(r.username!)} className="min-h-11 px-2 text-sm text-muted underline underline-offset-2 hover:text-text" aria-label={`Unfollow ${r.username}`}>
                    Unfollow
                  </button>
                )}
              </div>
            </li>
          ))}
        </ol>
        {rows.length <= 1 && <p className="pt-4 text-sm text-muted">It is just you for now. Follow a friend by username and race them.</p>}
      </section>

      <aside>
        <form onSubmit={add} className="card space-y-3 p-5">
          <h2 className="font-display text-lg font-semibold">Follow a friend</h2>
          <label className="block space-y-1.5">
            <span className="text-sm text-muted">Their username</span>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} maxLength={21} autoCapitalize="none" autoComplete="off" placeholder="e.g. arjun_m" />
          </label>
          <button className="btn btn-ember w-full" disabled={busy || !name.trim()}>
            {busy ? "Adding…" : "Follow"}
          </button>
          <p className="text-xs text-muted">They need to have switched on the leaderboard in their settings. Following is private; they are not told.</p>
        </form>
      </aside>
    </div>
  );
}
