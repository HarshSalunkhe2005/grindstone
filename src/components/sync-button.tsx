"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui";
import { toast } from "@/components/toast";

export function SyncButton({ hasHandles }: { hasHandles: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function sync() {
    setBusy(true);
    try {
      const res = await fetch("/api/v1/sync", { method: "POST" });
      const json = await res.json();
      if (!res.ok) {
        toast(json.error?.message ?? "Sync failed.", "error");
      } else {
        const failed = Object.entries(json.data.results as Record<string, { status: string; message?: string }>)
          .filter(([, r]) => r.status === "error")
          .map(([name, r]) => `${name}: ${r.message}`);
        const added = json.data.newlySolved as number;
        toast(added ? `${added} new solve${added === 1 ? "" : "s"} found.` : "Everything is up to date.", added ? "win" : "info");
        failed.forEach((f) => toast(f, "error"));
        router.refresh();
      }
    } catch {
      toast("Network error. Try again.", "error");
    }
    setBusy(false);
  }

  return (
    <div className="flex items-center gap-3">
      <button className="btn btn-quiet btn-sm" onClick={sync} disabled={busy || !hasHandles}>
        <Icon name="refresh" size={14} className={busy ? "animate-spin" : ""} />
        {busy ? "Syncing…" : "Sync now"}
      </button>
      {!hasHandles && <span className="text-sm text-faint">Add a handle in Settings first.</span>}
    </div>
  );
}
