import Link from "next/link";

const FEATURES = [
  ["A roadmap that ends", "143 hand-picked problems across 18 topics, in the order that makes each one easier."],
  ["Today, decided", "Open the app and the next three problems are already chosen. No browsing, no guilt."],
  ["Your profiles, one place", "LeetCode, Codeforces and GitHub stats pulled in and kept fresh."],
  ["Streaks that mean it", "XP, levels and a heatmap that only move when you actually solve."],
];

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-5 py-8">
      <header className="flex items-center justify-between">
        <span className="text-lg font-bold tracking-tight">
          Grind<span className="text-spark">stone</span>
        </span>
        <Link href="/login" className="btn btn-ghost">
          Sign in
        </Link>
      </header>

      <section className="flex flex-1 flex-col justify-center py-20">
        <p className="num mb-4 text-sm text-spark">PLACEMENT PREP, SHARPENED</p>
        <h1 className="max-w-3xl text-5xl font-bold leading-[1.05] tracking-tight sm:text-7xl">
          Get good at DSA by showing up every day.
        </h1>
        <p className="mt-6 max-w-xl text-lg text-muted">
          A focused roadmap, a plan for today, and proof of progress from the platforms you already use.
        </p>
        <div className="mt-9 flex gap-3">
          <Link href="/login" className="btn btn-spark">
            Start grinding
          </Link>
          <a href="#how" className="btn btn-ghost">
            How it works
          </a>
        </div>
      </section>

      <section id="how" className="grid gap-4 pb-16 sm:grid-cols-2">
        {FEATURES.map(([title, body]) => (
          <div key={title} className="card p-6">
            <h2 className="font-semibold">{title}</h2>
            <p className="mt-2 text-sm text-muted">{body}</p>
          </div>
        ))}
      </section>
    </main>
  );
}
