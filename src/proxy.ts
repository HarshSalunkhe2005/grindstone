import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PROTECTED = ["/today", "/roadmap", "/learn", "/mock", "/profile", "/settings", "/welcome", "/log", "/friends", "/report"];

/** Largest JSON body any endpoint accepts. Notes top out around 2 KB. */
const MAX_BODY_BYTES = 16 * 1024;

// A coarse per-IP burst limiter for the API. It is per serverless instance, so it only
// blunts floods; the precise per-user limits live in Postgres (see lib/api.ts).
const bursts = new Map<string, { count: number; resetAt: number }>();
function burst(ip: string, limit = 240, windowMs = 60_000) {
  const now = Date.now();
  if (bursts.size > 5_000) for (const [k, v] of bursts) if (v.resetAt <= now) bursts.delete(k);
  const e = bursts.get(ip);
  if (!e || e.resetAt <= now) {
    bursts.set(ip, { count: 1, resetAt: now + windowMs });
    return 0;
  }
  e.count += 1;
  return e.count > limit ? Math.ceil((e.resetAt - now) / 1000) : 0;
}

function deny(status: number, code: string, message: string, extra?: HeadersInit) {
  return NextResponse.json({ error: { code, message } }, { status, headers: { "Cache-Control": "no-store", ...extra } });
}

/** Gate for /api: same-origin only, JSON only, small bodies, and a per-IP burst cap. */
function guardApi(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const wait = burst(ip);
  if (wait) return deny(429, "rate_limited", "Too many requests. Try again shortly.", { "Retry-After": String(wait) });

  if (["GET", "HEAD", "OPTIONS"].includes(request.method)) return null;

  // CSRF: browsers always send Sec-Fetch-Site and, for non-GET requests, Origin.
  // Anything that is not from this site is refused before it touches a handler.
  const origin = request.headers.get("origin");
  const site = request.headers.get("sec-fetch-site");
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? request.nextUrl.host;
  if (origin) {
    let sameOrigin = false;
    try {
      sameOrigin = new URL(origin).host === host;
    } catch {
      sameOrigin = false;
    }
    if (!sameOrigin) return deny(403, "forbidden_origin", "Cross-site requests are not allowed.");
  } else if (site && site !== "same-origin" && site !== "none") {
    return deny(403, "forbidden_origin", "Cross-site requests are not allowed.");
  }

  if (!(request.headers.get("content-type") ?? "").toLowerCase().startsWith("application/json")) {
    return deny(415, "unsupported_media_type", "Send application/json.");
  }
  const length = Number(request.headers.get("content-length") ?? "0");
  if (length > MAX_BODY_BYTES) return deny(413, "payload_too_large", "Request body is too large.");
  return null;
}

function contentSecurityPolicy(nonce: string) {
  const dev = process.env.NODE_ENV === "development";
  const supabase = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const ws = supabase.replace(/^https:/, "wss:");
  return [
    "default-src 'self'",
    // 'strict-dynamic' lets the nonced bootstrap load Next's chunks; host allow-lists are ignored by modern browsers.
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${dev ? " 'unsafe-eval'" : ""}`,
    `style-src 'self' 'nonce-${nonce}'${dev ? " 'unsafe-inline'" : ""}`,
    // React style={{}} props become style attributes; they cannot run script.
    "style-src-attr 'unsafe-inline'",
    "img-src 'self' blob: data:",
    "font-src 'self'",
    `connect-src 'self' ${supabase} ${ws}${dev ? " ws://localhost:* ws://127.0.0.1:*" : ""}`.trim(),
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "worker-src 'self' blob:",
    "manifest-src 'self'",
    "upgrade-insecure-requests",
  ].join("; ");
}

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;

  if (path.startsWith("/api/")) {
    const blocked = guardApi(request);
    if (blocked) return blocked;
    const res = NextResponse.next();
    res.headers.set("Cache-Control", "no-store");
    return res;
  }

  const nonce = btoa(crypto.randomUUID());
  const csp = contentSecurityPolicy(nonce);
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  let response = NextResponse.next({ request: { headers: requestHeaders } });

  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request: { headers: requestHeaders } });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  // Refreshes the session cookie. getClaims verifies the JWT signature.
  const { data } = await supabase.auth.getClaims();
  const signedIn = Boolean(data?.claims);

  if (!signedIn && PROTECTED.some((p) => path === p || path.startsWith(p + "/"))) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    const redirect = NextResponse.redirect(url);
    redirect.headers.set("Content-Security-Policy", csp);
    return redirect;
  }
  if (signedIn && path === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/today";
    const redirect = NextResponse.redirect(url);
    redirect.headers.set("Content-Security-Policy", csp);
    return redirect;
  }

  response.headers.set("Content-Security-Policy", csp);
  // Pages behind sign-in must never be stored by a shared cache.
  if (PROTECTED.some((p) => path === p || path.startsWith(p + "/"))) response.headers.set("Cache-Control", "private, no-store");
  return response;
}

export const config = {
  matcher: [
    {
      source: "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
