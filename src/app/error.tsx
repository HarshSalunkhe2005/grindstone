"use client";

import Link from "next/link";
import { useEffect } from "react";

// Shown when a page throws. Logs the digest so a report can be matched to the server log.
export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("page error", error.digest ?? "no-digest");
  }, [error]);

  return (
    <main className="mx-auto grid min-h-[70vh] w-full max-w-xl flex-1 place-items-center px-5 text-center">
      <div>
        <p className="num text-sm text-ember">Something broke</p>
        <h1 className="font-display mt-2 text-4xl font-semibold">That page hit a snag.</h1>
        <p className="mt-3 text-muted">Your progress is safe. Try again, and if it keeps happening, go back to Today.</p>
        {error.digest && <p className="num mt-2 text-xs text-muted">Reference {error.digest}</p>}
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button type="button" className="btn btn-ember" onClick={reset}>
            Try again
          </button>
          <Link href="/today" className="btn btn-quiet">
            Back to Today
          </Link>
        </div>
      </div>
    </main>
  );
}
