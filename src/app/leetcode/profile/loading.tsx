export default function LoadingProfile() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="h-[52px]" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── Left: Profile card ──────────────────── */}
          <div className="lg:col-span-1 space-y-4">
            <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 animate-pulse">
              {/* Avatar */}
              <div className="flex flex-col items-center gap-3 mb-6">
                <div className="h-20 w-20 rounded-full bg-zinc-200 dark:bg-zinc-700" />
                <div className="h-5 w-36 rounded-lg bg-zinc-200 dark:bg-zinc-700" />
                <div className="h-4 w-48 rounded-lg bg-zinc-200 dark:bg-zinc-700" />
              </div>
              {/* Stats */}
              <div className="grid grid-cols-3 gap-3">
                {['Easy', 'Med', 'Hard'].map((_, i) => (
                  <div key={i} className="rounded-xl bg-zinc-100 dark:bg-zinc-800 p-3 text-center space-y-1">
                    <div className="h-6 w-8 mx-auto rounded bg-zinc-200 dark:bg-zinc-700" />
                    <div className="h-3 w-10 mx-auto rounded bg-zinc-200 dark:bg-zinc-700" />
                  </div>
                ))}
              </div>
            </div>

            {/* Settings card */}
            <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 animate-pulse [animation-delay:80ms]">
              <div className="h-4 w-24 rounded mb-4 bg-zinc-200 dark:bg-zinc-700" />
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3 mb-4">
                  <div className="h-9 w-9 rounded-xl bg-zinc-100 dark:bg-zinc-800" />
                  <div className="flex-1 h-4 rounded-lg bg-zinc-100 dark:bg-zinc-800" />
                </div>
              ))}
              <div className="h-10 w-full rounded-xl bg-zinc-200 dark:bg-zinc-700 mt-2" />
            </div>
          </div>

          {/* ── Right: Activity + solved ────────────── */}
          <div className="lg:col-span-2 space-y-4">
            {/* Heatmap */}
            <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 animate-pulse [animation-delay:50ms]">
              <div className="h-5 w-40 rounded-lg bg-zinc-200 dark:bg-zinc-700 mb-4" />
              <div className="h-28 w-full rounded-xl bg-zinc-100 dark:bg-zinc-800" />
            </div>

            {/* Solved list */}
            <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 animate-pulse [animation-delay:100ms]">
              <div className="h-5 w-32 rounded-lg bg-zinc-200 dark:bg-zinc-700 mb-5" />
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 py-3 border-b border-zinc-100 dark:border-zinc-800 last:border-0">
                  <div className="h-5 w-5 rounded-full bg-zinc-200 dark:bg-zinc-700 flex-shrink-0" />
                  <div className="flex-1 h-4 rounded-lg bg-zinc-100 dark:bg-zinc-800" style={{ width: `${65 + (i % 3) * 10}%` }} />
                  <div className="h-5 w-14 rounded-full bg-zinc-100 dark:bg-zinc-800" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
