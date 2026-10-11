'use client'

import { useEffect } from 'react'
import { Shuffle, RefreshCw, ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function RandomPageError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[/leetcode/random error]', error)
  }, [error])

  const router = useRouter()

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 flex items-center justify-center p-6">
      <div className="max-w-sm w-full text-center space-y-5">
        <div className="flex justify-center">
          <div className="w-14 h-14 rounded-2xl bg-violet-50 dark:bg-violet-950/40 border border-violet-200 dark:border-violet-900 flex items-center justify-center">
            <Shuffle className="w-7 h-7 text-violet-500" />
          </div>
        </div>
        <div className="space-y-1.5">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Random problem failed</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Could not load a random problem. Please try again.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-sm font-semibold rounded-xl hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Try Another
          </button>
          <button
            onClick={() => router.push('/leetcode')}
            className="inline-flex items-center gap-2 px-4 py-2 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 text-sm font-semibold rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            All Problems
          </button>
        </div>
      </div>
    </div>
  )
}
