"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Icon, Mark, type IconName } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";

const LINKS: { href: string; label: string; icon: IconName }[] = [
  { href: "/today", label: "Today", icon: "bolt" },
  { href: "/roadmap", label: "Roadmap", icon: "tree" },
  { href: "/profile", label: "Profile", icon: "user" },
  { href: "/settings", label: "Settings", icon: "gear" },
];

export function AppNav({
  streak,
  xp,
  levelTitle,
  levelProgress,
  dueCount,
}: {
  streak: number;
  xp: number;
  levelTitle: string;
  levelProgress: number;
  dueCount: number;
}) {
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
      <header className="sticky top-0 z-30 border-b border-line bg-bg/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-5">
          <Link href="/today" className="flex items-center gap-2" aria-label="Grindstone, today">
            <Mark />
            <span className="font-display text-xl font-semibold">Grindstone</span>
          </Link>

          <nav aria-label="Main" className="ml-4 hidden flex-1 gap-1 sm:flex">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                aria-current={isActive(l.href) ? "page" : undefined}
                className={`relative flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-medium transition-colors ${
                  isActive(l.href) ? "bg-panel-2 text-text" : "text-muted hover:text-text"
                }`}
              >
                {l.label}
                {l.href === "/today" && dueCount > 0 && (
                  <span className="num rounded-full bg-arc px-1.5 py-px text-[0.65rem] font-bold text-arc-ink" title={`${dueCount} revisions due`}>
                    {dueCount}
                  </span>
                )}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-4 sm:ml-0">
            <span className="num flex items-center gap-1.5 text-sm" title="Day streak">
              <Icon name="flame" size={17} className={streak > 0 ? "text-ember" : "text-faint"} />
              {streak}
            </span>
            <span className="hidden items-center gap-2.5 md:flex" title={`${xp} XP`}>
              <span className="text-xs font-medium text-muted">{levelTitle}</span>
              <span className="h-1.5 w-20 overflow-hidden rounded-full bg-line">
                <span className="block h-full rounded-full bg-arc" style={{ width: `${Math.round(levelProgress * 100)}%` }} />
              </span>
            </span>
            <button onClick={signOut} className="text-sm text-muted transition-colors hover:text-text">
              Sign out
            </button>
          </div>
        </div>
      </header>

      <nav
        aria-label="Main (mobile)"
        className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t border-line bg-bg/95 pb-[env(safe-area-inset-bottom)] backdrop-blur sm:hidden"
      >
        {LINKS.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            aria-current={isActive(l.href) ? "page" : undefined}
            className={`relative flex flex-col items-center gap-1 py-2.5 text-[0.7rem] font-medium ${
              isActive(l.href) ? "text-arc" : "text-faint"
            }`}
          >
            <Icon name={l.icon} size={20} />
            {l.label}
            {l.href === "/today" && dueCount > 0 && <span className="absolute right-[28%] top-1.5 size-2 rounded-full bg-arc" aria-label={`${dueCount} due`} />}
          </Link>
        ))}
      </nav>
    </>
  );
}
