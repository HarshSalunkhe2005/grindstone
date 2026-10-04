import { createClient } from "@/lib/supabase/server";
import { mockScore } from "@/lib/mock";
import type { Problem } from "@/lib/insights";

/** Scores (0..1) of the user's finished mock rounds, newest first. */
export async function loadMockScores(problems: Problem[]): Promise<number[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("mock_attempts")
    .select("problem_ids, solved_ids, finished_at")
    .not("finished_at", "is", null)
    .order("finished_at", { ascending: false })
    .limit(10);
  const byId = new Map(problems.map((p) => [p.id, p]));
  return (data ?? []).map((a) =>
    mockScore(
      (a.problem_ids as number[]).flatMap((id) => {
        const p = byId.get(id);
        return p ? [{ id: p.id, difficulty: p.difficulty }] : [];
      }),
      a.solved_ids as number[],
    ),
  );
}
