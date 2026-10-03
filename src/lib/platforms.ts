// Fetchers for public profile data. Hosts are fixed and handles are validated,
// so a user-supplied handle can never steer a request to another server.

export const HANDLE_RE = /^[A-Za-z0-9_.-]{1,40}$/;

export type LeetCodeStats = {
  total: number;
  easy: number;
  medium: number;
  hard: number;
  ranking: number | null;
  recent: { slug: string; at: number }[];
};
export type CodeforcesStats = { rating: number | null; maxRating: number | null; rank: string | null; solved: number };
export type GithubStats = { repos: number; followers: number; avatar: string };

const TIMEOUT_MS = 8000;

async function getJson(url: string, init?: RequestInit) {
  const res = await fetch(url, { ...init, signal: AbortSignal.timeout(TIMEOUT_MS), cache: "no-store" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function fetchLeetCode(handle: string): Promise<LeetCodeStats> {
  const query = `query($u:String!){
    matchedUser(username:$u){ profile{ ranking } submitStatsGlobal{ acSubmissionNum{ difficulty count } } }
    recentAcSubmissionList(username:$u, limit:20){ titleSlug timestamp }
  }`;
  const json = await getJson("https://leetcode.com/graphql", {
    method: "POST",
    headers: { "Content-Type": "application/json", Referer: "https://leetcode.com" },
    body: JSON.stringify({ query, variables: { u: handle } }),
  });
  const user = json?.data?.matchedUser;
  if (!user) throw new Error("LeetCode user not found");
  const byDiff: Record<string, number> = {};
  for (const row of user.submitStatsGlobal?.acSubmissionNum ?? []) byDiff[row.difficulty] = row.count;
  return {
    total: byDiff.All ?? 0,
    easy: byDiff.Easy ?? 0,
    medium: byDiff.Medium ?? 0,
    hard: byDiff.Hard ?? 0,
    ranking: user.profile?.ranking ?? null,
    recent: (json.data.recentAcSubmissionList ?? []).map((s: { titleSlug: string; timestamp: string }) => ({
      slug: s.titleSlug,
      at: Number(s.timestamp),
    })),
  };
}

export async function fetchCodeforces(handle: string): Promise<CodeforcesStats> {
  const h = encodeURIComponent(handle);
  const info = await getJson(`https://codeforces.com/api/user.info?handles=${h}`);
  if (info.status !== "OK") throw new Error("Codeforces user not found");
  const u = info.result[0];
  const status = await getJson(`https://codeforces.com/api/user.status?handle=${h}&from=1&count=2000`);
  const solved = new Set<string>();
  if (status.status === "OK") {
    for (const s of status.result) {
      if (s.verdict === "OK") solved.add(`${s.problem.contestId}-${s.problem.index}`);
    }
  }
  return { rating: u.rating ?? null, maxRating: u.maxRating ?? null, rank: u.rank ?? null, solved: solved.size };
}

export async function fetchGithub(handle: string): Promise<GithubStats> {
  const u = await getJson(`https://api.github.com/users/${encodeURIComponent(handle)}`, {
    headers: { Accept: "application/vnd.github+json" },
  });
  return { repos: u.public_repos ?? 0, followers: u.followers ?? 0, avatar: u.avatar_url ?? "" };
}
