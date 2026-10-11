export default function LoadingPremium() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#09090b]">
      <div className="h-[52px]" />

      <div className="max-w-[1800px] mx-auto w-full px-4 sm:px-6 lg:px-8 pt-8 pb-12">

        {/* ── Header ──────────────────────────────── */}
        <div className="mb-8 space-y-3">
          <div className="h-8 w-64 rounded-xl bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
          <div className="h-5 w-96 rounded-lg bg-zinc-200 dark:bg-zinc-800 animate-pulse [animation-delay:60ms]" />
        </div>

        {/* ── Filter bar ───────────────────────────── */}
        <div className="flex flex-col md:flex-row gap-3 mb-6">
          <div className="flex-1 h-11 rounded-xl bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
          <div className="w-full md:w-44 h-11 rounded-xl bg-zinc-200 dark:bg-zinc-800 animate-pulse [animation-delay:80ms]" />
          <div className="w-full md:w-44 h-11 rounded-xl bg-zinc-200 dark:bg-zinc-800 animate-pulse [animation-delay:120ms]" />
        </div>

        {/* ── Premium cards grid ────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 24 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl border border-zinc-200 dark:border-white/[0.06] bg-white dark:bg-white/[0.02] p-5 space-y-3 animate-pulse"
              style={{ animationDelay: `${(i % 8) * 40}ms` }}
            >
              {/* Premium badge */}
              <div className="flex items-center gap-2">
                <div className="h-5 w-20 rounded-full bg-amber-100 dark:bg-amber-900/30" />
                <div className="h-5 w-12 rounded-full bg-zinc-200 dark:bg-zinc-700" />
              </div>
              {/* Title */}
              <div className="h-5 w-4/5 rounded-lg bg-zinc-200 dark:bg-zinc-700" />
              <div className="h-4 w-2/3 rounded-lg bg-zinc-200 dark:bg-zinc-700" />
              {/* Tags */}
              <div className="flex gap-1.5 pt-1">
                <div className="h-5 w-14 rounded-full bg-zinc-100 dark:bg-white/[0.04]" />
                <div className="h-5 w-16 rounded-full bg-zinc-100 dark:bg-white/[0.04]" />
              </div>
              {/* Action button */}
              <div className="h-8 w-full rounded-lg bg-zinc-100 dark:bg-white/[0.04] mt-2" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
