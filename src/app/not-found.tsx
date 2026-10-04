import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto grid min-h-[70vh] w-full max-w-xl flex-1 place-items-center px-5 text-center">
      <div>
        <p className="num text-sm text-ember">404</p>
        <h1 className="font-display mt-2 text-4xl font-semibold">Nothing here.</h1>
        <p className="mt-3 text-muted">That page does not exist, or it moved.</p>
        <Link href="/today" className="btn btn-ember mt-6">
          Back to Today
        </Link>
      </div>
    </main>
  );
}
