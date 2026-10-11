export default function LoadingWorkspace() {
  return (
    <div className="h-screen flex flex-col bg-zinc-50 dark:bg-zinc-950 overflow-hidden">
      {/* Top Bar Skeleton */}
      <header className="h-14 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-8 w-24 rounded-lg bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
          <div className="h-4 w-40 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
          <div className="h-5 w-16 rounded-full bg-emerald-100 dark:bg-emerald-950/40 animate-pulse" />
        </div>
        <div className="flex items-center gap-3">
          <div className="h-8 w-28 rounded-lg bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
          <div className="h-8 w-24 rounded-lg bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
        </div>
      </header>

      {/* Main 3-pane/split workspace Skeleton */}
      <div className="flex-1 flex gap-3 p-3 overflow-hidden">
        {/* Left: Problem Statement Skeleton */}
        <div className="w-1/3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 space-y-4 animate-pulse">
          <div className="flex gap-2 mb-4">
            <div className="h-7 w-20 rounded-md bg-zinc-200 dark:bg-zinc-700" />
            <div className="h-7 w-24 rounded-md bg-zinc-100 dark:bg-zinc-800" />
          </div>
          <div className="h-6 w-3/4 rounded bg-zinc-200 dark:bg-zinc-700" />
          <div className="space-y-2 pt-2">
            {[100, 95, 90, 80, 100, 85, 70].map((w, i) => (
              <div key={i} className="h-3.5 rounded bg-zinc-100 dark:bg-zinc-800" style={{ width: `${w}%` }} />
            ))}
          </div>
        </div>

        {/* Center: Monaco Editor Skeleton */}
        <div className="flex-1 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex flex-col animate-pulse">
          <div className="h-10 border-b border-zinc-200 dark:border-zinc-800 px-4 flex items-center justify-between">
            <div className="h-5 w-24 rounded bg-zinc-200 dark:bg-zinc-700" />
            <div className="h-6 w-20 rounded bg-zinc-200 dark:bg-zinc-700" />
          </div>
          <div className="flex-1 p-5 space-y-3 font-mono text-xs">
            {[40, 60, 50, 75, 45, 65, 30].map((w, i) => (
              <div key={i} className="h-3.5 rounded bg-zinc-100 dark:bg-zinc-800" style={{ width: `${w}%` }} />
            ))}
          </div>
        </div>

        {/* Right: AI Chat Skeleton */}
        <div className="w-1/3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 flex flex-col justify-between animate-pulse">
          <div className="space-y-4">
            <div className="h-6 w-28 rounded bg-zinc-200 dark:bg-zinc-700" />
            <div className="flex gap-3">
              <div className="w-7 h-7 rounded-full bg-violet-200 dark:bg-violet-900/40 flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3.5 rounded bg-zinc-100 dark:bg-zinc-800 w-full" />
                <div className="h-3.5 rounded bg-zinc-100 dark:bg-zinc-800 w-3/4" />
              </div>
            </div>
          </div>
          <div className="h-11 rounded-lg bg-zinc-100 dark:bg-zinc-800" />
        </div>
      </div>
    </div>
  )
}
