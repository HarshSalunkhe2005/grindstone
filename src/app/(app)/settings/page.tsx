import type { Metadata } from "next";
import { loadUserContext } from "@/lib/data";
import { SettingsForm } from "./settings-form";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const { profile } = await loadUserContext();
  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="font-display text-4xl font-semibold sm:text-5xl">Settings</h1>
        <p className="mt-2 text-muted">Tune the plan to how you actually work.</p>
      </div>
      <SettingsForm
        initial={{
          displayName: profile.display_name ?? "",
          username: profile.username ?? "",
          language: profile.language,
          dailyGoal: profile.daily_goal,
          timezone: profile.timezone,
          targetDate: profile.target_date ?? "",
          leetcodeHandle: profile.leetcode_handle ?? "",
          codeforcesHandle: profile.codeforces_handle ?? "",
          githubHandle: profile.github_handle ?? "",
        }}
      />
    </div>
  );
}
