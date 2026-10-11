// This renders INSTANTLY on nav — Next.js shows it while the page bundle compiles
export default function LoadingProblems() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Navbar spacer */}
      <div className="h-[52px]" />

      <div className="max-w-[1800px] mx-auto w-full px-4 sm:px-6 lg:px-8 pt-8 pb-12">

        {/* ── Stats bar ────────────────────────────── */}
        <div className="flex items-center gap-3 mb-6">
          {[80, 60, 60, 72].map((w, i) => (
            <div
              key={i}
              className="h-8 rounded-xl bg-zinc-200 dark:bg-zinc-800 animate-pulse"
              style={{ width: `${w}px`, animationDelay: `${i * 60}ms` }}
            />
          ))}
        </div>

        {/* ── Filter bar ───────────────────────────── */}
        <div className="flex flex-col md:flex-row gap-3 mb-6">
          <div className="flex-1 h-11 rounded-xl bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
          <div className="w-full md:w-44 h-11 rounded-xl bg-zinc-200 dark:bg-zinc-800 animate-pulse [animation-delay:80ms]" />
          <div className="w-full md:w-44 h-11 rounded-xl bg-zinc-200 dark:bg-zinc-800 animate-pulse [animation-delay:120ms]" />
          <div className="w-full md:w-44 h-11 rounded-xl bg-zinc-200 dark:bg-zinc-800 animate-pulse [animation-delay:160ms]" />
        </div>

        {/* ── Question cards grid ───────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 24 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 space-y-3 animate-pulse"
              style={{ animationDelay: `${(i % 8) * 40}ms` }}
            >
              {/* Badge row */}
              <div className="flex items-center gap-2">
                <div className="h-5 w-16 rounded-full bg-zinc-200 dark:bg-zinc-700" />
                <div className="h-5 w-12 rounded-full bg-zinc-200 dark:bg-zinc-700" />
              </div>
              {/* Title */}
              <div className="h-5 w-4/5 rounded-lg bg-zinc-200 dark:bg-zinc-700" />
              <div className="h-4 w-3/5 rounded-lg bg-zinc-200 dark:bg-zinc-700" />
              {/* Tags */}
              <div className="flex gap-1.5 pt-1">
                <div className="h-5 w-14 rounded-full bg-zinc-100 dark:bg-zinc-800" />
                <div className="h-5 w-16 rounded-full bg-zinc-100 dark:bg-zinc-800" />
                <div className="h-5 w-12 rounded-full bg-zinc-100 dark:bg-zinc-800" />
              </div>
            </div>
          ))}
        </div>

        {/* ── Pagination ────────────────────────────── */}
        <div className="flex justify-center mt-8 gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-9 w-9 rounded-lg bg-zinc-200 dark:bg-zinc-800 animate-pulse"
              style={{ animationDelay: `${i * 40}ms` }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
