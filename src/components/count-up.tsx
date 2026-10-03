"use client";

import { useEffect, useRef, useState } from "react";

/** Counts up to `value` once on mount. With reduced motion it just shows the number. */
export function CountUp({ value, duration = 800 }: { value: number; duration?: number }) {
  const [shown, setShown] = useState(0);
  const raf = useRef<number | null>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || value === 0) {
      raf.current = requestAnimationFrame(() => setShown(value));
      return () => {
        if (raf.current) cancelAnimationFrame(raf.current);
      };
    }
    const start = performance.now();
    const tick = (now: number) => {
      // `now` can predate `start` on the first frame; clamp so the count never dips below zero.
      const t = Math.min(1, Math.max(0, (now - start) / duration));
      setShown(Math.round(value * (1 - Math.pow(1 - t, 3))));
      if (t < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [value, duration]);

  return <>{shown}</>;
}
