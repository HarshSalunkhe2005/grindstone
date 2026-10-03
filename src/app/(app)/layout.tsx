import { AppNav } from "@/components/app-nav";
import { loadUserContext } from "@/lib/data";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const ctx = await loadUserContext();
  return (
    <>
      <AppNav streak={ctx.streak} xp={ctx.profile.xp} levelTitle={ctx.level.title} />
      <main className="mx-auto w-full max-w-5xl flex-1 px-5 pb-28 pt-8 sm:pb-8">{children}</main>
    </>
  );
}
