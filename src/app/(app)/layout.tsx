import { redirect } from "next/navigation";
import { AppNav } from "@/components/app-nav";
import { SparkLayer } from "@/components/spark-layer";
import { ToastHost } from "@/components/toast";
import { loadUserContext } from "@/lib/data";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const ctx = await loadUserContext();
  if (!ctx.profile.onboarded) redirect("/welcome");
  return (
    <>
      <AppNav
        streak={ctx.streak.current}
        xp={ctx.profile.xp}
        levelTitle={ctx.level.title}
        levelProgress={ctx.level.progress}
        dueCount={ctx.dueToday.length}
      />
      <main className="mx-auto w-full max-w-6xl flex-1 px-5 pb-28 pt-8 sm:pb-12">{children}</main>
      <SparkLayer />
      <ToastHost />
    </>
  );
}
