import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Every API response uses one of two shapes: { data } or { error: { code, message } }.
export function ok<T>(data: T, status = 200) {
  return NextResponse.json({ data }, { status });
}

export function fail(status: number, code: string, message: string, headers?: HeadersInit) {
  return NextResponse.json({ error: { code, message } }, { status, headers });
}

// Fixed-window limiter held in memory. Good enough for one server instance;
// it moves to Redis when the app runs on more than one (stage 1b).
const hits = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const entry = hits.get(key);
  if (!entry || entry.resetAt <= now) {
    hits.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfter: 0 };
  }
  entry.count += 1;
  if (entry.count > limit) {
    return { allowed: false, retryAfter: Math.ceil((entry.resetAt - now) / 1000) };
  }
  return { allowed: true, retryAfter: 0 };
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
