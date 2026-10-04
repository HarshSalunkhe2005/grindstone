import type { Metadata } from "next";
import { RoadmapClient, type RoadmapProblem, type RoadmapTopic } from "@/components/roadmap-client";
import { loadUserContext } from "@/lib/data";
import { isDue } from "@/lib/review";

export const metadata: Metadata = { title: "Roadmap" };

export default async function RoadmapPage() {
  const { stats, edges, problems, progressById, rec } = await loadUserContext();
  const now = new Date();

  const topics: RoadmapTopic[] = stats.map((s) => ({
    id: s.topic.id,
    slug: s.topic.slug,
    position: s.topic.position,
    title: s.topic.title,
    blurb: s.topic.blurb,
    solved: s.solved,
    total: s.total,
    mastery: s.mastery,
    due: s.due,
    state: s.state,
    prereqs: s.prereqs,
  }));

  const rows: RoadmapProblem[] = problems.map((p) => {
    const pr = progressById.get(p.id);
    return {
      id: p.id,
      topicId: p.topic_id,
      title: p.title,
      url: p.url,
      difficulty: p.difficulty,
      solved: Boolean(pr),
      confidence: pr?.confidence ?? null,
      notes: pr?.notes ?? null,
      minutes: pr?.solve_minutes ?? null,
      due: pr ? isDue(pr.next_review_at, now) : false,
    };
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-4xl font-semibold sm:text-5xl">Roadmap</h1>
        <p className="mt-2 max-w-xl text-muted">
          Eighteen topics, each one making the next easier. Follow the glowing threads, or open anything you like.
        </p>
      </div>
      <RoadmapClient topics={topics} edges={edges} problems={rows} focusId={rec.focus?.topic.id ?? null} />
    </div>
  );
}
