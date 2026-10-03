import type { HeatCell } from "@/lib/game";

const LEVEL_BG = [
  "var(--panel-3)",
  "color-mix(in srgb, var(--arc) 28%, var(--panel-3))",
  "color-mix(in srgb, var(--arc) 52%, var(--panel-3))",
  "color-mix(in srgb, var(--arc) 78%, var(--panel-3))",
  "var(--arc)",
];

const DAYS = ["Mon", "", "Wed", "", "Fri", "", ""];
const MIN_CELL = 13;

/**
 * Monday-first activity grid that fills its card. One grid holds the weekday
 * labels, the month labels and every cell, so columns can never drift apart.
 */
export function Heatmap({ cols, months }: { cols: HeatCell[][]; months: { label: string; col: number }[] }) {
  const weeks = cols.length;
  const total = cols.flat().reduce((n, c) => n + c.count, 0);
  const active = cols.flat().filter((c) => c.count > 0).length;

  return (
    <div>
      <div className="overflow-x-auto pb-1">
        <div
          className="grid gap-[3px]"
          style={{
            gridTemplateColumns: `30px repeat(${weeks}, minmax(${MIN_CELL}px, 1fr))`,
            gridTemplateRows: `18px repeat(7, auto)`,
            minWidth: 30 + weeks * (MIN_CELL + 3),
          }}
          role="img"
          aria-label={`${total} problems solved in the last ${weeks} weeks, on ${active} days`}
        >
          {months.map((m) => (
            <span key={`${m.label}-${m.col}`} className="whitespace-nowrap text-[0.7rem] leading-[18px] text-faint" style={{ gridColumn: `${m.col + 2} / span 3`, gridRow: 1 }}>
              {m.label}
            </span>
          ))}
          {DAYS.map((d, i) => (
            <span key={i} className="text-[0.65rem] leading-none text-faint" style={{ gridColumn: 1, gridRow: i + 2, alignSelf: "center" }}>
              {d}
            </span>
          ))}
          {cols.map((col, c) =>
            col.map((cell, d) => (
              <div
                key={cell.day}
                title={cell.future ? undefined : `${cell.count} solved on ${cell.day}`}
                className="aspect-square rounded-[4px]"
                style={{
                  gridColumn: c + 2,
                  gridRow: d + 2,
                  background: cell.future ? "transparent" : LEVEL_BG[cell.level],
                  outline: cell.today ? "1.5px solid var(--arc)" : undefined,
                  outlineOffset: cell.today ? 1 : undefined,
                  border: cell.future ? "1px dashed var(--line)" : undefined,
                }}
              />
            )),
          )}
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between gap-3 text-xs text-faint">
        <span className="num">
          {total} solved on {active} days
        </span>
        <span className="flex items-center gap-1.5" aria-hidden>
          Less
          {LEVEL_BG.map((bg, i) => (
            <span key={i} className="size-3 rounded-[3px]" style={{ background: bg }} />
          ))}
          More
        </span>
      </div>
    </div>
  );
}
