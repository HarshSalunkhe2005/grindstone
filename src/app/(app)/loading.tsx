/** Shown instantly while a page's data loads, so navigation never feels stuck. */
export default function Loading() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading">
      <div className="space-y-3">
        <div className="skeleton h-4 w-40" />
        <div className="skeleton h-12 w-full max-w-lg" />
      </div>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="space-y-6">
          <div className="skeleton h-56 w-full !rounded-2xl" />
          <div className="skeleton h-64 w-full !rounded-2xl" />
        </div>
        <div className="space-y-6">
          <div className="skeleton h-28 w-full !rounded-2xl" />
          <div className="skeleton h-44 w-full !rounded-2xl" />
          <div className="skeleton h-28 w-full !rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
