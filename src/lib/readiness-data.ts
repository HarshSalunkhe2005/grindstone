import type { UserContext } from "@/lib/data";
import { addDays } from "@/lib/game";
import { loadMockScores } from "@/lib/mock-data";
import { readiness } from "@/lib/readiness";

export async function loadReadiness(ctx: UserContext) {
  const mockScores = await loadMockScores(ctx.problems);
  const activeLast14 = Array.from({ length: 14 }, (_, i) => addDays(ctx.today, -i)).filter((d) => (ctx.perDay.get(d) ?? 0) > 0).length;
  return readiness({
    problems: ctx.problems,
    solvedIds: ctx.solvedIds,
    stats: ctx.stats,
    overdue: ctx.due.length,
    solvedCount: ctx.solvedIds.size,
    mockScores,
    activeLast14,
  });
}
