export default function LoadingRandom() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#050506] flex flex-col">
      {/* Header Skeleton */}
      <header className="border-b border-zinc-200/70 dark:border-white/[0.06] bg-white/80 dark:bg-[#050506]/90 backdrop-blur-xl">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-32 rounded-lg bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
            <div className="h-6 w-28 rounded-full bg-violet-100 dark:bg-violet-950/40 animate-pulse" />
          </div>
          <div className="flex items-center gap-3">
            <div className="h-9 w-28 rounded-xl bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
            <div className="h-9 w-9 rounded-xl bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
            <div className="h-9 w-32 rounded-xl bg-[#5E6AD2]/30 animate-pulse" />
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-[1400px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-5 flex-1 flex flex-col gap-4">
        {/* Problem Card Header */}
        <div className="rounded-2xl border border-zinc-200/70 dark:border-white/[0.06] bg-white dark:bg-[#0a0a0c] p-6 space-y-4 animate-pulse">
          <div className="flex items-center gap-2">
            <div className="h-4 w-28 rounded bg-violet-200 dark:bg-violet-900/40" />
            <div className="h-5 w-16 rounded-full bg-emerald-100 dark:bg-emerald-950/40" />
          </div>
          <div className="h-8 w-2/5 rounded-xl bg-zinc-200 dark:bg-zinc-800" />
          <div className="flex flex-wrap gap-2 pt-1">
            <div className="h-6 w-20 rounded-md bg-zinc-100 dark:bg-zinc-800/60" />
            <div className="h-6 w-24 rounded-md bg-zinc-100 dark:bg-zinc-800/60" />
            <div className="h-6 w-16 rounded-md bg-zinc-100 dark:bg-zinc-800/60" />
          </div>
        </div>

        {/* Chat / Workspace Skeleton */}
        <div className="flex-1 min-h-[480px] rounded-2xl border border-zinc-200/70 dark:border-white/[0.06] bg-white dark:bg-[#0a0a0c] p-6 flex flex-col justify-between animate-pulse">
          <div className="space-y-6">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-violet-200 dark:bg-violet-900/50 flex-shrink-0" />
              <div className="space-y-2 flex-1 max-w-lg">
                <div className="h-4 rounded bg-zinc-200 dark:bg-zinc-800 w-3/4" />
                <div className="h-4 rounded bg-zinc-200 dark:bg-zinc-800 w-1/2" />
              </div>
            </div>
          </div>

          {/* Prompt Input bar */}
          <div className="pt-4 border-t border-zinc-200/50 dark:border-white/[0.06] flex gap-3">
            <div className="flex-1 h-12 rounded-xl bg-zinc-100 dark:bg-zinc-900" />
            <div className="w-12 h-12 rounded-xl bg-violet-500/20" />
          </div>
        </div>
      </main>
    </div>
  )
}
