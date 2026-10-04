import type { Metadata } from "next";
import Link from "next/link";
import { loadUserContext } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";
import { FriendsClient, type BoardRow } from "./friends-client";

export const metadata: Metadata = { title: "Friends" };

export default async function FriendsPage() {
  const { profile } = await loadUserContext();
  const supabase = await createClient();
  const { data } = await supabase.rpc("friend_board");
  const rows = (data ?? []) as BoardRow[];
  const visible = Boolean(profile.leaderboard_visible) && Boolean(profile.username);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-4xl font-semibold sm:text-5xl">Friends</h1>
        <p className="mt-2 max-w-xl text-muted">
          A leaderboard that is only ever you and the people you chose to follow, ranked by XP. Nobody appears unless they opted in.
        </p>
      </div>

      {!visible && (
        <div className="card card-hero flex flex-wrap items-center justify-between gap-4 p-5">
          <p className="max-w-lg text-sm">
            Friends cannot find you yet. Pick a username and switch on the leaderboard in Settings so they can follow you.
          </p>
          <Link href="/settings" className="btn btn-ember btn-sm">
            Open settings
          </Link>
        </div>
      )}

      <FriendsClient rows={rows} />
    </div>
  );
}
