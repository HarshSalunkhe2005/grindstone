// Gamification maths. Everything is derived from solve data, nothing is stored twice.

export const DEFAULT_TZ = "Asia/Kolkata";

const LEVEL_NAMES = ["Raw Steel", "Dull Edge", "Honed", "Keen", "Razor", "Damascus", "Obsidian Edge", "Mythic"];

export function levelFor(xp: number) {
  const level = Math.floor(Math.sqrt(xp / 40)) + 1;
  const floor = 40 * (level - 1) ** 2;
  const next = 40 * level ** 2;
  return {
    level,
    title: LEVEL_NAMES[Math.min(level - 1, LEVEL_NAMES.length - 1)],
    progress: (xp - floor) / (next - floor),
    toNext: next - xp,
    floor,
    next,
  };
}

/** The calendar day (yyyy-mm-dd) a moment falls on in the user's timezone. */
export function dayKey(date: Date | string, tz = DEFAULT_TZ): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: tz }).format(new Date(date));
}

const DAY_MS = 86_400_000;
const keyToUtc = (key: string) => Date.parse(`${key}T00:00:00Z`);
const utcToKey = (ms: number) => new Date(ms).toISOString().slice(0, 10);
export const addDays = (key: string, n: number) => utcToKey(keyToUtc(key) + n * DAY_MS);

/** One streak freeze is earned for every 7 active days. It quietly bridges a single missed day. */
export const freezeBudget = (activeDays: number) => Math.floor(activeDays / 7);

/**
 * Current and best streak. With a `freezes` budget, a single missed day between two active days
 * does not break the run (it just does not add to the count). Everything stays derived from the
 * solve days, so nothing needs to be stored or spent.
 */
export function streaks(days: Set<string>, now = new Date(), tz = DEFAULT_TZ, freezes = 0) {
  const today = dayKey(now, tz);
  // A streak stays alive until the end of the day after your last solve.
  let cursor = days.has(today) ? today : addDays(today, -1);
  let left = freezes;
  let current = 0;
  let frozen = 0;
  for (;;) {
    if (days.has(cursor)) {
      current += 1;
    } else if (left > 0 && days.has(addDays(cursor, -1))) {
      left -= 1;
      frozen += 1;
    } else {
      break;
    }
    cursor = addDays(cursor, -1);
  }
  const sorted = [...days].sort();
  let best = 0;
  let run = 0;
  let prev = "";
  let spare = freezes;
  for (const d of sorted) {
    if (prev && addDays(prev, 1) === d) run += 1;
    else if (prev && addDays(prev, 2) === d && spare > 0) {
      spare -= 1;
      run += 1;
    } else run = 1;
    best = Math.max(best, run);
    prev = d;
  }
  best = Math.max(best, current);
  return { current, best, todayDone: days.has(today), frozen, freezesLeft: left };
}

/** Whole days since the last solve (0 if you solved today), or null if you never have. */
export function daysAway(days: Set<string>, now = new Date(), tz = DEFAULT_TZ): number | null {
  if (days.size === 0) return null;
  const last = [...days].sort().at(-1)!;
  return Math.max(0, Math.round((keyToUtc(dayKey(now, tz)) - keyToUtc(last)) / DAY_MS));
}

export interface HeatCell {
  day: string;
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
  future: boolean;
  today: boolean;
}

const intensity = (n: number): HeatCell["level"] => (n <= 0 ? 0 : n === 1 ? 1 : n === 2 ? 2 : n <= 4 ? 3 : 4);

/** Monday-first week columns ending with the current week, plus month labels for the column they start in. */
export function heatmapWeeks(counts: Map<string, number>, weeks = 26, now = new Date(), tz = DEFAULT_TZ) {
  const today = dayKey(now, tz);
  const dow = (new Date(keyToUtc(today)).getUTCDay() + 6) % 7; // Monday = 0
  const start = addDays(today, -dow - (weeks - 1) * 7);
  const cols: HeatCell[][] = [];
  const months: { label: string; col: number }[] = [];
  let lastMonth = -1;
  for (let w = 0; w < weeks; w++) {
    const col: HeatCell[] = [];
    for (let d = 0; d < 7; d++) {
      const day = addDays(start, w * 7 + d);
      const count = counts.get(day) ?? 0;
      col.push({ day, count, level: intensity(count), future: day > today, today: day === today });
    }
    const month = new Date(keyToUtc(col[0].day)).getUTCMonth();
    if (month !== lastMonth) {
      months.push({ label: new Date(keyToUtc(col[0].day)).toLocaleString("en", { month: "short", timeZone: "UTC" }), col: w });
      lastMonth = month;
    }
    cols.push(col);
  }
  // A label needs room: drop a month that would sit within 3 columns of the next one.
  const spaced = months.filter((m, i) => i === months.length - 1 || months[i + 1].col - m.col >= 3);
  return { cols, months: spaced };
}

export function daysUntil(isoDate: string, now = new Date(), tz = DEFAULT_TZ) {
  return Math.ceil((keyToUtc(isoDate) - keyToUtc(dayKey(now, tz))) / DAY_MS);
}

export function greeting(tz = DEFAULT_TZ, now = new Date()): string {
  const hour = Number(new Intl.DateTimeFormat("en", { hour: "numeric", hour12: false, timeZone: tz }).format(now)) % 24;
  return hour < 5 ? "Burning the midnight oil" : hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : hour < 22 ? "Good evening" : "Late session";
}

export function longDate(tz = DEFAULT_TZ, now = new Date()): string {
  return new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: tz }).format(now);
}
