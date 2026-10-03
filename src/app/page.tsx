import Link from "next/link";
import { GrindWheel } from "@/components/grind-wheel";
import { SkillTree, type TreeTopic } from "@/components/skill-tree";
import { Bar, Icon, Mark, Ring } from "@/components/ui";

const SAMPLE: [string, number, number, TreeTopic["state"]][] = [
  ["Arrays & Hashing", 8, 8, "done"],
  ["Two Pointers", 5, 5, "done"],
  ["Stack", 7, 7, "done"],
  ["Binary Search", 7, 7, "done"],
  ["Sliding Window", 6, 6, "done"],
  ["Linked List", 11, 11, "done"],
  ["Trees", 6, 15, "active"],
  ["Tries", 0, 3, "open"],
  ["Backtracking", 0, 9, "open"],
  ["Heap / Priority Queue", 0, 7, "open"],
  ["Graphs", 0, 10, "locked"],
  ["1-D Dynamic Programming", 0, 12, "locked"],
  ["Intervals", 0, 4, "locked"],
  ["Greedy", 0, 8, "locked"],
  ["Advanced Graphs", 0, 5, "locked"],
  ["2-D Dynamic Programming", 0, 11, "locked"],
  ["Bit Manipulation", 0, 7, "locked"],
  ["Math & Geometry", 0, 8, "locked"],
];
const TREE_TOPICS: TreeTopic[] = SAMPLE.map(([title, solved, total, state], i) => ({
  id: i + 1,
  position: i + 1,
  title,
  solved,
  total,
  state,
  mastery: total ? solved / total : 0,
  due: 0,
}));
// Same shape as the real roadmap: arrays -> pointers/stack -> search/window/lists -> trees -> everything else.
const TREE_EDGES = [
  [1, 2], [1, 3], [2, 4], [2, 5], [2, 6], [4, 7], [5, 7], [6, 7], [7, 8], [7, 9], [7, 10],
  [10, 13], [10, 14], [10, 15], [9, 11], [9, 12], [11, 15], [12, 16], [12, 17], [16, 18], [17, 18],
].map(([from_topic, to_topic]) => ({ from_topic, to_topic }));

const RUNGS = [
  { day: "1", label: "Next day" },
  { day: "3", label: "Three days" },
  { day: "7", label: "A week" },
  { day: "21", label: "Three weeks" },
];

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-5">
        <Link href="/" className="flex items-center gap-2" aria-label="Grindstone home">
          <Mark />
          <span className="font-display text-xl font-semibold">Grindstone</span>
        </Link>
        <nav className="flex items-center gap-2" aria-label="Account">
          <Link href="/login" className="btn btn-quiet btn-sm">
            Sign in
          </Link>
          <Link href="/login" className="btn btn-arc btn-sm hidden sm:inline-flex">
            Start free
          </Link>
        </nav>
      </header>

      <main className="flex-1">
        {/* Hero: the wheel is the signature moment */}
        <section className="mx-auto grid w-full max-w-6xl items-center gap-4 px-5 pb-10 pt-4 lg:grid-cols-[1.05fr_1fr] lg:pb-20 lg:pt-10">
          <div className="order-2 lg:order-1">
            <h1 className="font-display text-[clamp(2.9rem,7.5vw,5.6rem)] font-semibold leading-[0.98] text-balance">
              Sharpen your edge.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-muted">
              A DSA roadmap that adapts to you: a plan for today, revision before you forget, and a shower of sparks for every problem you solve.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link href="/login" className="btn btn-arc !min-h-14 !px-7 !text-base">
                Start grinding <Icon name="arrow" size={18} />
              </Link>
              <a href="#how" className="btn btn-quiet !min-h-14 !px-6 !text-base">
                See how it works
              </a>
            </div>
            <p className="mt-5 text-sm text-faint">Free. 143 hand-picked problems across 18 topics, in an order that makes each one easier.</p>
          </div>

          <div className="relative order-1 lg:order-2">
            <div
              aria-hidden
              className="absolute inset-0 -z-10 rounded-full opacity-70 blur-3xl"
              style={{ background: "radial-gradient(closest-side, rgba(92,200,255,.16), transparent 70%)" }}
            />
            <GrindWheel className="aspect-[5/4] w-full" />
          </div>
        </section>

        {/* The product itself, not a picture of a product */}
        <section id="how" className="mx-auto w-full max-w-6xl scroll-mt-8 px-5 py-14 lg:py-24">
          <div className="max-w-2xl">
            <h2 className="font-display text-4xl font-semibold sm:text-5xl">Open it and know exactly what to do.</h2>
            <p className="mt-4 text-lg leading-8 text-muted">
              No browsing a list of 500 problems and wondering where to start. Grindstone looks at what you have solved, what is fading, and picks the next move.
            </p>
          </div>

          <div className="card mt-10 overflow-hidden" aria-label="Preview of the Today screen">
            <div className="flex items-center gap-1 border-b border-line px-4 py-3 text-sm">
              {["Today", "Roadmap", "Profile"].map((t, i) => (
                <span key={t} className={`rounded-lg px-3 py-1.5 ${i === 0 ? "bg-panel-2 font-medium text-text" : "text-faint"}`}>
                  {t}
                </span>
              ))}
              <span className="num ml-auto flex items-center gap-1.5 text-faint">
                <Icon name="flame" size={16} className="text-ember" /> 12
              </span>
            </div>
            <div className="grid gap-5 p-5 sm:p-7 lg:grid-cols-[1fr_17rem]">
              <div className="space-y-4">
                <div className="rounded-2xl border border-line bg-panel-2 p-6">
                  <p className="chip !border-arc/40 !text-arc w-fit">Revision due</p>
                  <p className="font-display mt-3 text-3xl font-semibold">4 problems to revise</p>
                  <p className="mt-2 max-w-md text-sm text-muted">Recall beats new content. Rate each one honestly and the schedule adapts.</p>
                  <span className="btn btn-arc mt-5 !cursor-default">
                    Start revising <Icon name="arrow" size={16} />
                  </span>
                </div>
                <ul className="rounded-2xl border border-line">
                  {[
                    ["Valid Parentheses", "Stack", "Easy", "text-easy"],
                    ["Binary Tree Level Order Traversal", "Trees", "Medium", "text-medium"],
                    ["Course Schedule", "Graphs", "Medium", "text-medium"],
                  ].map(([t, topic, d, c]) => (
                    <li key={t} className="flex items-center gap-3 border-b border-line px-4 py-3 last:border-0">
                      <span className="size-5 rounded-md border border-line-strong" />
                      <span className="flex-1 text-sm font-medium">
                        {t}
                        <span className="block text-xs font-normal text-faint">{topic}</span>
                      </span>
                      <span className={`text-xs font-medium ${c}`}>{d}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-4 rounded-2xl border border-line bg-panel-2 p-4">
                  <Ring value={2 / 3} size={72} stroke={7} label="2 of 3 problems today">
                    <span className="num text-lg font-semibold">2/3</span>
                  </Ring>
                  <div>
                    <p className="font-display font-semibold">Daily goal</p>
                    <p className="text-xs text-muted">One more to go.</p>
                  </div>
                </div>
                <div className="rounded-2xl border border-line bg-panel-2 p-4">
                  <div className="flex items-baseline justify-between">
                    <p className="font-display font-semibold">Razor</p>
                    <span className="num text-xs text-faint">Lv 5</span>
                  </div>
                  <div className="mt-3">
                    <Bar value={0.74} label="Level progress" />
                  </div>
                  <p className="num mt-2 text-xs text-faint">940 XP · 60 to the next edge</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Revision ladder */}
        <section className="mx-auto grid w-full max-w-6xl items-center gap-10 px-5 py-14 lg:grid-cols-2 lg:py-24">
          <div>
            <h2 className="font-display text-4xl font-semibold sm:text-5xl">Solve it once. Own it for good.</h2>
            <p className="mt-4 max-w-lg text-lg leading-8 text-muted">
              Most people forget a problem within weeks because they never see it again. Every problem you solve comes back on a ladder: tomorrow, then three days, a week, three weeks. Forget one, and it starts over.
            </p>
            <p className="mt-4 max-w-lg text-sm text-faint">Rate each revision honestly. Two minutes each, never more than eight a day.</p>
          </div>
          <ol className="card relative space-y-0 p-6" aria-label="Revision schedule">
            {RUNGS.map((r, i) => (
              <li key={r.day} className="relative flex items-center gap-4 py-3.5">
                {i < RUNGS.length - 1 && <span aria-hidden className="absolute left-[19px] top-[3.1rem] h-6 w-px bg-line-strong" />}
                <span className="num grid size-10 shrink-0 place-items-center rounded-xl border border-arc/50 bg-arc-soft text-sm font-semibold text-arc">{r.day}d</span>
                <div className="flex-1">
                  <p className="font-medium">{r.label}</p>
                  <div className="mt-1.5">
                    <Bar value={(i + 1) / RUNGS.length} label={`Rung ${i + 1} of 4`} />
                  </div>
                </div>
              </li>
            ))}
            <li className="flex items-center gap-4 pt-3.5">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-arc text-arc-ink">
                <Icon name="trophy" size={18} />
              </span>
              <p className="font-medium">Mastered. It stops bothering you.</p>
            </li>
          </ol>
        </section>

        {/* Skill tree */}
        <section className="mx-auto w-full max-w-6xl px-5 py-14 lg:py-24">
          <div className="max-w-2xl">
            <h2 className="font-display text-4xl font-semibold sm:text-5xl">A roadmap with a shape.</h2>
            <p className="mt-4 text-lg leading-8 text-muted">
              Eighteen topics, each one built on the last. Cleared threads light up, the next step is marked, and later topics wait without ever locking you out.
            </p>
          </div>
          <div className="mt-10">
            <SkillTree topics={TREE_TOPICS} edges={TREE_EDGES} focusId={7} />
          </div>
        </section>

        {/* Close */}
        <section className="mx-auto w-full max-w-6xl px-5 pb-24 pt-10">
          <div className="card relative overflow-hidden p-8 text-center sm:p-14">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 -top-24 mx-auto h-56 w-2/3 rounded-full opacity-60 blur-3xl"
              style={{ background: "radial-gradient(closest-side, rgba(92,200,255,.22), transparent)" }}
            />
            <h2 className="font-display relative text-4xl font-semibold sm:text-6xl">Light the wheel.</h2>
            <p className="relative mx-auto mt-4 max-w-md text-lg text-muted">Your first problem is two minutes away.</p>
            <Link href="/login" className="btn btn-arc relative mt-8 !min-h-14 !px-8 !text-base">
              Start grinding <Icon name="arrow" size={18} />
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-5 py-6 text-sm text-faint">
          <span className="flex items-center gap-2">
            <Mark size={20} /> Grindstone
          </span>
          <span>Problems link to LeetCode. Free while it&apos;s young.</span>
        </div>
      </footer>
    </div>
  );
}
