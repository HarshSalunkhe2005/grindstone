import type { Metadata } from "next";
import Link from "next/link";
import { Bar, Icon, WheelArt } from "@/components/ui";
import { ALL_LESSONS } from "@/content/lessons";
import { loadCompletedLessons, moduleProgress, nextLesson } from "@/lib/learn";

export const metadata: Metadata = { title: "Learn" };

export default async function LearnPage() {
  const done = await loadCompletedLessons();
  const modules = moduleProgress(done);
  const next = nextLesson(done);
  const minutesLeft = ALL_LESSONS.filter((l) => !done.has(l.slug)).reduce((n, l) => n + l.minutes, 0);

  return (
    <div className="space-y-6">
      <div className="card card-hero relative overflow-hidden p-6 sm:p-8">
        <WheelArt className="pointer-events-none absolute -bottom-24 -right-16 size-72 opacity-70" sparks={false} />
        <h1 className="font-display relative text-4xl font-semibold sm:text-5xl">Web dev, from the wire up</h1>
        <p className="relative mt-2 max-w-xl text-muted">
          Eight short modules on the parts that interviews and production both ask about: HTTP, indexing, transactions, Redis, auth, security, performance and reliability. Five minutes a lesson, one exercise each.
        </p>
        <div className="relative mt-6 max-w-md">
          <div className="mb-1.5 flex justify-between text-sm">
            <span className="text-muted">
              <span className="num">{done.size}</span> of <span className="num">{ALL_LESSONS.length}</span> lessons
            </span>
            <span className="num text-muted">{minutesLeft} min left</span>
          </div>
          <Bar heat value={done.size / ALL_LESSONS.length} label="Web dev track progress" />
        </div>
        {next ? (
          <Link href={`/learn/${next.slug}`} className="btn btn-ember relative mt-6">
            {done.size === 0 ? "Start with" : "Continue:"} {next.title} <Icon name="arrow" size={16} />
          </Link>
        ) : (
          <p className="font-display relative mt-6 text-lg font-semibold text-ember">Track complete. Go build something with it.</p>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {modules.map(({ module, done: finished, total }, mi) => (
          <section key={module.slug} className="card glint p-5" aria-labelledby={`m-${module.slug}`}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="num text-sm text-muted">Module {mi + 1}</p>
                <h2 id={`m-${module.slug}`} className="font-display text-xl font-semibold">
                  {module.title}
                </h2>
                <p className="mt-1 text-sm text-muted">{module.blurb}</p>
              </div>
              <span className={`num shrink-0 text-sm ${finished === total ? "text-ember" : "text-muted"}`}>
                {finished}/{total}
              </span>
            </div>
            <div className="mt-4">
              <Bar heat value={finished / total} label={`${module.title} progress`} />
            </div>
            <ul className="mt-3">
              {module.lessons.map((l) => {
                const isDone = done.has(l.slug);
                return (
                  <li key={l.slug}>
                    <Link href={`/learn/${l.slug}`} className="flex min-h-11 items-center gap-3 rounded-lg px-1 text-sm transition-colors hover:bg-panel-2">
                      <span
                        className={`grid size-5 shrink-0 place-items-center rounded-full border ${isDone ? "border-ember bg-ember text-[#2a1105]" : "border-line-strong"}`}
                        aria-hidden
                      >
                        {isDone && <Icon name="check" size={12} />}
                      </span>
                      <span className={`flex-1 ${isDone ? "text-muted" : ""}`}>{l.title}</span>
                      <span className="num text-xs text-muted">{l.minutes} min</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
