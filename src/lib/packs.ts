import type { Difficulty } from "@/lib/insights";

export interface Pack {
  id: string;
  label: string;
  blurb: string;
  /** Topic slugs, or null for every topic. */
  topics: string[] | null;
  difficulties: Difficulty[];
}

/** Themed problem sets drawn from the roadmap. Nothing here claims what any company asks. */
export const PACKS: Pack[] = [
  { id: "fundamentals", label: "Fundamentals", blurb: "Arrays, pointers, windows, stacks, search", topics: ["arrays-hashing", "two-pointers", "sliding-window", "stack", "binary-search"], difficulties: ["easy", "medium", "hard"] },
  { id: "staples", label: "Interview staples", blurb: "Lists, trees, heaps, graphs", topics: ["linked-list", "trees", "heap-priority-queue", "graphs"], difficulties: ["easy", "medium"] },
  { id: "dp-starter", label: "DP and friends", blurb: "Dynamic programming, greedy, intervals, backtracking", topics: ["dp-1d", "greedy", "intervals", "backtracking"], difficulties: ["easy", "medium"] },
  { id: "easy-wins", label: "Easy wins", blurb: "Every easy problem. Quick confidence", topics: null, difficulties: ["easy"] },
  { id: "hard-mode", label: "Hard mode", blurb: "Every hard problem. For when you are ready", topics: null, difficulties: ["hard"] },
];

export function inPack(pack: Pack, topicSlug: string | undefined, difficulty: Difficulty): boolean {
  return pack.difficulties.includes(difficulty) && (pack.topics === null || (topicSlug !== undefined && pack.topics.includes(topicSlug)));
}
