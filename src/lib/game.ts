// Gamification maths. All of it is derived from data, nothing is stored twice.

export const TIMEZONE = "Asia/Kolkata";

const LEVELS = ["Pebble", "Flint", "Slate", "Granite", "Iron", "Steel", "Obsidian", "Diamond"];

export function levelFor(xp: number) {
  const level = Math.floor(Math.sqrt(xp / 40)) + 1;
  const floor = 40 * (level - 1) ** 2;
  const next = 40 * level ** 2;
  return {
    level,
    title: LEVELS[Math.min(level - 1, LEVELS.length - 1)],
    progress: (xp - floor) / (next - floor),
    toNext: next - xp,
  };
}

export function dayKey(date: Date | string) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TIMEZONE }).format(new Date(date));
}

export function streakFrom(days: Set<string>, now = new Date()) {
  const cursor = new Date(now);
  // A streak stays alive until the end of the day after the last solve.
  if (!days.has(dayKey(cursor))) cursor.setDate(cursor.getDate() - 1);
  let streak = 0;
  while (days.has(dayKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export function heatmap(counts: Map<string, number>, weeks = 26, now = new Date()) {
  const cells: { day: string; count: number }[] = [];
  const end = new Date(now);
  const total = weeks * 7;
  for (let i = total - 1; i >= 0; i--) {
    const d = new Date(end);
    d.setDate(end.getDate() - i);
    const day = dayKey(d);
    cells.push({ day, count: counts.get(day) ?? 0 });
  }
  return cells;
}

export function daysUntil(isoDate: string, now = new Date()) {
  const target = new Date(`${isoDate}T00:00:00+05:30`).getTime();
  return Math.ceil((target - now.getTime()) / 86_400_000);
}
