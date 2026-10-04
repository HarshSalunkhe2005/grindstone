"use client";

import { useCallback, useEffect, useState } from "react";
import { LevelCrest } from "@/components/ui";
import { fireSparks } from "@/components/spark-layer";

export interface LevelUpDetail {
  level: number;
  title: string;
}

/** Announce a level-up from anywhere: dispatchLevelUp({ level, title }). */
export function dispatchLevelUp(detail: LevelUpDetail) {
  window.dispatchEvent(new CustomEvent<LevelUpDetail>("gs:levelup", { detail }));
}

/** The one big moment: a crest, the new title, and a burst of sparks. Click or Escape to dismiss. */
export function LevelUpHost() {
  const [shown, setShown] = useState<LevelUpDetail | null>(null);
  const close = useCallback(() => setShown(null), []);

  useEffect(() => {
    const on = (e: Event) => {
      const detail = (e as CustomEvent<LevelUpDetail>).detail;
      setShown(detail);
      const w = window.innerWidth;
      const h = window.innerHeight;
      [0, 160, 320].forEach((t, i) => window.setTimeout(() => fireSparks(w * (0.35 + i * 0.15), h * 0.45, 2.2), t));
    };
    window.addEventListener("gs:levelup", on);
    return () => window.removeEventListener("gs:levelup", on);
  }, []);

  useEffect(() => {
    if (!shown) return;
    const t = window.setTimeout(close, 4200);
    const key = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", key);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("keydown", key);
    };
  }, [shown, close]);

  if (!shown) return null;
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Level up: ${shown.title}`}
      onClick={close}
      className="fixed inset-0 z-50 grid cursor-pointer place-items-center bg-bg/80 backdrop-blur-sm"
    >
      <div className="rise text-center">
        <div className="pop mx-auto w-fit">
          <LevelCrest level={shown.level} size={160} />
        </div>
        <p className="mt-4 text-sm text-ember">Level up</p>
        <p className="font-display text-5xl font-semibold">{shown.title}</p>
        <p className="mt-2 text-muted">Your edge just got sharper.</p>
      </div>
    </div>
  );
}
