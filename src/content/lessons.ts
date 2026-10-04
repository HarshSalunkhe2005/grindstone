/**
 * The web-dev track: short original notes, one exercise each, and a couple of
 * primary sources. Written to be read in five minutes and acted on straight away.
 * Only completion lives in the database (user_lessons); the words live here so
 * they are versioned with the code.
 */

export interface Lesson {
  slug: string;
  title: string;
  minutes: number;
  summary: string;
  points: string[];
  pitfall: string;
  exercise: string;
  links: { label: string; url: string }[];
}

export interface Module {
  slug: string;
  title: string;
  blurb: string;
  lessons: Lesson[];
}

const MDN = "https://developer.mozilla.org/en-US/docs/Web/HTTP";
const PG = "https://www.postgresql.org/docs/current";
const REDIS = "https://redis.io/docs/latest";
const OWASP = "https://cheatsheetseries.owasp.org/cheatsheets";

export const MODULES: Module[] = [
  {
    slug: "http-rest",
    title: "HTTP and REST",
    blurb: "What actually crosses the wire, and how to design an API people can guess.",
    lessons: [
      {
        slug: "http-basics",
        title: "HTTP in one sitting",
        minutes: 6,
        summary: "Every web request is a method, a path, headers and an optional body; every response is a status, headers and a body. Everything else is convention.",
        points: [
          "GET reads, POST creates, PUT replaces, PATCH changes part of something, DELETE removes. GET, PUT and DELETE should be safe to repeat.",
          "Headers carry the metadata: Content-Type says what the body is, Authorization says who is asking, Cache-Control says how long to keep it.",
          "HTTP is stateless. The server forgets you between requests, which is why cookies and tokens exist.",
          "HTTPS wraps the same messages in TLS. Nothing about the API changes; eavesdroppers just see noise.",
        ],
        pitfall: "Using GET for anything that changes data. Browsers prefetch GETs and crawlers follow them, so a link can delete your records.",
        exercise: "Run `curl -i https://example.com` and read every line of the response. Then repeat it with `-X POST` and compare the status.",
        links: [{ label: "MDN: An overview of HTTP", url: `${MDN}/Overview` }, { label: "MDN: Request methods", url: `${MDN}/Methods` }],
      },
      {
        slug: "rest-design",
        title: "Designing a REST API",
        minutes: 7,
        summary: "Model your API around nouns, not actions. Collections and items, plain HTTP methods, and responses shaped the same way every time.",
        points: [
          "Use plural nouns: `/problems`, `/problems/42`. The method is the verb, so there is no `/getProblem`.",
          "Version from day one (`/api/v1`). Adding a field is safe; renaming or removing one is a new version.",
          "Return the same envelope everywhere, for example `{ data }` on success and `{ error: { code, message } }` on failure.",
          "Validate every input at the edge and reject early. Never trust types you did not check.",
        ],
        pitfall: "Leaking your database shape. If a column rename breaks every client, the API is just your schema in disguise.",
        exercise: "Sketch five endpoints for a to-do app on paper: method, path, request body, success response, two failure responses.",
        links: [{ label: "MDN: HTTP request methods", url: `${MDN}/Methods` }, { label: "OWASP: REST security", url: `${OWASP}/REST_Security_Cheat_Sheet.html` }],
      },
      {
        slug: "status-and-errors",
        title: "Status codes and honest errors",
        minutes: 5,
        summary: "The status code is the first thing a client reads. Pick the right family and the client can react without parsing your message.",
        points: [
          "2xx worked, 3xx look elsewhere, 4xx your request was wrong, 5xx our server failed. Retrying a 4xx never helps; retrying a 5xx sometimes does.",
          "401 means not signed in, 403 means signed in but not allowed, 404 means not there, 409 means conflict, 422 or 400 means the input was invalid, 429 means slow down.",
          "Send a stable machine code (`rate_limited`) and a human message. Clients branch on the first and show the second.",
          "Never put stack traces or SQL in an error body. Log them on the server and return a request id.",
        ],
        pitfall: "Answering 200 with `{ ok: false }`. Monitoring, caches and clients all trust the status line.",
        exercise: "List every way one endpoint of yours can fail, then give each failure its status code and error code.",
        links: [{ label: "MDN: HTTP response status codes", url: `${MDN}/Status` }],
      },
    ],
  },
  {
    slug: "indexing",
    title: "Database indexing",
    blurb: "Why one query takes 2 ms and its twin takes 2 seconds.",
    lessons: [
      {
        slug: "btree-indexes",
        title: "What an index really is",
        minutes: 6,
        summary: "An index is a sorted copy of some columns with pointers back to the rows, so the database can binary-search instead of reading the whole table.",
        points: [
          "Without an index, a filter on a big table is a sequential scan: read every row. With one, it is a few page reads.",
          "The default B-tree index handles equality and ranges (`=`, `<`, `BETWEEN`, `ORDER BY`).",
          "Primary keys and unique constraints already create an index. Foreign keys do not; index them yourself.",
          "Every index costs disk space and slows writes, because each insert or update must maintain it.",
        ],
        pitfall: "Indexing every column 'just in case'. Writes pay for each one and the planner may still ignore most of them.",
        exercise: "Create a table with 500,000 generated rows, time a filter on an unindexed column, add an index, and time it again.",
        links: [{ label: "PostgreSQL: Indexes", url: `${PG}/indexes.html` }],
      },
      {
        slug: "explain-analyze",
        title: "Reading EXPLAIN ANALYZE",
        minutes: 7,
        summary: "EXPLAIN shows the plan the database chose; ANALYZE actually runs it and reports real timings. It is how you stop guessing.",
        points: [
          "Look for `Seq Scan` on large tables, big gaps between estimated and actual rows, and nested loops with huge loop counts.",
          "`Index Scan` and `Index Only Scan` are the good outcomes; `Bitmap Heap Scan` is a middle ground for many matches.",
          "The planner uses statistics. After big data changes, `ANALYZE` refreshes them and plans can flip.",
          "Measure before and after. An index that does not change the plan was not the fix.",
        ],
        pitfall: "Testing on ten rows. Plans on tiny tables prefer scans, so your index looks useless until production data arrives.",
        exercise: "Take your slowest query, run `EXPLAIN (ANALYZE, BUFFERS)` on it, and write down which node costs the most time.",
        links: [{ label: "PostgreSQL: Using EXPLAIN", url: `${PG}/using-explain.html` }],
      },
      {
        slug: "composite-indexes",
        title: "Composite and covering indexes",
        minutes: 6,
        summary: "One index over several columns can serve a whole query, but only if its column order matches how you filter and sort.",
        points: [
          "An index on (a, b) helps filters on `a` or on `a` and `b`. It does not help a filter on `b` alone.",
          "Put equality columns first and the range or sort column last.",
          "A covering index includes every column the query reads, so the table is never touched (an index-only scan).",
          "A partial index (`WHERE active`) stays small when you only ever query a slice of the table.",
        ],
        pitfall: "Duplicating indexes. An index on (a, b) already makes a separate index on (a) redundant.",
        exercise: "For `WHERE user_id = ? ORDER BY created_at DESC LIMIT 20`, design the one index that serves it, then prove it with EXPLAIN.",
        links: [{ label: "PostgreSQL: Multicolumn indexes", url: `${PG}/indexes-multicolumn.html` }],
      },
    ],
  },
  {
    slug: "transactions",
    title: "Transactions and consistency",
    blurb: "How to keep data correct when many things happen at once.",
    lessons: [
      {
        slug: "acid",
        title: "ACID without the jargon",
        minutes: 5,
        summary: "A transaction groups statements so they all happen or none do, and so other sessions never see a half-finished state.",
        points: [
          "Atomic: all or nothing. Consistent: constraints always hold. Isolated: concurrent work does not collide. Durable: committed means saved.",
          "Wrap related writes in one transaction: moving money means debit and credit commit together.",
          "Keep transactions short. A long one holds locks and blocks everyone behind it.",
          "Constraints (unique, foreign key, check) are the last line of defence; code can be wrong, the database refuses.",
        ],
        pitfall: "Doing a slow network call inside an open transaction. The locks stay held while you wait.",
        exercise: "Write a transfer between two accounts in SQL with BEGIN/COMMIT, then make the second statement fail and watch the first roll back.",
        links: [{ label: "PostgreSQL: Transactions", url: `${PG}/tutorial-transactions.html` }],
      },
      {
        slug: "isolation-levels",
        title: "Isolation levels and races",
        minutes: 7,
        summary: "Isolation decides what one transaction can see of another's work. Weaker levels are faster and allow more surprising anomalies.",
        points: [
          "Read committed (the Postgres default) sees only committed rows, but a row can change between two reads in one transaction.",
          "Repeatable read gives you a stable snapshot. Serializable behaves as if transactions ran one at a time, and may ask you to retry.",
          "The classic race: read a balance, add to it in code, write it back. Two requests overwrite each other.",
          "Fix it with an atomic update (`SET n = n + 1`), a row lock (`SELECT ... FOR UPDATE`), or a retry on serialization failure.",
        ],
        pitfall: "Read-modify-write in application code. It passes every single-user test and fails under load.",
        exercise: "Open two psql sessions and reproduce a lost update on a counter, then fix it with an atomic UPDATE.",
        links: [{ label: "PostgreSQL: Transaction isolation", url: `${PG}/transaction-iso.html` }],
      },
      {
        slug: "idempotency",
        title: "Idempotency and retries",
        minutes: 5,
        summary: "Networks fail halfway, so clients retry. An idempotent operation gives the same result no matter how many times it runs.",
        points: [
          "PUT and DELETE are idempotent by design. POST is not, so a retried payment can charge twice.",
          "Give each create request a client-generated idempotency key and store the result under it.",
          "A unique constraint is a cheap idempotency tool: the second insert fails cleanly instead of duplicating.",
          "Retry with exponential backoff and jitter so a recovering server is not stampeded.",
        ],
        pitfall: "Retrying non-idempotent calls blindly. Always ask what happens if this runs twice.",
        exercise: "Add an idempotency key column with a unique index to one POST endpoint and return the original response on a repeat.",
        links: [{ label: "MDN: Idempotent", url: "https://developer.mozilla.org/en-US/docs/Glossary/Idempotent" }],
      },
    ],
  },
  {
    slug: "redis",
    title: "Redis and caching",
    blurb: "Fast, in-memory, and easy to misuse.",
    lessons: [
      {
        slug: "redis-data-types",
        title: "Redis is more than a key-value store",
        minutes: 6,
        summary: "Redis keeps data structures in memory: strings, hashes, lists, sets and sorted sets. Choosing the right one is most of the skill.",
        points: [
          "Strings hold values and counters (`INCR` is atomic). Hashes hold small objects. Lists work as queues.",
          "Sets give uniqueness and fast membership checks. Sorted sets keep members ordered by score: leaderboards in one command.",
          "Everything is in RAM, so reads take microseconds and capacity is the limit.",
          "Single-threaded command execution means each command is atomic with no locks on your side.",
        ],
        pitfall: "Treating Redis as your only copy of important data. Know your persistence settings before you rely on it.",
        exercise: "Build a leaderboard with `ZADD`, `ZINCRBY` and `ZREVRANGE` and list the top five with scores.",
        links: [{ label: "Redis: Data types", url: `${REDIS}/develop/data-types/` }],
      },
      {
        slug: "cache-aside",
        title: "The cache-aside pattern",
        minutes: 6,
        summary: "Check the cache first; on a miss, load from the database and store it for next time. The simplest caching pattern, and the most common.",
        points: [
          "Read: look up the key, return on a hit, otherwise query the database, write to the cache with a TTL, return.",
          "Write: update the database, then delete the cached key rather than updating it. The next read refills it.",
          "A hit rate under about 80% usually means the keys or TTLs are wrong.",
          "A cache stampede happens when a popular key expires and many requests rebuild it at once. Add jitter to TTLs or lock the rebuild.",
        ],
        pitfall: "Caching without an invalidation plan. Stale data is a bug that only shows up in production.",
        exercise: "Wrap one slow read in cache-aside with a 60 second TTL and log hits versus misses for a day.",
        links: [{ label: "Redis: Client-side caching", url: `${REDIS}/develop/use/client-side-caching/` }],
      },
      {
        slug: "eviction-ttl",
        title: "TTLs, eviction and persistence",
        minutes: 5,
        summary: "Memory is finite. TTLs expire keys on purpose; eviction removes keys when memory runs out; persistence decides what survives a restart.",
        points: [
          "Set a TTL on every cache key (`EXPIRE`, or `SET key v EX 60`). Keys without one live forever.",
          "`maxmemory-policy allkeys-lru` evicts the least recently used keys when full: right for a cache, wrong for a database.",
          "RDB snapshots are compact and periodic; AOF logs every write and loses less. Many setups use both.",
          "Plan for a cold cache after a restart: your database must survive the refill.",
        ],
        pitfall: "Using one Redis for both a cache and durable data with an eviction policy that can delete the durable keys.",
        exercise: "Set `maxmemory 10mb` on a local instance, fill it, and watch which keys disappear under two different policies.",
        links: [{ label: "Redis: Key eviction", url: `${REDIS}/develop/reference/eviction/` }],
      },
    ],
  },
  {
    slug: "auth",
    title: "Authentication",
    blurb: "Proving who someone is without making yourself the weak link.",
    lessons: [
      {
        slug: "password-hashing",
        title: "Storing passwords safely",
        minutes: 5,
        summary: "Never store a password. Store a slow, salted hash of it, so a leaked database does not hand out working logins.",
        points: [
          "Use a purpose-built algorithm: Argon2id first, then scrypt or bcrypt. Not SHA-256, not MD5.",
          "A unique random salt per user defeats rainbow tables; the library handles it for you.",
          "The slowness is the feature. It makes each guess expensive for an attacker.",
          "Better still, delegate: a managed auth provider means you never touch the hashes at all.",
        ],
        pitfall: "Rolling your own scheme, or 'encrypting' passwords. Encryption is reversible; hashing is not.",
        exercise: "Hash a password with bcrypt at cost 10 and cost 14 and time both, then verify a wrong password fails.",
        links: [{ label: "OWASP: Password storage", url: `${OWASP}/Password_Storage_Cheat_Sheet.html` }],
      },
      {
        slug: "sessions-vs-jwt",
        title: "Sessions versus JWTs",
        minutes: 7,
        summary: "After login the server needs to recognise you on every request. Either it remembers you (session) or you carry a signed proof (token).",
        points: [
          "A session stores state server-side and gives the browser an opaque id in a cookie. Easy to revoke, needs shared storage to scale.",
          "A JWT is a signed token with claims inside. The server verifies the signature and needs no lookup, but cannot easily revoke it before it expires.",
          "Keep tokens short-lived and refresh them. Put them in HttpOnly, Secure, SameSite cookies, not localStorage.",
          "Verify signatures with the right algorithm and key, and check `exp`, `aud` and `iss`.",
        ],
        pitfall: "Using a JWT for everything because it is trendy. If you need instant logout, a session is simpler.",
        exercise: "Decode a real JWT at jwt.io, name each claim, then change one character of the payload and watch verification fail.",
        links: [{ label: "OWASP: Session management", url: `${OWASP}/Session_Management_Cheat_Sheet.html` }, { label: "MDN: Cookies", url: `${MDN}/Cookies` }],
      },
      {
        slug: "oauth-basics",
        title: "OAuth and 'Sign in with…'",
        minutes: 6,
        summary: "OAuth lets a user grant your app limited access to another service without sharing their password with you.",
        points: [
          "Authorization code flow with PKCE is the standard for web and mobile apps. The implicit flow is obsolete.",
          "Your app redirects the user to the provider, the user consents, and you receive a short-lived code you exchange for tokens.",
          "OAuth is about authorization. OpenID Connect adds a standard identity layer on top, which is what 'sign in with' really uses.",
          "Always validate the `state` parameter and register exact redirect URLs.",
        ],
        pitfall: "Wildcard redirect URIs. They let an attacker steal authorization codes.",
        exercise: "Draw the code flow as a sequence diagram with three actors: user, your app, the provider.",
        links: [{ label: "OAuth 2.0 overview", url: "https://oauth.net/2/" }],
      },
    ],
  },
  {
    slug: "security",
    title: "Web security",
    blurb: "The handful of mistakes behind most real breaches.",
    lessons: [
      {
        slug: "injection-xss",
        title: "Injection and XSS",
        minutes: 6,
        summary: "Both come from the same mistake: treating untrusted input as code. The fix is to keep data and instructions apart.",
        points: [
          "SQL injection: never build queries by string concatenation. Use parameterised queries or an ORM.",
          "Cross-site scripting: output encoding by context. Frameworks like React escape by default; `dangerouslySetInnerHTML` switches it off.",
          "Validate input on the server with an allow-list of shapes. Client checks are for convenience only.",
          "A Content-Security-Policy header limits what scripts may run if something slips through.",
        ],
        pitfall: "Sanitising by deleting bad words. Attackers just spell around the list; escape or parameterise instead.",
        exercise: "Make a toy login query vulnerable to `' OR 1=1 --`, exploit it locally, then fix it with a parameter.",
        links: [{ label: "OWASP: SQL injection prevention", url: `${OWASP}/SQL_Injection_Prevention_Cheat_Sheet.html` }, { label: "OWASP: XSS prevention", url: `${OWASP}/Cross_Site_Scripting_Prevention_Cheat_Sheet.html` }],
      },
      {
        slug: "csrf-cors",
        title: "CSRF and CORS",
        minutes: 6,
        summary: "Browsers attach cookies automatically, so another site can trigger requests as you. CSRF defences and CORS rules decide who may.",
        points: [
          "CSRF tricks a signed-in browser into sending a request you did not intend. `SameSite=Lax` cookies and anti-CSRF tokens stop it.",
          "CORS is a browser rule, not a server firewall. It controls which origins may read your responses from JavaScript.",
          "Never reflect any origin with credentials allowed. List the exact origins you trust.",
          "State-changing endpoints should never be GET, and should check the `Origin` header.",
        ],
        pitfall: "Setting `Access-Control-Allow-Origin: *` and thinking the API is protected or broken because of CORS. Neither is true.",
        exercise: "Call your API from a page on a different origin, read the CORS error, and fix it with one specific allowed origin.",
        links: [{ label: "MDN: CORS", url: `${MDN}/CORS` }, { label: "OWASP: CSRF prevention", url: `${OWASP}/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html` }],
      },
      {
        slug: "secrets-headers",
        title: "Secrets, headers and the basics",
        minutes: 5,
        summary: "A short checklist that closes most of the easy doors: keep secrets out of code, send security headers, and give every account least privilege.",
        points: [
          "Secrets live in environment variables or a secret manager, never in git. Rotate anything that ever leaked.",
          "Send HSTS, `X-Content-Type-Options: nosniff`, a frame policy and a CSP. Most take one line in config.",
          "Least privilege: a service key that can only do its job, and row-level security so users reach only their own rows.",
          "Rate-limit login and expensive endpoints, and keep dependencies updated.",
        ],
        pitfall: "Committing a `.env` file. Public repos are scraped for keys within minutes.",
        exercise: "Run your site through securityheaders.com, then add the two highest-value headers it asks for.",
        links: [{ label: "OWASP Top Ten", url: "https://owasp.org/www-project-top-ten/" }, { label: "PostgreSQL: Row security", url: `${PG}/ddl-rowsecurity.html` }],
      },
    ],
  },
  {
    slug: "performance",
    title: "Performance",
    blurb: "Make it fast where it matters, and know where that is.",
    lessons: [
      {
        slug: "web-vitals",
        title: "Measuring the front end",
        minutes: 5,
        summary: "Core Web Vitals turn 'feels slow' into three numbers: loading, responsiveness and visual stability.",
        points: [
          "LCP is how long the main content takes to appear; aim under 2.5 s. INP is how quickly the page reacts to input; under 200 ms. CLS is layout shift; under 0.1.",
          "Biggest wins are boring: smaller images, fewer blocking scripts, fonts with `font-display`, and setting image dimensions.",
          "Ship less JavaScript. Lazy-load what is below the fold or behind a click.",
          "Measure on a throttled phone profile; your laptop lies.",
        ],
        pitfall: "Optimising by feel. Profile first, change one thing, measure again.",
        exercise: "Run Lighthouse on your landing page in mobile mode and fix the single largest opportunity it lists.",
        links: [{ label: "web.dev: Core Web Vitals", url: "https://web.dev/articles/vitals" }],
      },
      {
        slug: "n-plus-one",
        title: "The N+1 query problem",
        minutes: 5,
        summary: "Load a list, then run one more query per item. Ten rows is fine; a thousand is a thousand round trips.",
        points: [
          "Spot it in logs: the same query repeated with different ids right after a list query.",
          "Fix with a join, an `IN (...)` batch, or the ORM's eager loading.",
          "Round trips dominate. A single query returning 1,000 rows beats 1,000 queries returning one.",
          "Fetch only the columns you use; `SELECT *` hauls data you will throw away.",
        ],
        pitfall: "Hiding the loop inside an ORM. Turn on query logging in development and count the queries.",
        exercise: "Log the SQL for one page, count the queries, and cut them to three or fewer.",
        links: [{ label: "PostgreSQL: Joins", url: `${PG}/tutorial-join.html` }],
      },
      {
        slug: "pagination",
        title: "Pagination that scales",
        minutes: 5,
        summary: "Never return an unbounded list. Offset pagination is simple; keyset pagination stays fast on huge tables.",
        points: [
          "`LIMIT 20 OFFSET 100000` still reads and discards 100,000 rows, so deep pages get slower.",
          "Keyset pagination remembers the last seen value: `WHERE (created_at, id) < (?, ?) ORDER BY created_at DESC, id DESC LIMIT 20`.",
          "It needs an index on the sort columns and a unique tiebreaker such as the id.",
          "Return a cursor to the client, not a page number, and cap the page size on the server.",
        ],
        pitfall: "A default of 'return everything'. One big customer later, your endpoint times out.",
        exercise: "Convert one offset-paginated endpoint to keyset and compare EXPLAIN timings on page 1 and page 5,000.",
        links: [{ label: "PostgreSQL: LIMIT and OFFSET", url: `${PG}/queries-limit.html` }],
      },
    ],
  },
  {
    slug: "reliability",
    title: "Scale and reliability",
    blurb: "Surviving traffic spikes and your own mistakes.",
    lessons: [
      {
        slug: "rate-limiting",
        title: "Rate limiting",
        minutes: 5,
        summary: "Limit how often one caller can hit you, so one bad client or one attacker cannot take the service down for everyone.",
        points: [
          "A fixed window counts requests per minute and is simple but allows bursts at the boundary.",
          "A sliding window or token bucket smooths that out. Token bucket lets short bursts through at a steady refill rate.",
          "Key the limit on user id when signed in and on IP otherwise, and return 429 with a `Retry-After` header.",
          "In a multi-server setup, keep counters in shared storage such as Redis, using atomic `INCR` with expiry.",
        ],
        pitfall: "An in-memory counter on serverless. Each instance has its own memory, so the limit is multiplied.",
        exercise: "Implement a token bucket in 30 lines and hit it with a loop to see where it starts returning 429.",
        links: [{ label: "MDN: 429 Too Many Requests", url: `${MDN}/Status/429` }],
      },
      {
        slug: "queues-retries",
        title: "Queues, retries and dead letters",
        minutes: 6,
        summary: "Do slow or fragile work in the background. A queue decouples 'accepted your request' from 'finished the job'.",
        points: [
          "Respond fast, enqueue the job, and let a worker process it: email, image resizing, report building.",
          "Make jobs idempotent, because queues deliver at least once and a worker can crash mid-job.",
          "Retry with backoff a few times, then move the job to a dead-letter queue for a human to inspect.",
          "Watch queue depth and age of the oldest job; a growing queue means workers cannot keep up.",
        ],
        pitfall: "Infinite retries. One poison message loops forever and starves everything behind it.",
        exercise: "Build a Redis list as a queue with a worker loop, kill the worker mid-job, and design how the job is recovered.",
        links: [{ label: "Redis: Lists", url: `${REDIS}/develop/data-types/lists/` }],
      },
      {
        slug: "observability",
        title: "Logs, metrics and knowing it broke",
        minutes: 5,
        summary: "You cannot fix what you cannot see. Logs say what happened, metrics say how often, traces say where the time went.",
        points: [
          "Log structured JSON with a request id on every line, so one request can be followed across services.",
          "Track the four golden signals: latency, traffic, errors and saturation.",
          "Alert on symptoms users feel (error rate, slow responses), not on every CPU blip.",
          "Never log secrets, tokens or full card numbers.",
        ],
        pitfall: "Finding out from a user. If your first alert is a complaint, your monitoring has a hole.",
        exercise: "Add a request id to every log line of one service and use it to trace a single failing request end to end.",
        links: [{ label: "MDN: HTTP status codes", url: `${MDN}/Status` }],
      },
    ],
  },
];

export const ALL_LESSONS: (Lesson & { module: Module; index: number })[] = MODULES.flatMap((module) =>
  module.lessons.map((lesson, index) => ({ ...lesson, module, index })),
);

export function findLesson(slug: string) {
  const i = ALL_LESSONS.findIndex((l) => l.slug === slug);
  if (i < 0) return null;
  return { lesson: ALL_LESSONS[i], prev: ALL_LESSONS[i - 1] ?? null, next: ALL_LESSONS[i + 1] ?? null, position: i + 1, total: ALL_LESSONS.length };
}
