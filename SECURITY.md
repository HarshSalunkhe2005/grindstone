# Security

Grindstone handles sign-in, personal progress and optional social features, so the defences are layered: no single control is trusted on its own.

## Reporting a problem

Please report vulnerabilities privately through the "Report a vulnerability" button on this repository (Security tab). Do not open a public issue.

## What is in place

**Transport and browser**
- HTTPS only, HSTS with preload.
- A strict, per-request **nonce-based Content-Security-Policy**: `script-src` allows only nonced scripts, with no `unsafe-inline` and no `unsafe-eval` in production; `object-src 'none'`, `frame-ancestors 'none'`, `base-uri` and `form-action` pinned to this site, and `connect-src` limited to this site and the Supabase project. This is the main defence against injected JavaScript.
- `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, a strict `Referrer-Policy`, a locked-down `Permissions-Policy`, and COOP and CORP set to same-origin.
- Signed-in pages and every API response are sent with `no-store`.
- React escapes all output. There is no `dangerouslySetInnerHTML` and no raw HTML anywhere.

**API (`/api/v1`)**
- Every request passes one gate (`src/proxy.ts`): same-origin only (Origin and `Sec-Fetch-Site` checks, which stop CSRF), `application/json` only, bodies over 16 KB refused, and a per-IP burst cap.
- Every handler verifies the session JWT signature, then validates input with a strict zod schema before touching data.
- **Rate limits** are per user and per endpoint, counted in Postgres (`rate_limit_hit`) so every serverless instance shares one count. The username-lookup endpoint has a deliberately tight limit.
- Errors are generic: no stack traces, SQL or internal ids reach the client. Unknown and private usernames get the same answer.

**Database (Supabase Postgres)**
- No SQL is built from strings anywhere. All access goes through the Supabase client (parameterised) or fixed SQL functions with typed arguments.
- Row-level security on every table; users can only read or change their own rows.
- Least-privilege grants on top of RLS: the anonymous role can only read the public roadmap; clients cannot write reference tables, the rate-limit table or friendships directly; XP and review state are derived by triggers and are not writable; a started mock's problems cannot be edited.
- All functions pin `search_path`, trigger functions are not callable over RPC, and the social features are opt-in and expose only name, XP and solved count.
- CHECK constraints and per-user caps back up the application limits.

**Supply chain and secrets**
- No secrets in the repository. Only the Supabase publishable key is used in the browser, and it can do nothing that RLS does not allow. The service-role key is not used by this app at all.
- `npm audit` is clean and Dependabot is enabled.

## Verified, not assumed

A script run against the live database and API checks that each of these is refused or stored as inert text: raising your own XP, editing other users' rows, writing reference tables or the limiter table, inserting friendships directly, calling trigger functions, anonymous reads of every user table, cross-origin writes, oversized and non-JSON bodies, and SQL and HTML injection strings.

## Honest limits

- **DDoS.** Volumetric attacks are absorbed by the hosting platform's network (Vercel's always-on mitigation), not by this code. The app adds per-IP and per-user limits so a flood cannot cheaply exhaust the database. Under a determined attack, turn on Vercel's Attack Challenge Mode and add a WAF rate-limit rule in the dashboard.
- **Sign-in throttling and password rules** are enforced by Supabase Auth. Enable leaked-password protection and a minimum length of 10 in the Supabase dashboard (Authentication, Password security).
- No system is "totally" secure. This is defence in depth, with the common failure modes closed and tested.
