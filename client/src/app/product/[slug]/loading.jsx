import PageLoader from "@/components/PageLoader";

export default function ProductLoading() {
  return (
    <main className="site-frame flex min-h-[calc(100dvh-5.5rem)] flex-col py-4 sm:py-8 lg:py-10">
      <div className="mb-4 flex justify-end sm:mb-6">
        {/* placeholder for back button */}
        <div className="h-9 w-28 rounded-full bg-[var(--border)] animate-pulse" />
      </div>

      <div className="grid flex-1 gap-6 rounded-[2rem] p-4 md:grid-cols-[1fr_0.95fr] md:p-6">
        {/* Image skeleton */}
        <div className="flex h-[320px] w-[320px] min-w-[320px] items-center justify-center rounded-[1.35rem]">
          <div className="h-full w-full rounded-[1.35rem] bg-[var(--border)] animate-pulse" />
        </div>

        {/* Text skeleton */}
        <div className="flex h-full flex-col justify-center gap-4">
          <div className="h-3 w-24 rounded-full bg-[var(--border)] animate-pulse" />
          <div className="h-8 w-3/4 rounded-xl bg-[var(--border)] animate-pulse" />
          <div className="space-y-2 mt-2">
            <div className="h-3 w-full rounded-full bg-[var(--border)] animate-pulse" />
            <div className="h-3 w-5/6 rounded-full bg-[var(--border)] animate-pulse" />
            <div className="h-3 w-4/6 rounded-full bg-[var(--border)] animate-pulse" />
          </div>
          <div className="mt-4 grid gap-3 border-y border-[var(--border)] py-5 sm:grid-cols-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-3 w-32 rounded-full bg-[var(--border)] animate-pulse" />
            ))}
          </div>
          <div className="h-9 w-32 rounded-full bg-[var(--border)] animate-pulse" />
          <div className="h-12 w-40 rounded-full bg-[var(--border)] animate-pulse mt-2" />
        </div>
      </div>
    </main>
  );
}