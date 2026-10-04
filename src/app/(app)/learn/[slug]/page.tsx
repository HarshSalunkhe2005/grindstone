import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Icon } from "@/components/ui";
import { ALL_LESSONS, findLesson } from "@/content/lessons";
import { loadCompletedLessons } from "@/lib/learn";
import { CompleteButton } from "./complete-button";

/** Renders `inline code` spans from the lesson text. */
function Rich({ text }: { text: string }) {
  return (
    <>
      {text.split("`").map((part, i) =>
        i % 2 === 1 ? (
          <code key={i} className="num rounded-md border border-line bg-bg px-1.5 py-0.5 text-[0.9em] text-ember-hot">
            {part}
          </code>
        ) : (
          part
        ),
      )}
    </>
  );
}

export function generateStaticParams() {
  return ALL_LESSONS.map((l) => ({ slug: l.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const found = findLesson(slug);
  return { title: found ? found.lesson.title : "Lesson" };
}

export default async function LessonPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const found = findLesson(slug);
  if (!found) notFound();
  const { lesson, prev, next, position, total } = found;
  const done = (await loadCompletedLessons()).has(lesson.slug);

  return (
    <article className="mx-auto max-w-3xl space-y-6">
      <Link href="/learn" className="inline-flex min-h-11 items-center gap-1.5 text-sm text-muted hover:text-text">
        <Icon name="arrow" size={14} className="rotate-180" /> All modules
      </Link>

      <header>
        <p className="num text-sm text-ember">
          {lesson.module.title} · lesson {lesson.index + 1} of {lesson.module.lessons.length} · {lesson.minutes} min
        </p>
        <h1 className="font-display mt-2 text-4xl font-semibold sm:text-5xl">{lesson.title}</h1>
        <p className="mt-4 text-lg leading-8 text-muted"><Rich text={lesson.summary} /></p>
      </header>

      <section className="card p-6" aria-labelledby="points">
        <h2 id="points" className="font-display mb-4 text-xl font-semibold">
          What to know
        </h2>
        <ol className="space-y-4">
          {lesson.points.map((p, i) => (
            <li key={i} className="flex gap-4">
              <span className="num grid size-7 shrink-0 place-items-center rounded-lg border border-line-strong text-sm text-muted">{i + 1}</span>
              <p className="leading-7"><Rich text={p} /></p>
            </li>
          ))}
        </ol>
      </section>

      <section className="card card-hero p-6" aria-labelledby="pitfall">
        <h2 id="pitfall" className="font-display text-xl font-semibold text-ember">
          The classic mistake
        </h2>
        <p className="mt-2 leading-7"><Rich text={lesson.pitfall} /></p>
      </section>

      <section className="card p-6" aria-labelledby="exercise">
        <h2 id="exercise" className="font-display text-xl font-semibold">
          Try it
        </h2>
        <p className="mt-2 leading-7 text-muted"><Rich text={lesson.exercise} /></p>
      </section>

      <section aria-labelledby="sources">
        <h2 id="sources" className="font-display mb-2 text-xl font-semibold">
          Read the source
        </h2>
        <ul>
          {lesson.links.map((l) => (
            <li key={l.url}>
              <a href={l.url} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-2 text-arc underline underline-offset-4">
                {l.label} <Icon name="external" size={14} />
              </a>
            </li>
          ))}
        </ul>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-6">
        <CompleteButton slug={lesson.slug} initiallyDone={done} nextHref={next ? `/learn/${next.slug}` : "/learn"} />
        <span className="num text-sm text-muted">
          {position} of {total}
        </span>
      </div>

      <nav className="grid gap-3 sm:grid-cols-2" aria-label="Lesson navigation">
        {prev ? (
          <Link href={`/learn/${prev.slug}`} className="card card-lift p-4">
            <p className="text-sm text-muted">Previous</p>
            <p className="font-medium">{prev.title}</p>
          </Link>
        ) : (
          <span />
        )}
        {next && (
          <Link href={`/learn/${next.slug}`} className="card card-lift p-4 sm:text-right">
            <p className="text-sm text-muted">Next</p>
            <p className="font-medium">{next.title}</p>
          </Link>
        )}
      </nav>
    </article>
  );
}
