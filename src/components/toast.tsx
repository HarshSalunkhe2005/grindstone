"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/ui";

type Tone = "info" | "win" | "error";
interface ToastItem {
  id: number;
  message: string;
  tone: Tone;
}

export function toast(message: string, tone: Tone = "info") {
  window.dispatchEvent(new CustomEvent("grind:toast", { detail: { message, tone } }));
}

/** Small, polite, self-dismissing messages. Wins sit in the arc colour, errors in rose. */
export function ToastHost() {
  const [items, setItems] = useState<ToastItem[]>([]);
  const next = useRef(1);

  useEffect(() => {
    const on = (e: Event) => {
      const { message, tone } = (e as CustomEvent<{ message: string; tone: Tone }>).detail;
      const id = next.current++;
      setItems((list) => [...list.slice(-2), { id, message, tone }]);
      setTimeout(() => setItems((list) => list.filter((t) => t.id !== id)), tone === "win" ? 4200 : 3200);
    };
    window.addEventListener("grind:toast", on);
    return () => window.removeEventListener("grind:toast", on);
  }, []);

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-24 z-[60] flex flex-col items-center gap-2 px-4 sm:bottom-6 sm:items-end sm:px-6"
    >
      {items.map((t) => (
        <div
          key={t.id}
          className={`rise pointer-events-auto max-w-sm rounded-xl border px-4 py-2.5 text-sm shadow-xl ${
            t.tone === "win"
              ? "border-arc/50 bg-panel-2 text-text"
              : t.tone === "error"
                ? "border-hard/50 bg-panel-2 text-hard"
                : "border-line-strong bg-panel-2 text-text"
          }`}
        >
          {t.tone === "win" && <Icon name="spark" size={14} className="mr-2 inline text-arc" />}
          {t.message}
        </div>
      ))}
    </div>
  );
}
