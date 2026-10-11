export default function LoadingDaily() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="h-[52px]" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-12">

        {/* ── Top header ────────────────────────────── */}
        <div className="flex items-center justify-between mb-6">
          <div className="space-y-2">
            <div className="h-4 w-32 rounded-lg bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
            <div className="h-7 w-72 rounded-xl bg-zinc-200 dark:bg-zinc-800 animate-pulse [animation-delay:50ms]" />
          </div>
          <div className="h-9 w-24 rounded-xl bg-zinc-200 dark:bg-zinc-800 animate-pulse [animation-delay:80ms]" />
        </div>

        {/* ── Main layout: problem + editor ────────── */}
        <div className="flex flex-col xl:flex-row gap-4 h-[calc(100vh-200px)]">

          {/* Left: problem statement */}
          <div className="xl:w-[42%] rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 space-y-4 animate-pulse">
            {/* Tabs */}
            <div className="flex gap-3 mb-4">
              {[60, 50, 55].map((w, i) => (
                <div key={i} className="h-8 rounded-lg bg-zinc-200 dark:bg-zinc-700" style={{ width: `${w}px`, animationDelay: `${i * 40}ms` }} />
              ))}
            </div>
            {/* Difficulty + tags */}
            <div className="flex gap-2">
              <div className="h-6 w-16 rounded-full bg-green-100 dark:bg-green-900/30" />
              <div className="h-6 w-20 rounded-full bg-zinc-100 dark:bg-zinc-700" />
              <div className="h-6 w-24 rounded-full bg-zinc-100 dark:bg-zinc-700" />
            </div>
            {/* Content lines */}
            {[100, 90, 95, 80, 100, 85, 70, 92].map((w, i) => (
              <div key={i} className="h-4 rounded-lg bg-zinc-100 dark:bg-zinc-800" style={{ width: `${w}%`, animationDelay: `${i * 30}ms` }} />
            ))}
            {/* Code block */}
            <div className="mt-4 rounded-xl bg-zinc-100 dark:bg-zinc-800 p-4 space-y-2">
              {[60, 80, 50, 70].map((w, i) => (
                <div key={i} className="h-3.5 rounded bg-zinc-200 dark:bg-zinc-700" style={{ width: `${w}%` }} />
              ))}
            </div>
          </div>

          {/* Right: chat + editor split */}
          <div className="flex-1 flex flex-col gap-4">
            {/* Chat panel */}
            <div className="flex-1 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 space-y-3 animate-pulse [animation-delay:100ms]">
              <div className="h-5 w-24 rounded-lg bg-zinc-200 dark:bg-zinc-700" />
              <div className="flex gap-3 mt-4">
                <div className="h-8 w-8 rounded-full bg-zinc-200 dark:bg-zinc-700 flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-full rounded-lg bg-zinc-100 dark:bg-zinc-800" />
                  <div className="h-4 w-5/6 rounded-lg bg-zinc-100 dark:bg-zinc-800" />
                </div>
              </div>
            </div>
            {/* Editor panel */}
            <div className="flex-1 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 animate-pulse [animation-delay:150ms]">
              <div className="px-5 py-3 border-b border-zinc-200 dark:border-zinc-800 flex items-center gap-3">
                <div className="h-5 w-5 rounded bg-zinc-200 dark:bg-zinc-700" />
                <div className="h-4 w-28 rounded bg-zinc-200 dark:bg-zinc-700" />
                <div className="ml-auto h-7 w-20 rounded-lg bg-zinc-200 dark:bg-zinc-700" />
              </div>
              <div className="p-4 space-y-2">
                {[40, 65, 55, 80, 50].map((w, i) => (
                  <div key={i} className="h-4 rounded bg-zinc-100 dark:bg-zinc-800" style={{ width: `${w}%` }} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
