"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui";
import { sparksFromElement } from "@/components/spark-layer";
import { toast } from "@/components/toast";

export function CompleteButton({ slug, initiallyDone, nextHref }: { slug: string; initiallyDone: boolean; nextHref: string }) {
  const router = useRouter();
  const [done, setDone] = useState(initiallyDone);
  const [busy, setBusy] = useState(false);

  async function set(next: boolean, el: HTMLElement) {
    setBusy(true);
    try {
      const res = await fetch("/api/v1/lessons", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, done: next }),
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

  if (!done) {
    return (
      <button type="button" disabled={busy} className="btn btn-ember" onClick={(e) => set(true, e.currentTarget)}>
        <Icon name="check" size={16} /> Mark as done
      </button>
    );
  }
  return (
    <div className="flex flex-wrap items-center gap-3">
      <button type="button" className="btn btn-arc" onClick={() => router.push(nextHref)}>
        Next lesson <Icon name="arrow" size={16} />
      </button>
      <button type="button" disabled={busy} className="btn btn-quiet btn-sm" onClick={(e) => set(false, e.currentTarget)}>
        Undo
      </button>
    </div>
  );
}
