# Grindstone

Placement prep, sharpened. A focused DSA roadmap, a daily plan, streaks and XP, and live stats from the coding platforms you already use.

**Stage 1a (current):** accounts, a 143-problem DSA roadmap across 18 topics, a "Today" screen that picks the next problems, streak / XP / level, an activity heatmap, and profile stats from LeetCode, Codeforces and GitHub.

## Stack

- Next.js 16 (App Router) + TypeScript + Tailwind CSS 4
- Supabase: Postgres + Auth only. All reads and writes go through row-level security.
- Our own REST API under `/api/v1` (validated with zod, one error shape, rate limited)

## Run it

```bash
npm install
cp .env.example .env.local   # fill in your Supabase URL + publishable key
npm run dev
```

The database schema and seed live in `supabase/migrations/` (apply in order).

## API

All responses are `{ "data": ... }` or `{ "error": { "code", "message" } }`.

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/v1/me` | your profile |
| PATCH | `/api/v1/me` | update name, username, language, handles, target date |
| GET | `/api/v1/progress` | problems you have solved |
| POST | `/api/v1/progress` | `{ problemId, solved }` tick or untick one problem |
| POST | `/api/v1/sync` | refresh LeetCode / Codeforces / GitHub stats; recent LeetCode solves tick themselves |

## Security notes

- Every table has RLS on. Progress and stats are owner-only; the roadmap is public read.
- XP cannot be edited by users: the column is not writable, and a server-side trigger derives it from solved problems.
- Platform fetchers call fixed hosts only, and handles are validated, so a handle cannot redirect a request elsewhere.
- Users can edit their own cached platform stats, so rankings must never use `platform_stats`.
- The rate limiter is in memory (fine for one instance); it moves to Redis when the app scales out.

## Roadmap

1b: web-dev track, notes, revision queue (3/7/21 days), weak topics, badges, friends leaderboard (Redis).
1c: 3D landing page and profile visual, motion polish, accessibility and Lighthouse pass, security review.
