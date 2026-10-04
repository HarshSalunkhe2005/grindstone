/** Two quick-check questions per lesson. Graded in the browser: it is a study aid, not an exam. */
export interface Question {
  q: string;
  options: [string, string, string, string];
  answer: 0 | 1 | 2 | 3;
  why: string;
}

export const QUIZZES: Record<string, Question[]> = {
  "http-basics": [
    { q: "Which method should never change data on the server?", options: ["POST", "GET", "DELETE", "PATCH"], answer: 1, why: "GET is meant to be safe: browsers prefetch it and crawlers follow it." },
    { q: "Why do cookies and tokens exist?", options: ["HTTP is stateless", "HTTP is encrypted", "HTTP is slow", "HTTP is binary"], answer: 0, why: "The server forgets you between requests, so each one must carry proof of who you are." },
  ],
  "rest-design": [
    { q: "Which path follows REST naming?", options: ["/getProblem/42", "/problems/42", "/problem?do=get&id=42", "/fetch_problem_42"], answer: 1, why: "Use plural nouns for resources; the HTTP method is the verb." },
    { q: "Which change is safe without a new API version?", options: ["Renaming a field", "Removing a field", "Adding a new optional field", "Changing a field type"], answer: 2, why: "Adding is backward compatible; renaming, removing or retyping breaks existing clients." },
  ],
  "status-and-errors": [
    { q: "Signed in, but not allowed to do this. Which status?", options: ["401", "403", "404", "409"], answer: 1, why: "401 means not authenticated; 403 means authenticated but forbidden." },
    { q: "A client gets a 400. Should it retry the same request unchanged?", options: ["Yes, immediately", "Yes, with backoff", "No, the request itself is wrong", "Only on mobile"], answer: 2, why: "4xx means the request is at fault, so repeating it cannot help." },
  ],
  "btree-indexes": [
    { q: "Which does a B-tree index help with?", options: ["Only exact matches", "Equality and range filters", "Only text search", "Nothing on large tables"], answer: 1, why: "A sorted structure supports equality, ranges and ORDER BY." },
    { q: "What is the cost of adding many indexes?", options: ["Slower reads", "Slower writes and more disk", "Lower security", "Nothing"], answer: 1, why: "Every insert and update must maintain each index." },
  ],
  "explain-analyze": [
    { q: "What does ANALYZE add to EXPLAIN?", options: ["It runs the query and shows real timings", "It rewrites the query", "It adds an index", "It clears the cache"], answer: 0, why: "EXPLAIN shows the plan; ANALYZE actually executes it and reports actual rows and time." },
    { q: "Why can a plan look fine on ten rows and be slow in production?", options: ["Servers differ", "Small tables favour scans, hiding missing indexes", "Indexes expire", "Caching breaks"], answer: 1, why: "On tiny tables a sequential scan is cheapest, so a missing index goes unnoticed." },
  ],
  "composite-indexes": [
    { q: "An index on (a, b) can efficiently serve a filter on:", options: ["b alone", "a alone", "neither", "only a and b together"], answer: 1, why: "A composite index is usable from its leftmost column onwards." },
    { q: "Where should the range or sort column go in a composite index?", options: ["First", "Last", "It does not matter", "In a separate table"], answer: 1, why: "Equality columns first, then the range or sort column." },
  ],
  acid: [
    { q: "What does 'atomic' mean for a transaction?", options: ["It is fast", "All statements happen or none do", "It is encrypted", "It runs in memory"], answer: 1, why: "A failed transaction leaves no partial changes." },
    { q: "Why keep transactions short?", options: ["Long ones hold locks and block others", "They cost more", "They lose data", "They disable indexes"], answer: 0, why: "Locks stay held until commit, so everyone queued behind you waits." },
  ],
  "isolation-levels": [
    { q: "The reliable fix for a lost update on a counter is:", options: ["Read, add in code, write back", "An atomic UPDATE like n = n + 1", "Retrying the page", "A bigger server"], answer: 1, why: "Doing the arithmetic inside the database removes the race." },
    { q: "Read committed means a transaction:", options: ["Sees uncommitted work", "Sees only committed rows, but they can change between reads", "Locks the whole table", "Cannot read at all"], answer: 1, why: "Each statement sees a fresh committed snapshot, so repeated reads can differ." },
  ],
  idempotency: [
    { q: "Which HTTP method is not idempotent by design?", options: ["PUT", "DELETE", "POST", "GET"], answer: 2, why: "Repeating a POST can create duplicates, which is why create calls need idempotency keys." },
    { q: "What helps retries not stampede a recovering server?", options: ["Fixed instant retries", "Exponential backoff with jitter", "Retrying forever", "Larger payloads"], answer: 1, why: "Spacing retries out and randomising them spreads the load." },
  ],
  "redis-data-types": [
    { q: "Which Redis type fits a leaderboard best?", options: ["List", "Hash", "Sorted set", "String"], answer: 2, why: "Sorted sets keep members ordered by score." },
    { q: "Why is INCR safe under concurrency?", options: ["It is slow", "Commands run one at a time, so each is atomic", "It uses locks you write", "It is cached"], answer: 1, why: "Redis executes commands sequentially." },
  ],
  "cache-aside": [
    { q: "On a database write, what does cache-aside usually do to the cached key?", options: ["Update it in place", "Delete it so the next read refills it", "Ignore it", "Extend its TTL"], answer: 1, why: "Deleting avoids caching a value that raced with another write." },
    { q: "What is a cache stampede?", options: ["Many requests rebuilding one expired hot key at once", "A memory leak", "A failed deploy", "Slow disks"], answer: 0, why: "Add TTL jitter or lock the rebuild so only one request refills it." },
  ],
  "eviction-ttl": [
    { q: "Which policy suits a pure cache?", options: ["noeviction", "allkeys-lru", "Delete everything nightly", "Never set TTLs"], answer: 1, why: "LRU eviction drops the least recently used keys when memory is full." },
    { q: "A key set without a TTL:", options: ["Expires in a day", "Lives until deleted or evicted", "Is invalid", "Is read-only"], answer: 1, why: "Always give cache keys a TTL so they cannot pile up." },
  ],
  "password-hashing": [
    { q: "Which should you use to store passwords?", options: ["SHA-256", "MD5", "Argon2id or bcrypt", "Base64"], answer: 2, why: "They are deliberately slow and salted; fast hashes are cheap to brute force." },
    { q: "Why is slowness a feature of password hashing?", options: ["It annoys users", "It makes each guess expensive for an attacker", "It saves memory", "It encrypts data"], answer: 1, why: "A stolen database then costs real compute per guess." },
  ],
  "sessions-vs-jwt": [
    { q: "Which is easier to revoke instantly?", options: ["A server-side session", "A long-lived JWT", "Both equally", "Neither"], answer: 0, why: "A session lives on the server, so you can delete it; a JWT is valid until it expires." },
    { q: "Where should an auth token live in the browser?", options: ["localStorage", "A URL parameter", "An HttpOnly, Secure, SameSite cookie", "A global variable"], answer: 2, why: "HttpOnly keeps it away from injected scripts." },
  ],
  "oauth-basics": [
    { q: "Which flow is the standard for web apps today?", options: ["Implicit", "Authorization code with PKCE", "Password grant", "Basic auth"], answer: 1, why: "The implicit flow is obsolete; code with PKCE is the recommended one." },
    { q: "Why register exact redirect URLs?", options: ["Wildcards let attackers steal codes", "It is faster", "It saves bandwidth", "It is required by HTTP"], answer: 0, why: "A loose redirect can send the authorization code to an attacker." },
  ],
  "injection-xss": [
    { q: "The correct defence against SQL injection is:", options: ["Delete bad words", "Parameterised queries", "Longer passwords", "HTTPS"], answer: 1, why: "Keeping data and SQL apart means input can never become a command." },
    { q: "React protects against XSS by default because it:", options: ["Escapes output", "Blocks all scripts", "Uses HTTPS", "Hides the DOM"], answer: 0, why: "Rendered text is escaped; dangerouslySetInnerHTML turns that off." },
  ],
  "csrf-cors": [
    { q: "What does CORS control?", options: ["Which origins may read your responses from JavaScript", "Server firewall rules", "Password strength", "Database access"], answer: 0, why: "It is a browser rule, not a server firewall." },
    { q: "Which cookie setting helps stop CSRF?", options: ["SameSite=Lax or Strict", "Path=/", "Max-Age=0", "Domain=*"], answer: 0, why: "SameSite stops the browser sending the cookie on cross-site requests." },
  ],
  "secrets-headers": [
    { q: "Where should secrets live?", options: ["In git", "In environment variables or a secret manager", "In client code", "In comments"], answer: 1, why: "Anything committed to a public repo is scraped within minutes." },
    { q: "What does least privilege mean for a service key?", options: ["Full admin access", "Only the access its job needs", "No access at all", "Shared by everyone"], answer: 1, why: "If it leaks, the damage is limited to what it could do." },
  ],
  "web-vitals": [
    { q: "LCP measures:", options: ["How fast the main content appears", "Layout shift", "Input delay", "Server cost"], answer: 0, why: "Largest Contentful Paint: aim under 2.5 s." },
    { q: "Which usually helps load speed the most?", options: ["More JavaScript", "Smaller images and less blocking script", "Bigger fonts", "More animations"], answer: 1, why: "Send fewer bytes and unblock rendering." },
  ],
  "n-plus-one": [
    { q: "What is an N+1 query problem?", options: ["One list query then one query per item", "A syntax error", "A slow index", "A missing join table"], answer: 0, why: "N extra round trips for N rows." },
    { q: "A typical fix is:", options: ["A join or batched IN query", "More servers", "Retrying", "Longer timeouts"], answer: 0, why: "Fetch related rows together." },
  ],
  pagination: [
    { q: "Why does deep OFFSET pagination get slower?", options: ["The database still reads and discards the skipped rows", "Indexes expire", "Cursors leak", "Pages are cached"], answer: 0, why: "OFFSET 100000 reads 100,000 rows before returning any." },
    { q: "Keyset pagination needs:", options: ["Page numbers", "An ordered column plus a unique tiebreaker, indexed", "A cache", "No sorting"], answer: 1, why: "It continues from the last seen value instead of counting rows." },
  ],
  "rate-limiting": [
    { q: "Which response tells a client to slow down?", options: ["200", "404", "429 with Retry-After", "500"], answer: 2, why: "429 Too Many Requests, with the wait time in Retry-After." },
    { q: "Why do in-memory counters fail on serverless?", options: ["Each instance has its own memory", "They are too fast", "They use too much RAM", "JSON limits"], answer: 0, why: "Counts are not shared, so the real limit is multiplied by the instance count." },
  ],
  "queues-retries": [
    { q: "Queues deliver 'at least once', so jobs should be:", options: ["Idempotent", "Encrypted", "Very large", "Synchronous"], answer: 0, why: "A job may run twice if a worker crashes mid-way." },
    { q: "What is a dead-letter queue for?", options: ["Jobs that keep failing, for inspection", "Old logs", "Cache keys", "Deleted users"], answer: 0, why: "It stops a poison message from looping forever." },
  ],
  observability: [
    { q: "A request id on every log line lets you:", options: ["Follow one request across services", "Encrypt logs", "Shrink logs", "Skip metrics"], answer: 0, why: "It stitches the story of one request together." },
    { q: "Which should never be logged?", options: ["Request ids", "Secrets and tokens", "Status codes", "Durations"], answer: 1, why: "Logs get copied around; secrets in them leak." },
  ],
  "resume-one-page": [
    { q: "Which bullet is strongest?", options: ["Worked on performance", "Cut page load from 4 s to 1.2 s by lazy-loading images", "Responsible for the website", "Used React"], answer: 1, why: "Action plus a measurable result." },
    { q: "Best length for a student resume?", options: ["One page", "Three pages", "Five pages", "Half a page"], answer: 0, why: "Recruiters skim; one clean page gets read." },
  ],
  "showcase-project": [
    { q: "What makes a project most convincing?", options: ["Many tutorial clones", "One deployed project you understand end to end", "A long list of technologies", "A private repo"], answer: 1, why: "Interviewers probe depth, and a live link is evidence." },
    { q: "What should a README include?", options: ["Only the install command", "What it does, the stack, one hard problem, what you would change", "Your life story", "Nothing"], answer: 1, why: "It shows you can communicate and reflect." },
  ],
  "behavioural-stories": [
    { q: "What does STAR stand for?", options: ["Situation, Task, Action, Result", "Start, Test, Adapt, Repeat", "Skill, Team, Aim, Reward", "Story, Time, Answer, Reason"], answer: 0, why: "Spend most of the time on your action and the result." },
    { q: "Best way to prepare?", options: ["Memorise a speech", "Outline four or five true stories and adapt them", "Improvise everything", "Avoid failure stories"], answer: 1, why: "Know the beats, not the sentences." },
  ],
};
