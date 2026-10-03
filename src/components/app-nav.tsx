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
      <header className="sticky top-0 z-30 border-b border-line bg-bg/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-5">
          <Link href="/today" className="flex min-h-11 items-center gap-2" aria-label="Grindstone, today">
            <Mark />
            <span className="font-display text-xl font-semibold">Grindstone</span>
          </Link>

          <nav aria-label="Main" className="ml-4 hidden flex-1 gap-1 sm:flex">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                aria-current={isActive(l.href) ? "page" : undefined}
                className={`relative flex min-h-11 items-center gap-2 rounded-xl px-3.5 text-sm font-medium transition-colors ${
                  isActive(l.href) ? "bg-panel-2 text-text" : "text-muted hover:text-text"
                }`}
              >
                {l.label}
                {l.href === "/today" && dueCount > 0 && (
                  <span className="num rounded-full bg-ember px-1.5 py-px text-xs font-bold text-[#2a1105]" title={`${dueCount} revisions due`}>
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
              <span className="h-1.5 w-20 overflow-hidden rounded-full bg-bg ring-1 ring-line">
                <span
                  className="block h-full w-full rounded-full"
                  style={{
                    background: "linear-gradient(90deg, #4a5a72, var(--ember-deep) 40%, var(--ember) 75%, var(--ember-hot))",
                    transform: `scaleX(${levelProgress})`,
                    transformOrigin: "left center",
                  }}
                />
              </span>
            </span>
            <button onClick={signOut} className="min-h-11 px-2 text-sm text-muted transition-colors hover:text-text">
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
            className={`relative flex min-h-14 flex-col items-center justify-center gap-1 text-xs font-medium ${
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
