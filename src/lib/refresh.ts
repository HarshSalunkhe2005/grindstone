"use client";

import type { useRouter } from "next/navigation";

let timer: ReturnType<typeof setTimeout> | null = null;

/**
 * Re-fetches the server-rendered page after a short pause. Ticking five
 * problems in a row then costs one refresh instead of five, and the optimistic
 * UI already shows each change instantly.
 */
export function softRefresh(router: ReturnType<typeof useRouter>, delay = 700) {
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    timer = null;
    router.refresh();
  }, delay);
}
