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

/**
 * A progress gauge cut like a blade edge: a sunken groove with a lit bar.
 * `heat` makes the bar a heating metal: cold steel at the start, ember in the
 * middle, white-hot at the tip.
 */
export function Bar({ value, color = "var(--arc)", label, heat = false }: { value: number; color?: string; label: string; heat?: boolean }) {
  const v = Math.round(Math.max(0, Math.min(1, value)) * 100);
  const fill = heat ? "linear-gradient(90deg, #4a5a72 0%, var(--ember-deep) 38%, var(--ember) 72%, var(--ember-hot) 100%)" : color;
  return (
    <div
      className="h-2 overflow-hidden rounded-full bg-bg shadow-[inset_0_1px_3px_rgba(0,0,0,0.7)] ring-1 ring-line"
      role="progressbar"
      aria-valuenow={v}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
    >
      <div
        className="h-full w-full rounded-full shadow-[inset_0_1px_0_rgba(255,255,255,0.35)]"
        style={{ background: fill, transform: `scaleX(${v / 100})`, transformOrigin: "left center", transition: "transform 800ms var(--ease)" }}
      />
    </div>
  );
}

/**
 * A grinding wheel seen face-on, bleeding off a corner of whatever contains it,
 * with a stream of sparks at the contact point. Used as the scene on Today and
 * as the illustration for empty and finished states.
 */
export function WheelArt({ className, sparks = true, spin = true }: { className?: string; sparks?: boolean; spin?: boolean }) {
  const spokes = Array.from({ length: 12 }, (_, i) => i * 30);
  return (
    <svg viewBox="0 0 320 320" className={className} aria-hidden fill="none">
      <defs>
        <radialGradient id="wa-body" cx="35%" cy="30%" r="80%">
          <stop offset="0" stopColor="#5a687e" />
          <stop offset="0.55" stopColor="#2a3342" />
          <stop offset="1" stopColor="#121720" />
        </radialGradient>
        <linearGradient id="wa-rim" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#8d99ad" />
          <stop offset="0.5" stopColor="#2a3342" />
          <stop offset="1" stopColor="#ff8a3d" />
        </linearGradient>
      </defs>
      <circle cx="160" cy="160" r="150" fill="url(#wa-body)" stroke="url(#wa-rim)" strokeWidth="3" />
      <g className={spin ? "spin-slow" : undefined} style={{ transformOrigin: "160px 160px" }}>
        <circle cx="160" cy="160" r="118" stroke="#445168" strokeWidth="1.5" strokeDasharray="2 7" />
        {spokes.map((a) => (
          <path key={a} d="M160 96V52" stroke="#445168" strokeWidth="2" strokeLinecap="round" transform={`rotate(${a} 160 160)`} />
        ))}
        <circle cx="160" cy="160" r="84" stroke="#384358" strokeWidth="1.5" />
      </g>
      <circle cx="160" cy="160" r="30" fill="#151a23" stroke="#3a4455" strokeWidth="2" />
      <circle cx="160" cy="160" r="9" fill="#0b0e13" stroke="#4a5568" strokeWidth="1.5" />
      {sparks && (
        <g strokeLinecap="round">
          <path d="M296 250 332 226M298 258 340 252M294 266 328 286M292 244 318 206" stroke="#ff8a3d" strokeWidth="2.5" />
          <path d="M300 254 322 242M296 262 316 272" stroke="#ffd9a8" strokeWidth="2" />
        </g>
      )}
    </svg>
  );
}

/** One distinct emblem per badge. Locked ones are drawn in outline only. */
export function Emblem({ id, unlocked, size = 44 }: { id: string; unlocked: boolean; size?: number }) {
  const ink = unlocked ? "#1a0d04" : "var(--faint)";
  const plate = unlocked ? "url(#em-ember)" : "none";
  const glyph: Record<string, ReactNode> = {
    first: <path d="M24 10v7M24 31v7M10 24h7M31 24h7M14 14l5 5M29 29l5 5M34 14l-5 5M19 29l-5 5" />,
    ten: <path d="M16 34V22M24 34V14M32 34V19" />,
    fifty: <path d="M12 28a12 12 0 0 1 24 0M24 28l7-9M12 34h24" />,
    hundred: (
      <>
        <circle cx="24" cy="24" r="11" />
        <circle cx="24" cy="24" r="4" />
        <path d="M24 9v4M24 35v4M9 24h4M35 24h4" />
      </>
    ),
    streak3: <path d="M16 36c-4-4-3-9 0-12 0 3 3 4 3 4 0-5 2-9 5-12 1 6 7 9 6 15-1 3-4 5-7 5s-5-1-7-0Z" />,
    streak7: <path d="M24 12v-2M33.5 16l1.5-1.5M37 24h2M33.5 32l1.5 1.5M24 36v2M14.5 32 13 33.5M11 24H9M14.5 16 13 14.5M24 17a7 7 0 1 0 0 14 7 7 0 0 0 0-14Z" />,
    streak30: <path d="M20 28l-4 4a5 5 0 0 1-7-7l5-5a5 5 0 0 1 7 0M28 20l4-4a5 5 0 0 1 7 7l-5 5a5 5 0 0 1-7 0M19 29l10-10" />,
    hard: <path d="M24 9l12 15-12 15L12 24 24 9ZM24 9v30M12 24h24" />,
    topic: (
      <>
        <path d="M24 12v8M24 20l-9 7M24 20l9 7" />
        <circle cx="24" cy="11" r="3" />
        <circle cx="14" cy="30" r="3" />
        <circle cx="34" cy="30" r="3" />
        <path d="m31 30 2 2 4-4" />
      </>
    ),
    reviewer: <path d="M35 21a11 11 0 0 0-20-4M13 12v6h6M13 27a11 11 0 0 0 20 4M35 36v-6h-6" />,
    notes: <path d="M14 11h20v26H14zM19 18h10M19 24h10M19 30h5" />,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden className="shrink-0">
      <defs>
        <linearGradient id="em-ember" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffd9a8" />
          <stop offset="0.55" stopColor="#ff8a3d" />
          <stop offset="1" stopColor="#c4501a" />
        </linearGradient>
      </defs>
      <path
        d="M24 3l17 9.5v23L24 45 7 35.5v-23L24 3Z"
        fill={plate}
        stroke={unlocked ? "#ffd9a8" : "var(--line-strong)"}
        strokeWidth="1.5"
        strokeDasharray={unlocked ? undefined : "3 3"}
      />
      <g stroke={ink} strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
        {glyph[id] ?? glyph.first}
      </g>
    </svg>
  );
}

export const DIFF_TEXT = { easy: "text-easy", medium: "text-medium", hard: "text-hard" } as const;
export const DIFF_COLOR = { easy: "var(--easy)", medium: "var(--medium)", hard: "var(--hard)" } as const;

const CREST_TIERS = ["#6b7a90", "#7f90a8", "#9fb0c6", "#c4d3e6", "#ffb26b", "#ff8a3d", "#ffd9a8", "#ffffff"];

/**
 * A crest for the user's level: a steel shield that gains rings and heats from cold grey to
 * white-hot ember as the level rises (eight tiers, matching the level titles).
 */
export function LevelCrest({ level, size = 64 }: { level: number; size?: number }) {
  const tier = Math.min(Math.max(level, 1), 8) - 1;
  const color = CREST_TIERS[tier];
  const hot = tier >= 4;
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" role="img" aria-label={`Level ${level} crest`}>
      <defs>
        <linearGradient id={`crest-${tier}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={color} stopOpacity="0.95" />
          <stop offset="1" stopColor={hot ? "#c4501a" : "#232b38"} />
        </linearGradient>
      </defs>
      <path d="M32 4 55 13v18c0 14-9.5 24.5-23 29C18.5 55.5 9 45 9 31V13L32 4Z" fill={`url(#crest-${tier})`} stroke={color} strokeWidth="2" strokeLinejoin="round" />
      {Array.from({ length: Math.min(tier, 4) }, (_, i) => (
        <path key={i} d={`M${18 + i * 1.5} ${24 + i * 5}h${28 - i * 3}`} stroke="#0b0e13" strokeOpacity="0.55" strokeWidth="2" strokeLinecap="round" />
      ))}
      <text x="32" y={tier >= 4 ? 44 : 40} textAnchor="middle" fontSize="20" fontWeight="700" fill="#0b0e13" fontFamily="var(--font-geist-mono), monospace">
        {level}
      </text>
      {hot && <path d="M32 8v6M26 10l2 4M38 10l-2 4" stroke="#ffd9a8" strokeWidth="1.6" strokeLinecap="round" />}
    </svg>
  );
}
