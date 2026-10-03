"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const LINKS = [
  { href: "/today", label: "Today" },
  { href: "/roadmap", label: "Roadmap" },
  { href: "/profile", label: "Profile" },
  { href: "/settings", label: "Settings" },
];

export function AppNav({ streak, xp, levelTitle }: { streak: number; xp: number; levelTitle: string }) {
  const pathname = usePathname();
  const router = useRouter();

  async function signOut() {
    await createClient().auth.signOut();
    router.replace("/");
    router.refresh();
  }

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  return (
    <>
      <header className="sticky top-0 z-10 border-b border-line bg-bg/85 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-5 py-3">
          <Link href="/today" className="mr-2 text-lg font-bold tracking-tight">
            Grind<span className="text-spark">stone</span>
          </Link>
          <nav aria-label="Main" className="hidden flex-1 gap-1 sm:flex">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                aria-current={isActive(l.href) ? "page" : undefined}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  isActive(l.href) ? "bg-surface-2 text-text" : "text-muted hover:text-text"
                }`}
              >
                {l.label}
              </Link>
            ))}
          </nav>
          <div className="num ml-auto flex items-center gap-3 text-sm sm:ml-0">
            <span title="Day streak">🔥 {streak}</span>
            <span className="hidden text-muted sm:inline">
              {levelTitle} · {xp} XP
            </span>
          </div>
          <button onClick={signOut} className="text-sm text-muted hover:text-text">
            Sign out
          </button>
        </div>
      </header>

      <nav
        aria-label="Main (mobile)"
        className="fixed inset-x-0 bottom-0 z-10 grid grid-cols-4 border-t border-line bg-bg/95 pb-[env(safe-area-inset-bottom)] backdrop-blur sm:hidden"
      >
        {LINKS.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            aria-current={isActive(l.href) ? "page" : undefined}
            className={`py-3.5 text-center text-xs font-medium ${isActive(l.href) ? "text-spark" : "text-muted"}`}
          >
            {l.label}
          </Link>
        ))}
      </nav>
    </>
  );
}
