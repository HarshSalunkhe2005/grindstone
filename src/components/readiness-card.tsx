import { Bar, Ring } from "@/components/ui";
import type { Readiness } from "@/lib/readiness";

/** The placement-readiness score with what is holding it back. */
export function ReadinessCard({ r, compact = false }: { r: Readiness; compact?: boolean }) {
  return (
    <section className="card p-5" aria-label="Placement readiness">
      <div className="flex items-center gap-4">
        <Ring value={r.score / 100} size={compact ? 72 : 88} stroke={8} color="var(--ember)" label={`Readiness ${r.score} out of 100`}>
          <span className="num font-display text-2xl font-semibold">{r.score}</span>
        </Ring>
        <div>
          <p className="font-display text-lg font-semibold leading-tight">Placement readiness</p>
          <p className="text-sm text-muted">Coverage, retention, mocks and consistency in one number.</p>
        </div>
      </div>

      {!compact && (
        <ul className="mt-5 space-y-3">
          {r.parts.map((p) => (
            <li key={p.key}>
              <div className="mb-1 flex justify-between text-sm">
                <span>{p.label}</span>
                <span className="num text-muted">{Math.round(p.value * 100)}%</span>
              </div>
              <Bar heat value={p.value} label={`${p.label} ${Math.round(p.value * 100)} percent`} />
            </li>
          ))}
        </ul>
      )}

      {r.fixFirst.length > 0 && (
        <div className="mt-4 border-t border-line pt-3">
          <p className="text-sm font-medium text-ember">Fix first</p>
          <ul className="mt-1.5 space-y-1.5 text-sm text-muted">
            {r.fixFirst.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
