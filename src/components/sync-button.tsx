"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function SyncButton({ hasHandles }: { hasHandles: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  async function sync() {
    setBusy(true);
    setNote(null);
    try {
      const res = await fetch("/api/v1/sync", { method: "POST" });
      const json = await res.json();
      if (!res.ok) {
        setNote(json.error?.message ?? "Sync failed.");
      } else {
        const failed = Object.entries(json.data.results as Record<string, { status: string; message?: string }>)
          .filter(([, r]) => r.status === "error")
          .map(([name, r]) => `${name}: ${r.message}`);
        const added = json.data.newlySolved as number;
        setNote(
          [added ? `${added} new solve${added === 1 ? "" : "s"} found.` : "Up to date.", ...failed].join(" "),
        );
        router.refresh();
      }
    } catch {
      setNote("Network error. Try again.");
    }
    setBusy(false);
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button className="btn btn-ghost" onClick={sync} disabled={busy || !hasHandles}>
        {busy ? "Syncing…" : "Sync now"}
      </button>
      {!hasHandles && <span className="text-sm text-muted">Add a handle in Settings first.</span>}
      {note && (
        <span role="status" className="text-sm text-muted">
          {note}
        </span>
      )}
    </div>
  );
}
