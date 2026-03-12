export function SkeletonLoader() {
  return (
    <div className="min-h-screen w-full animate-pulse bg-background">
      <div className="flex h-screen w-full overflow-hidden">
        <aside className="hidden w-64 border-r border-border-hairline bg-sidebar px-8 py-8 lg:flex lg:flex-col">
          <div className="mb-8 flex items-center gap-3 px-2">
            <div className="h-8 w-8 rounded-full bg-muted" />
            <div className="h-3 w-20 rounded bg-muted" />
          </div>

          <div className="mb-6 space-y-3">
            <div className="h-3 w-24 rounded bg-muted" />
            <div className="h-2 w-full rounded bg-muted" />
            <div className="h-2 w-3/4 rounded bg-muted" />
          </div>

          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, idx) => (
              <div key={idx} className="h-10 w-full rounded-xl bg-muted" />
            ))}
          </div>

          <div className="mt-auto space-y-4 pt-8">
            <div className="h-20 w-full rounded-2xl bg-muted" />
            <div className="h-12 w-full rounded-2xl bg-muted" />
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto px-6 pb-24 pt-16 lg:px-12 lg:pb-12 lg:pt-0">
          <div className="mx-auto max-w-6xl space-y-8 pt-6 lg:pt-12">
            <div className="h-12 w-64 rounded-2xl bg-muted" />

            <div className="grid grid-cols-7 gap-3">
              {Array.from({ length: 7 * 4 }).map((_, idx) => (
                <div key={idx} className="h-24 rounded-xl bg-muted" />
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
