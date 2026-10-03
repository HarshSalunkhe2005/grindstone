import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Mark } from "@/components/ui";
import { loadUserContext } from "@/lib/data";
import { WelcomeFlow } from "./welcome-flow";

export const metadata: Metadata = { title: "Welcome" };

export default async function WelcomePage() {
  const { profile } = await loadUserContext();
  if (profile.onboarded) redirect("/today");
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center px-5 py-10">
      <div className="mb-8 flex items-center gap-2">
        <Mark />
        <span className="font-display text-xl font-semibold">Grindstone</span>
      </div>
      <WelcomeFlow name={(profile.display_name ?? "").split(" ")[0]} />
    </main>
  );
}
