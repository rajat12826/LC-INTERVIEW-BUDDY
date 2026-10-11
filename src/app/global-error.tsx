'use client'

// global-error.tsx — last-resort catch for crashes in the root layout itself.
// NOTE: This replaces the root layout, so it must include <html> and <body>.
import { RefreshCw } from 'lucide-react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-zinc-50 flex items-center justify-center p-6 font-sans">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="text-6xl">⚠️</div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-zinc-900">Critical Error</h1>
            <p className="text-sm text-zinc-500">
              The application encountered a fatal error. Please refresh the page.
            </p>
            {process.env.NODE_ENV === 'development' && (
              <pre className="mt-4 p-3 bg-zinc-100 rounded-lg text-xs text-left text-zinc-700 overflow-auto">
                {error?.message}
              </pre>
            )}
          </div>
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-zinc-900 text-white text-sm font-semibold rounded-xl hover:bg-zinc-800 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </body>
    </html>
  )
}
