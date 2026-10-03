/**
 * Spaced revision. A solved problem comes back after 1, 3, 7 and 21 days. Each
 * review is rated: "again" restarts the ladder, "good" climbs one rung, "easy"
 * skips one. Finishing the ladder marks the problem mastered (no more reviews).
 */
export const LADDER_DAYS = [1, 3, 7, 21] as const;

export type Rating = "again" | "good" | "easy";
export type Confidence = 1 | 2 | 3;

export interface ReviewOutcome {
  stage: number;
  nextReviewAt: Date | null;
  mastered: boolean;
  confidence: Confidence;
}

export function scheduleReview(stage: number, rating: Rating, now = new Date()): ReviewOutcome {
  const confidence: Confidence = rating === "again" ? 1 : rating === "good" ? 2 : 3;
  const next = rating === "again" ? 0 : stage + (rating === "good" ? 1 : 2);
  if (next >= LADDER_DAYS.length) return { stage: LADDER_DAYS.length, nextReviewAt: null, mastered: true, confidence };
  return {
    stage: next,
    nextReviewAt: new Date(now.getTime() + LADDER_DAYS[next] * 86_400_000),
    mastered: false,
    confidence,
  };
}

export function isDue(nextReviewAt: string | Date | null | undefined, now = new Date()): boolean {
  return nextReviewAt != null && new Date(nextReviewAt).getTime() <= now.getTime();
}
