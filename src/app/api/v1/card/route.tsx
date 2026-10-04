import { ImageResponse } from "next/og";
import { fail, rateLimit, requireUser, tooMany } from "@/lib/api";
import { DEFAULT_TZ, addDays, dayKey, freezeBudget, levelFor, streaks } from "@/lib/game";

const HEAT = ["#1c212c", "#6b4a33", "#a8652f", "#e07a2f", "#ffd9a8"];

// GET /api/v1/card -> a 1200x630 share image of your level, streak and recent activity.
export async function GET() {
  const { supabase, userId } = await requireUser();
  if (!userId) return fail(401, "unauthorized", "Sign in first.");
  const limit = await rateLimit(supabase, "card", 10, 60_000);
  if (!limit.allowed) return tooMany(limit.retryAfter);

  const [profileRes, solvesRes] = await Promise.all([
    supabase.from("profiles").select("display_name, username, xp, timezone").eq("id", userId).single(),
    supabase.from("user_problems").select("solved_at").eq("user_id", userId),
  ]);
  if (profileRes.error || !profileRes.data) return fail(500, "db_error", "Could not build your card.");
  const profile = profileRes.data;
  const tz = profile.timezone || DEFAULT_TZ;

  const perDay = new Map<string, number>();
  for (const r of solvesRes.data ?? []) perDay.set(dayKey(r.solved_at, tz), (perDay.get(dayKey(r.solved_at, tz)) ?? 0) + 1);
  const days = new Set(perDay.keys());
  const streak = streaks(days, new Date(), tz, freezeBudget(days.size));
  const level = levelFor(profile.xp);
  const today = dayKey(new Date(), tz);

  // 16 weeks, Monday-first columns, ending with the current week.
  const dow = (new Date(`${today}T00:00:00Z`).getUTCDay() + 6) % 7;
  const start = addDays(today, -dow - 15 * 7);
  const cols = Array.from({ length: 16 }, (_, w) =>
    Array.from({ length: 7 }, (_, d) => {
      const day = addDays(start, w * 7 + d);
      const n = perDay.get(day) ?? 0;
      return { future: day > today, level: n === 0 ? 0 : n === 1 ? 1 : n === 2 ? 2 : n <= 4 ? 3 : 4 };
    }),
  );

  const name = profile.display_name || profile.username || "A Grindstone learner";

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 64, background: "#080a0e", color: "#e8edf4", fontFamily: "sans-serif" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", fontSize: 34, fontWeight: 700 }}>Grindstone</div>
          <div style={{ display: "flex", fontSize: 26, color: "#a3adbf" }}>{name}</div>
        </div>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", fontSize: 28, color: "#ff8a3d" }}>Level {level.level}</div>
            <div style={{ display: "flex", fontSize: 96, fontWeight: 700, lineHeight: 1.05 }}>{level.title}</div>
            <div style={{ display: "flex", marginTop: 28, fontSize: 34, color: "#a3adbf" }}>
              {streak.current} day streak  ·  {days.size} active days  ·  {profile.xp} XP
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {cols.map((col, c) => (
              <div key={c} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {col.map((cell, r) => (
                  <div key={r} style={{ width: 22, height: 22, borderRadius: 5, background: cell.future ? "transparent" : HEAT[cell.level] }} />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630, headers: { "Cache-Control": "no-store", "Content-Disposition": 'attachment; filename="grindstone-card.png"' } },
  );
}
