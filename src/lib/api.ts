import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Every API response uses one of two shapes: { data } or { error: { code, message } }.
export function ok<T>(data: T, status = 200) {
  return NextResponse.json({ data }, { status });
}

export function fail(status: number, code: string, message: string, headers?: HeadersInit) {
  return NextResponse.json({ error: { code, message } }, { status, headers });
}

type Db = Awaited<ReturnType<typeof createClient>>;

// Per-instance fallback, used only if the shared limiter cannot be reached.
const hits = new Map<string, { count: number; resetAt: number }>();
function localLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const entry = hits.get(key);
  if (!entry || entry.resetAt <= now) {
    hits.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfter: 0 };
  }
  entry.count += 1;
  return entry.count > limit ? { allowed: false, retryAfter: Math.ceil((entry.resetAt - now) / 1000) } : { allowed: true, retryAfter: 0 };
}

/**
 * Fixed-window limiter per signed-in user and bucket. Counters live in Postgres
 * (rate_limit_hit, security definer, keyed on auth.uid()) so every serverless
 * instance sees the same count. Falls back to local memory if the database
 * call fails, so a hiccup never turns into an open door.
 */
export async function rateLimit(supabase: Db, bucket: string, limit: number, windowMs: number) {
  const { data, error } = await supabase.rpc("rate_limit_hit", { p_bucket: bucket, p_limit: limit, p_window_seconds: Math.round(windowMs / 1000) });
  const row = Array.isArray(data) ? data[0] : data;
  if (error || !row) return localLimit(bucket, limit, windowMs);
  return { allowed: Boolean(row.allowed), retryAfter: Number(row.retry_after) || 0 };
}

export async function requireUser() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (!userId) return { supabase, userId: null as null };
  return { supabase, userId };
}

export function tooMany(retryAfter: number) {
  return fail(429, "rate_limited", "Too many requests. Try again shortly.", {
    "Retry-After": String(retryAfter),
  });
}

/** Parses a JSON body, refusing anything over 16 KB even when it arrives without a Content-Length. */
export async function readJson(request: Request): Promise<unknown> {
  try {
    const text = await request.text();
    if (text.length > 16 * 1024) return null;
    return JSON.parse(text);
  } catch {
    return null;
  }
}
