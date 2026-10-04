# Grindstone

**Placement prep, sharpened.** A DSA roadmap that adapts to you: a plan for today, spaced revision before you forget, weak-topic detection, streaks and XP, and live stats from LeetCode, Codeforces and GitHub. Every problem you solve throws a shower of sparks.

**Live:** https://grindstone-beta.vercel.app

## What it does

- **Today:** one clear next action. Revisions due come first, then new problems from your focus topic, with a daily goal ring, a streak and a level.
- **Spaced revision:** every solve comes back after 1, 3, 7 and 21 days. Rate each one (forgot / got it / easy) and the ladder adapts; finish it and the problem is mastered. At most 8 revisions a day, so a long break never becomes an avalanche.
- **Skill tree roadmap:** 143 problems across 18 topics, laid out as a graph of prerequisites. Cleared threads light up and the focus topic is marked. Search, difficulty and "due for revision" filters, plus a flat list view.
- **Notes and confidence:** write what you learned on any solved problem and mark how well you remember it. Notes reappear when it comes up for revision.
- **Weak-topic detection:** topics with several shaky problems get recommended before you move on.
- **Profile:** weekday-aligned heatmap, difficulty rings with real totals, topic mastery, 11 badges, and cached platform stats.
- **Platform sync:** LeetCode, Codeforces and GitHub. Recent LeetCode solves tick themselves on the roadmap.
- **Onboarding and settings:** language, daily goal, target date, timezone (your streak rolls over at your midnight), and a full data export.

## Stack

Next.js 16 (App Router), TypeScript, Tailwind CSS 4, Supabase (Postgres + Auth, row-level security everywhere), our own REST API under `/api/v1`, and three.js for the landing page's 3D wheel (lazy-loaded, with a reduced-motion and no-WebGL fallback).

## Run it

```bash
npm install
cp .env.example .env.local   # Supabase URL + publishable key
npm run dev
npm test
```

The schema, seed and policies live in `supabase/migrations/` (apply in order).

## API

Responses are `{ "data": ... }` or `{ "error": { "code", "message" } }`.

| Method | Path | Purpose |
| --- | --- | --- |
| GET / PATCH | `/api/v1/me` | profile: name, username, language, handles, target date, daily goal, timezone |
| GET / POST | `/api/v1/progress` | solved problems; tick or untick one |
| POST / PATCH | `/api/v1/mock` | `{ minutes }` start a timed mock (or resume the running one); `{ id, solvedIds, finish? }` tick problems and finish |
| GET / POST / DELETE | `/api/v1/friends` | leaderboard, follow by username, unfollow |
| POST / DELETE | `/api/v1/log` | add or remove an interview-log entry |
| PUT | `/api/v1/lessons` | `{ slug, done }` mark a web-dev lesson done or not (idempotent) |
| POST | `/api/v1/review` | `{ problemId, rating }` record a revision and schedule the next |
| PATCH | `/api/v1/notes` | `{ problemId, notes?, confidence? }` |
| POST | `/api/v1/sync` | refresh platform stats; recent LeetCode solves tick themselves |
| GET | `/api/v1/export` | everything stored about you, as JSON |

## Security notes

- Every table has RLS. Progress and stats are owner-only; the roadmap is public read.
- XP is derived by a server-side trigger and cannot be edited. Users can only update their own notes, confidence, review fields and settings (column-level grants).
- Platform fetchers call fixed hosts and validate handles. Users can edit their own cached platform stats, so rankings must never use `platform_stats`.
- The API rate limiter is in memory (fine for one instance; Redis when it scales out).

## Roadmap

Done: a web-dev track (`/learn`): 8 modules, 24 short lessons on HTTP and REST, indexing, transactions, Redis, auth, security, performance and reliability, each with an exercise and primary sources. Lesson text lives in `src/content/lessons.ts`; completion is stored per user in `user_lessons` (migration 006) and written through `PUT /api/v1/lessons`.

Done: timed mock interviews (`/mock`): a 45, 60 or 90 minute round of unsolved problems from topics you have started, with a server-side clock, difficulty-weighted score and history. Finishing a round records the solves as progress (XP, revision ladder).

Done: an opt-in friends leaderboard (`/friends`, Postgres functions, no one is visible unless they switch it on) and a private interview log (`/log`) for questions met in real interviews.

Hardening is described in [SECURITY.md](SECURITY.md); `scripts/security-check.py` attacks the live database and API and fails if anything gets through.
