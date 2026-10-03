import type { Metadata } from "next";
import Link from "next/link";
import { Mark, WheelArt } from "@/components/ui";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <main className="mx-auto grid w-full max-w-5xl flex-1 items-center gap-10 px-5 py-10 lg:grid-cols-[1.05fr_1fr]">
      <section className="card card-hero relative hidden min-h-[30rem] overflow-hidden p-9 lg:block" aria-label="About Grindstone">
        <WheelArt className="pointer-events-none absolute -bottom-32 -right-24 size-[28rem]" />
        <Link href="/" className="relative flex items-center gap-2" aria-label="Grindstone home">
          <Mark size={30} />
          <span className="font-display text-2xl font-semibold">Grindstone</span>
        </Link>
        <h2 className="font-display relative mt-14 max-w-xs text-4xl font-semibold leading-tight">Every problem you solve throws a spark.</h2>
        <p className="relative mt-4 max-w-xs text-muted">A DSA roadmap that adapts to you, with spaced revision so what you learn stays sharp.</p>
      </section>
      <div>
        <Link href="/" className="mb-8 flex items-center gap-2 lg:hidden" aria-label="Grindstone home">
          <Mark />
          <span className="font-display text-xl font-semibold">Grindstone</span>
        </Link>
        <LoginForm />
      </div>
    </main>
  );
}
