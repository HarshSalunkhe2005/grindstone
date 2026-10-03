import type { ReactNode } from "react";

const PATHS = {
  flame: "M12 3c.6 3.2-1.6 4.6-1.6 7 0 1.3.9 2.3 2.2 2.3 0-1.2-.5-1.9-.9-2.5 2.6.7 4.6 3.2 4.6 6a5.3 5.3 0 0 1-10.6 0c0-2 .8-3.4 2-4.6C9.2 8.6 11.4 6.6 12 3Z",
  bolt: "M13 3 5 13.5h6L10 21l8-10.5h-6L13 3Z",
  clock: "M12 7v5l3 2M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z",
  check: "m5 12.5 4.5 4.5L19 7.5",
  x: "M6 6l12 12M18 6 6 18",
  note: "M7 4h10a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2ZM8.5 9h7M8.5 13h7M8.5 17h4",
  tree: "M10 4h4v4h-4zM4 16h4v4H4zM16 16h4v4h-4zM12 8v4M6 16v-2h12v2M12 12v2",
  list: "M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01",
  lock: "M7 11V8a5 5 0 0 1 10 0v3M6 11h12v9H6z",
  target: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM12 16.5a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9ZM12 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z",
  arrow: "M5 12h14m-5-5 5 5-5 5",
  external: "M14 5h5v5M19 5l-8 8M18 14v4a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h4",
  search: "M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14ZM20 20l-4-4",
  trophy: "M8 4h8v5a4 4 0 0 1-8 0V4ZM8 6H5v2a3 3 0 0 0 3 3M16 6h3v2a3 3 0 0 1-3 3M12 13v4M8.5 20h7M10 17h4",
  refresh: "M20 11a8 8 0 0 0-14.5-4M4 5v4h4M4 13a8 8 0 0 0 14.5 4M20 19v-4h-4",
  user: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM5 20a7 7 0 0 1 14 0",
  gear: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM19.4 13.5a7.7 7.7 0 0 0 0-3l1.8-1.4-1.8-3.1-2.1.9a7.7 7.7 0 0 0-2.6-1.5L14.4 3h-3.8l-.3 2.4a7.7 7.7 0 0 0-2.6 1.5l-2.1-.9-1.8 3.1 1.8 1.4a7.7 7.7 0 0 0 0 3l-1.8 1.4 1.8 3.1 2.1-.9a7.7 7.7 0 0 0 2.6 1.5l.3 2.4h3.8l.3-2.4a7.7 7.7 0 0 0 2.6-1.5l2.1.9 1.8-3.1-1.8-1.4Z",
  home: "M4 11 12 4l8 7v8a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1v-8Z",
  download: "M12 4v11m0 0 4-4m-4 4-4-4M5 19h14",
  spark: "M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18",
} as const;

export type IconName = keyof typeof PATHS;

export function Icon({ name, size = 16, className }: { name: IconName; size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={className}
    >
      <path d={PATHS[name]} />
    </svg>
  );
}

/** The Grindstone mark: a wheel edge-on with a spark. */
export function Mark({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden>
      <circle cx="16" cy="17" r="9.5" fill="none" stroke="var(--line-strong)" strokeWidth="2.4" />
      <circle cx="16" cy="17" r="3" fill="var(--panel-3)" stroke="var(--line-strong)" strokeWidth="1.6" />
      <path d="M22.5 10.2 27 5.5M23.5 13 29 11.5M21 8 24 3" stroke="var(--arc)" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

/** Circular progress. `value` is 0..1. */
export function Ring({
  value,
  size = 96,
  stroke = 9,
  color = "var(--arc)",
  track = "var(--line)",
  children,
  label,
}: {
  value: number;
  size?: number;
  stroke?: number;
  color?: string;
  track?: string;
  children?: ReactNode;
  label: string;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(1, value));
  return (
    <div className="relative grid shrink-0 place-items-center" style={{ width: size, height: size }} role="img" aria-label={label}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${c * v} ${c}`}
          style={{ transition: "stroke-dasharray 900ms var(--ease)" }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">{children}</div>
    </div>
  );
}

export function Bar({ value, color = "var(--arc)", label }: { value: number; color?: string; label: string }) {
  const v = Math.round(Math.max(0, Math.min(1, value)) * 100);
  return (
    <div className="h-1.5 overflow-hidden rounded-full bg-line" role="progressbar" aria-valuenow={v} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
      <div
        className="h-full w-full rounded-full"
        style={{ background: color, transform: `scaleX(${v / 100})`, transformOrigin: "left center", transition: "transform 800ms var(--ease)" }}
      />
    </div>
  );
}

export const DIFF_TEXT = { easy: "text-easy", medium: "text-medium", hard: "text-hard" } as const;
export const DIFF_COLOR = { easy: "var(--easy)", medium: "var(--medium)", hard: "var(--hard)" } as const;
