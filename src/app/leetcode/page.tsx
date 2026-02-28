'use client'

import { useMemo, useState, useCallback, useEffect, useRef } from 'react'
import { useChallengeFilterStore } from '@/utils/stores/useChallengeFilterStore'
import ChallengeFilters from '../_components/challenges/ChallengeFilter'
import QuestionCard from '../_components/challenges/QuestionCard'
import { useQuestionStore } from '@/utils/stores/useQuestionStore'
import { Question } from '@/utils/types'
import { Button } from '@/components/ui/button'
import { ChevronDown, Sparkles } from 'lucide-react'
import DotGrid from '../_components/DotGrid'

// ── Animated counter (ported from PremiumChallengesPage) ──────────────────────
function AnimatedNumber({ value }: { value: number }) {
  const [display, setDisplay] = useState(0)
  const raf = useRef<number | null>(null)
  const startRef = useRef<number | null>(null)

  useEffect(() => {
    startRef.current = null
    const duration = 800
    const from = display
    const step = (ts: number) => {
      if (startRef.current === null) startRef.current = ts
      const p = Math.min((ts - startRef.current) / duration, 1)
      const ease = 1 - Math.pow(1 - p, 3)
      setDisplay(Math.round(from + (value - from) * ease))
      if (p < 1) raf.current = requestAnimationFrame(step)
    }
    raf.current = requestAnimationFrame(step)
    return () => {
      if (raf.current !== null) cancelAnimationFrame(raf.current)
    }
  }, [value]) // eslint-disable-line react-hooks/exhaustive-deps

  return <>{display}</>
}

// Virtual scrolling hook
function useVirtualScrolling(items: Question[], itemsPerPage = 24) {
  const [currentPage, setCurrentPage] = useState(1)

  const paginatedItems = useMemo(() => {
    return items.slice(0, currentPage * itemsPerPage)
  }, [items, currentPage, itemsPerPage])

  const hasMore = currentPage * itemsPerPage < items.length

  const loadMore = useCallback(() => {
    if (hasMore) setCurrentPage(prev => prev + 1)
  }, [hasMore])

  const reset = useCallback(() => setCurrentPage(1), [])

  return { paginatedItems, hasMore, loadMore, reset }
}

export default function ChallengesPage() {
  const allQuestions = useQuestionStore((state) => state.allQuestions)
  const { search, difficulty, companies, topics, solved, clearAll } = useChallengeFilterStore()
  const isSolved = useQuestionStore((state) => state.isSolved)

  const filteredQuestions = useMemo(() => {
    if (!allQuestions) return []
    return allQuestions.filter((q) => {
      const matchesSearch =
        search === '' ||
        q.Question.toLowerCase().includes(search.toLowerCase()) ||
        q.Topics.toLowerCase().includes(search.toLowerCase())
      const matchesDifficulty =
        difficulty === '' || q.Difficulty.toLowerCase() === difficulty.toLowerCase()
      const matchesCompanies =
        companies.length === 0 ||
        companies.some((comp) => q['Companies Asking This Question'].includes(comp))
      const matchesTopics =
        topics.length === 0 ||
        topics.some((topic) => q.Topics.toLowerCase().includes(topic.toLowerCase()))
      const matchesSolved =
        solved === 'all' ||
        (solved === 'solved' && isSolved(q.Question)) ||
        (solved === 'unsolved' && !isSolved(q.Question))
      return matchesSearch && matchesDifficulty && matchesCompanies && matchesTopics && matchesSolved
    })
  }, [allQuestions, search, difficulty, companies, topics, solved, isSolved])

  const { paginatedItems, hasMore, loadMore, reset } = useVirtualScrolling(filteredQuestions, 24)
  useMemo(() => { reset() }, [filteredQuestions.length, reset])

  const stats = useMemo(() => ({
    total: filteredQuestions.length,
    easy:   filteredQuestions.filter((c) => c.Difficulty === 'EASY').length,
    medium: filteredQuestions.filter((c) => c.Difficulty === 'MEDIUM').length,
    hard:   filteredQuestions.filter((c) => c.Difficulty === 'HARD').length,
  }), [filteredQuestions])

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 transition-colors duration-500">

      {/* ── Hero ── */}
      <section className="relative py-20 overflow-hidden border-b border-zinc-200/60 dark:border-zinc-800/60">

        {/* DotGrid Background */}
        <div className="absolute inset-0 z-0">
          <DotGrid
            dotSize={8}
            gap={20}
            baseColor="#cbd5e1"
            activeColor="#0ea5e9"
            proximity={100}
            shockRadius={200}
            shockStrength={4}
            resistance={800}
            returnDuration={1.8}
          />
        </div>

        {/* Atmospheric gradients */}
        <div className="absolute inset-0 z-[1] bg-gradient-to-b from-zinc-50/90 via-zinc-50/70 to-zinc-50/90 dark:from-zinc-950/90 dark:via-zinc-950/70 dark:to-zinc-950/90" />
        <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-emerald-500/10 dark:bg-emerald-400/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/3 w-96 h-96 bg-sky-500/10 dark:bg-sky-400/5 rounded-full blur-[120px]" />

        {/* Content */}
        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-8">

            {/* Eyebrow */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-900/5 dark:bg-white/5 border border-zinc-900/10 dark:border-white/10 backdrop-blur-xl">
              <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span className="text-sm font-semibold tracking-wide text-zinc-700 dark:text-zinc-300">
                Curated Problem Library
              </span>
            </div>

            {/* Heading */}
            <div className="space-y-5">
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1]">
                <span className="block text-zinc-900 dark:text-white">Master Every</span>
                <span className="block bg-gradient-to-r from-emerald-600 via-sky-600 to-indigo-600 dark:from-emerald-400 dark:via-sky-400 dark:to-indigo-400 bg-clip-text text-transparent">
                  Coding Challenge
                </span>
              </h1>

              <p className="text-xl sm:text-2xl text-zinc-600 dark:text-zinc-400 max-w-3xl mx-auto leading-relaxed">
                <span className="font-semibold text-zinc-900 dark:text-white">
                  <AnimatedNumber value={stats.total} />
                </span>{' '}
                carefully curated problems from leading tech companies
              </p>
            </div>

            {/* Stat badges */}
            <div className="inline-flex flex-wrap items-center justify-center gap-6 pt-2">
              <StatBadge label="Easy"   count={stats.easy}   color="emerald" />
              <div className="hidden sm:block w-px h-12 bg-zinc-300/50 dark:bg-zinc-700/50" />
              <StatBadge label="Medium" count={stats.medium} color="amber" />
              <div className="hidden sm:block w-px h-12 bg-zinc-300/50 dark:bg-zinc-700/50" />
              <StatBadge label="Hard"   count={stats.hard}   color="rose" />
            </div>
          </div>
        </div>
      </section>

      {/* ── Main Content ── */}
      <div className="relative max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        {/* Filters */}
        <div className="mb-10">
          <div className="bg-white/50 dark:bg-zinc-900/50 backdrop-blur-xl rounded-3xl p-6 lg:p-8 border border-zinc-200/60 dark:border-zinc-800/60 shadow-xl shadow-zinc-200/50 dark:shadow-zinc-900/50">
            <ChallengeFilters />
          </div>
        </div>

        {/* Grid */}
        {paginatedItems.length > 0 ? (
          <>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {paginatedItems.map((question) => (
                <QuestionCard key={question.Question} question={question} />
              ))}
            </div>

            {hasMore && (
              <div className="text-center space-y-4">
                <Button
                  onClick={loadMore}
                  size="lg"
                  className="group inline-flex items-center gap-3 px-8 py-6 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-semibold rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 shadow-xl shadow-zinc-900/20 dark:shadow-white/20 hover:shadow-2xl hover:shadow-zinc-900/30 dark:hover:shadow-white/30"
                >
                  <span>Load More Problems</span>
                  <ChevronDown className="w-5 h-5 group-hover:translate-y-0.5 transition-transform duration-300" />
                </Button>
                <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                  Showing{' '}
                  <span className="font-semibold text-zinc-900 dark:text-white">{paginatedItems.length}</span>
                  {' '}of{' '}
                  <span className="font-semibold text-zinc-900 dark:text-white">
                    <AnimatedNumber value={filteredQuestions.length} />
                  </span>
                  {' '}problems
                </p>
              </div>
            )}
          </>
        ) : (
          <div className="py-20">
            <div className="max-w-md mx-auto text-center">
              <div className="relative mb-8">
                <div className="absolute inset-0 bg-gradient-to-br from-zinc-100 to-white dark:from-zinc-800 dark:to-zinc-900 rounded-3xl" />
                <div className="absolute inset-[1px] bg-white dark:bg-zinc-900 rounded-3xl" />
                <div className="relative px-8 py-12 space-y-6">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-zinc-900 to-zinc-800 dark:from-white dark:to-zinc-100 text-white dark:text-zinc-900 shadow-xl mx-auto">
                    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-2xl font-bold text-zinc-900 dark:text-white">No Problems Found</h3>
                    <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
                      No challenges match your current filters. Try adjusting your search criteria to discover more problems.
                    </p>
                  </div>
                  <Button
                    onClick={clearAll}
                    className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:scale-[1.02] transition-all duration-300"
                  >
                    Reset All Filters
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Stat Badge ────────────────────────────────────────────────────────────────
function StatBadge({ label, count, color }: { label: string; count: number; color: 'emerald' | 'amber' | 'rose' }) {
  const cfg = {
    emerald: { text: 'text-emerald-700 dark:text-emerald-400', dot: 'bg-emerald-500', bg: 'bg-emerald-50/50 dark:bg-emerald-950/30' },
    amber:   { text: 'text-amber-700 dark:text-amber-400',     dot: 'bg-amber-500',   bg: 'bg-amber-50/50 dark:bg-amber-950/30'   },
    rose:    { text: 'text-rose-700 dark:text-rose-400',       dot: 'bg-rose-500',     bg: 'bg-rose-50/50 dark:bg-rose-950/30'     },
  }[color]

  return (
    <div className={`inline-flex items-center gap-4 px-6 py-3 rounded-2xl ${cfg.bg} backdrop-blur-sm border border-zinc-200/60 dark:border-zinc-800/60`}>
      <div className={`w-2 h-2 rounded-full ${cfg.dot} animate-pulse`} />
      <div className="text-left">
        <div className={`text-3xl font-bold ${cfg.text} leading-none mb-1`}>
          <AnimatedNumber value={count} />
        </div>
        <div className="text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-widest">
          {label}
        </div>
      </div>
    </div>
  )
}