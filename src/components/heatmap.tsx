export function Heatmap({ cells }: { cells: { day: string; count: number }[] }) {
  const opacity = (n: number) => (n === 0 ? 0 : n === 1 ? 0.4 : n === 2 ? 0.7 : 1);
  const total = cells.reduce((a, c) => a + c.count, 0);
  return (
    <div>
      <div
        className="grid grid-flow-col grid-rows-7 gap-[3px] overflow-x-auto pb-1"
        role="img"
        aria-label={`${total} problems solved in the last ${Math.round(cells.length / 7)} weeks`}
      >
        {cells.map((c) => (
          <div
            key={c.day}
            title={`${c.day}: ${c.count} solved`}
            className="size-3 rounded-[3px] bg-surface-2"
            style={c.count ? { backgroundColor: `color-mix(in srgb, var(--spark) ${opacity(c.count) * 100}%, var(--surface-2))` } : undefined}
          />
        ))}
      </div>
      <p className="num mt-2 text-xs text-muted">{total} solved in the last {Math.round(cells.length / 7)} weeks</p>
    </div>
  );
}
