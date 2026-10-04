"""Security smoke test: attacks the database and API the way a malicious signed-in user or an anonymous
visitor would, and fails if any attack succeeds.

Usage:  DEMO_EMAIL=... DEMO_PASSWORD=... python scripts/security-check.py https://your-site
Needs a throwaway account; it only ever writes inert test rows and removes them.
"""
import base64, json, os, sys, urllib.request, urllib.error

REF = os.environ["SUPABASE_REF"]
KEY = os.environ["SUPABASE_PUBLISHABLE_KEY"]
BASE = sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:3000"
REST = f"https://{REF}.supabase.co/rest/v1"


def http(method, url, headers=None, body=None):
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(url, data=data, method=method, headers=headers or {})
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            return r.status, r.read().decode()[:20000]
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode()[:20000]


def login(email, pw):
    s, b = http("POST", f"https://{REF}.supabase.co/auth/v1/token?grant_type=password", {"apikey": KEY, "content-type": "application/json"}, {"email": email, "password": pw})
    return json.loads(b)


sess = login(os.environ["DEMO_EMAIL"], os.environ["DEMO_PASSWORD"])
tok = sess["access_token"]
uid = sess["user"]["id"]
H = {"apikey": KEY, "Authorization": f"Bearer {tok}", "content-type": "application/json", "Prefer": "return=representation"}
A = {"apikey": KEY, "content-type": "application/json"}  # anonymous

results = []


def check(name, got, want):
    ok = got in want if isinstance(want, (list, tuple, set)) else got == want
    results.append((ok, name, got))


# --- as a signed-in user trying to cheat ---
s, b = http("PATCH", f"{REST}/profiles?id=eq.{uid}", H, {"xp": 999999})
check("raise own XP directly", s, {401, 403})  # column has no UPDATE grant
s, b = http("PATCH", f"{REST}/profiles?id=neq.{uid}", H, {"display_name": "pwned"})
check("edit someone else's profile touches 0 rows", (s, b.strip() in ("[]", "")), [(200, True)])
s, b = http("GET", f"{REST}/profiles?select=id,username,xp", H)
check("read all profiles sees only own row", len(json.loads(b)) if s == 200 else -1, 1)
s, b = http("GET", f"{REST}/user_problems?select=user_id&user_id=neq.{uid}", H)
check("read others' progress returns nothing", json.dumps(json.loads(b)) if s == 200 else s, ["[]"])
s, b = http("POST", f"{REST}/friendships", H, {"user_id": uid, "friend_id": uid})
check("insert a friendship directly", s, {401, 403})
s, b = http("GET", f"{REST}/rate_limits?select=*", H)
check("read the rate limit table", s, {401, 403})
s, b = http("POST", f"{REST}/rate_limits", H, {"bucket": "x", "window_start": "2026-01-01T00:00:00Z", "hits": 0})
check("write the rate limit table", s, {401, 403})
s, b = http("POST", f"{REST}/topics", H, {"slug": "evil", "title": "evil", "track": "dsa", "position": 99})
check("insert a topic", s, {401, 403})
s, b = http("PATCH", f"{REST}/problems?id=eq.1", H, {"title": "pwned"})
check("edit a problem", s, {401, 403})
s, b = http("DELETE", f"{REST}/problems?id=eq.1", H)
check("delete a problem", s, {401, 403})
s, b = http("POST", f"{REST}/rpc/sync_xp", H, {})
check("call trigger fn as RPC", s, {401, 403, 404})
s, b = http("POST", f"{REST}/rpc/rate_limit_hit", H, {"p_bucket": "x" * 100, "p_limit": 5, "p_window_seconds": 60})
check("rate_limit_hit rejects oversized bucket", s, {400, 500, 404})
s, b = http("POST", f"{REST}/mock_attempts", H, {"user_id": uid, "duration_min": 60, "problem_ids": [1], "finished_at": "2026-01-01T00:00:00Z"})
check("insert an already-finished mock", s, {400, 401, 403})
s, b = http("PATCH", f"{REST}/user_lessons?lesson_slug=eq.http-basics", H, {"user_id": "00000000-0000-0000-0000-000000000000"})
check("hand a lesson row to another user", s, {401, 403})
s, b = http("POST", f"{REST}/interview_log", H, {"user_id": "00000000-0000-0000-0000-000000000000", "company": "x", "question": "y"})
check("write a log row as someone else", s, {401, 403})
s, b = http("POST", f"{REST}/interview_log", H, {"user_id": uid, "company": "x" * 200, "question": "y"})
check("oversized company rejected by CHECK", s, {400})
s, b = http("POST", f"{REST}/interview_log", H, {"user_id": uid, "company": "'; drop table profiles;--", "round": "dsa", "question": "<script>alert(1)</script>"})
inj_id = json.loads(b)[0]["id"] if s == 201 else None
check("injection strings stored as inert data", s, 201)
s, b = http("GET", f"{REST}/profiles?select=id&limit=1", H)
check("profiles table survived the injection string", s, 200)
if inj_id:
    http("DELETE", f"{REST}/interview_log?id=eq.{inj_id}", H)

# --- anonymous visitor ---
for t in ["profiles", "user_problems", "user_lessons", "mock_attempts", "friendships", "interview_log", "platform_stats", "rate_limits"]:
    s, b = http("GET", f"{REST}/{t}?select=*", A)
    check(f"anon reads {t}", s, {401, 403})
s, b = http("POST", f"{REST}/rpc/friend_board", A, {})
check("anon calls friend_board", s, {401, 403, 404})
s, b = http("POST", f"{REST}/rpc/add_friend", A, {"p_username": "demo"})
check("anon calls add_friend", s, {401, 403, 404})
s, b = http("GET", f"{REST}/topics?select=id&limit=1", A)
check("anon can still read public roadmap", s, 200)

# --- the app's own API ---
O = {"origin": BASE, "content-type": "application/json"}
cookie = "base64-" + base64.urlsafe_b64encode(json.dumps(sess).encode()).decode().rstrip("=")
C = {**O, "Cookie": f"sb-{REF}-auth-token={cookie}"}
s, b = http("PUT", f"{BASE}/api/v1/lessons", {**C, "origin": "https://evil.example"}, {"slug": "http-basics", "done": True})
check("API cross-origin write", s, 403)
s, b = http("POST", f"{BASE}/api/v1/friends", C, {"username": "' or 1=1 --"})
check("friends API rejects SQL-looking username", s, 400)
s, b = http("POST", f"{BASE}/api/v1/friends", C, {"username": "nobody_here"})
check("friends API: unknown user is a plain 404", s, 404)
s, b = http("POST", f"{BASE}/api/v1/log", C, {"company": "A", "round": "dsa", "question": "q", "askedOn": "2026-02-30"})
check("log API rejects impossible date", s, {400})
s, b = http("POST", f"{BASE}/api/v1/log", C, {"company": "A", "round": "bogus", "question": "q", "askedOn": "2026-01-01"})
check("log API rejects unknown round", s, 400)
s, b = http("PATCH", f"{BASE}/api/v1/me", C, {"xp": 5000})
check("me API ignores xp", s, 400)  # unknown-only body leaves nothing to update

fails = [r for r in results if not r[0]]
for ok, name, got in results:
    print(("PASS " if ok else "FAIL ") + name + f"   [{got}]")
print(f"\n{len(results) - len(fails)}/{len(results)} passed")
sys.exit(1 if fails else 0)
