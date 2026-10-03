import type { Metadata } from "next";
import { loadUserContext } from "@/lib/data";
import { SettingsForm } from "./settings-form";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ welcome?: string }> }) {
  const { profile } = await loadUserContext();
  const { welcome } = await searchParams;

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{welcome ? "Set up your profile" : "Settings"}</h1>
        <p className="mt-1 text-muted">
          Handles are public usernames. Saving them lets Grindstone read your public stats; it never asks for a password.
        </p>
      </div>
      <SettingsForm
        initial={{
          displayName: profile.display_name ?? "",
          username: profile.username ?? "",
          language: profile.language,
          leetcodeHandle: profile.leetcode_handle ?? "",
          codeforcesHandle: profile.codeforces_handle ?? "",
          githubHandle: profile.github_handle ?? "",
          targetDate: profile.target_date ?? "",
        }}
      />
    </div>
  );
}
