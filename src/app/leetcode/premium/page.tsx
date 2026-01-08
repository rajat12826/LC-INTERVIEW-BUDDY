// app/your-path-to-challenges/page.tsx (Adjust path as per your project structure)

'use client'

import { useMemo, useState, useCallback } from 'react'
import { useChallengeFilterStoreP } from '../../../utils/stores/useChallegeStoreP' // Use the new premium filter store
import { useQuestionStore } from '@/utils/stores/useQuestionStore'
import PremiumQuestionCard from '@/app/_components/challenges/PremiumQuestionCard' // Use the new PremiumQuestionCard
import PremiumChallengeFilters from '@/app/_components/challenges/ChallegeFilterP'
import { Button } from '@/components/ui/button'
import { ChevronDown, Sparkles, Crown } from 'lucide-react'
import DotGrid from '@/app/_components/DotGrid'

type Example = {
  input: string;
  output: string | number;
  explanation?: string;
  image?: string;
};

type PQuestion = {
  title: string;
  link: string;
  difficulty: "Easy" | "Medium" | "Hard";
  description: string;
  steps?: string[];
  illustration?: string;
  note?: string;
  key_points?: string[];
  examples: Example[];
  constraints: string[];
};

// Virtual scrolling hook - now typed for PQuestion[]
function useVirtualScrolling(items: PQuestion[], itemsPerPage = 24) {
  const [currentPage, setCurrentPage] = useState(1)

  const paginatedItems = useMemo(() => {
    const startIndex = 0
    const endIndex = currentPage * itemsPerPage
    return items.slice(startIndex, endIndex)
  }, [items, currentPage, itemsPerPage])

  const hasMore = currentPage * itemsPerPage < items.length

  const loadMore = useCallback(() => {
    if (hasMore) {
      setCurrentPage(prev => prev + 1)
    }
  }, [hasMore])

  const reset = useCallback(() => {
    setCurrentPage(1)
  }, [])

  return { paginatedItems, hasMore, loadMore, reset }
}

export default function PremiumChallengesPage() {
  // Get premiumQuestions from the store, which are of type PQuestion[]
  const allPremiumQuestions = useQuestionStore((state) => state.premiumQuestions)
  
  // Use the new premium filter store
  const { search, difficulty, solved, clearAll } = useChallengeFilterStoreP()
  const isSolved = useQuestionStore((state) => state.isSolved)

  // Memoize filtered questions to avoid recalculating on every render
  const filteredQuestions = useMemo(() => {
    if (!allPremiumQuestions) return []
    
    return allPremiumQuestions.filter((q) => {
      // Filter by title (PQuestion's 'title' field) or description
      const matchesSearch =
        search === '' ||
        q.title.toLowerCase().includes(search.toLowerCase()) ||
        q.description.toLowerCase().includes(search.toLowerCase())

      // Filter by difficulty (matches PQuestion.difficulty casing)
      const matchesDifficulty =
        difficulty === '' || q.difficulty.toLowerCase() === difficulty.toLowerCase()

      // Filter by solved status (using PQuestion.title as the unique identifier)
      const matchesSolved =
        solved === 'all' ||
        (solved === 'solved' && isSolved(q.title)) ||
        (solved === 'unsolved' && !isSolved(q.title))

      return (
        matchesSearch &&
        matchesDifficulty &&
        matchesSolved
      )
    })
  }, [allPremiumQuestions, search, difficulty, solved, isSolved])

  // Use virtual scrolling with PQuestion[]
  const { paginatedItems, hasMore, loadMore, reset } = useVirtualScrolling(filteredQuestions, 24)

  // Reset pagination when filters change
  useMemo(() => {
    reset()
  }, [filteredQuestions.length, reset])

  // Memoize stats calculations - using PQuestion.difficulty
  const stats = useMemo(() => ({
    total: filteredQuestions.length,
    easy: filteredQuestions.filter((c) => c.difficulty.toLowerCase() === 'easy').length,
    medium: filteredQuestions.filter((c) => c.difficulty.toLowerCase() === 'medium').length,
    hard: filteredQuestions.filter((c) => c.difficulty.toLowerCase() === 'hard').length,
  }), [filteredQuestions])

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 transition-colors duration-500">
      {/* Hero Section with DotGrid Background */}
      <section className="relative py-20 overflow-hidden border-b border-zinc-200/60 dark:border-zinc-800/60">
        {/* DotGrid Background */}
        <div className="absolute inset-0 z-0">
          <DotGrid
            dotSize={8}
            gap={20}
            baseColor="#cbd5e1"
            activeColor="#f59e0b"
            proximity={100}
            shockRadius={200}
            shockStrength={4}
            resistance={800}
            returnDuration={1.8}
          />
        </div>

        {/* Atmospheric gradients */}
        <div className="absolute inset-0 z-[1] bg-gradient-to-b from-zinc-50/90 via-zinc-50/70 to-zinc-50/90 dark:from-zinc-950/90 dark:via-zinc-950/70 dark:to-zinc-950/90" />
        <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-amber-500/10 dark:bg-amber-400/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/3 w-96 h-96 bg-orange-500/10 dark:bg-orange-400/5 rounded-full blur-[120px]" />

        {/* Content */}
        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-8">
            {/* Eyebrow */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-amber-500/10 to-orange-500/10 dark:from-amber-400/10 dark:to-orange-400/10 border border-amber-500/20 dark:border-amber-400/20 backdrop-blur-xl">
              <Crown className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span className="text-sm font-semibold tracking-wide text-amber-700 dark:text-amber-300">
                Premium Problem Collection
              </span>
            </div>

            {/* Main heading */}
            <div className="space-y-5">
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1]">
                <span className="block text-zinc-900 dark:text-white">
                  Exclusive Premium
                </span>
                <span className="block bg-gradient-to-r from-amber-600 via-orange-600 to-yellow-600 dark:from-amber-400 dark:via-orange-400 dark:to-yellow-400 bg-clip-text text-transparent">
                  Coding Challenges
                </span>
              </h1>
              
              <p className="text-xl sm:text-2xl text-zinc-600 dark:text-zinc-400 max-w-3xl mx-auto leading-relaxed">
                <span className="font-semibold text-zinc-900 dark:text-white">{stats.total}</span> premium problems 
                with detailed explanations and solutions
              </p>
            </div>

            {/* Stats Cards - Improved spacing and alignment */}
            <div className="inline-flex flex-wrap items-center justify-center gap-6 pt-2">
              <StatBadge 
                label="Easy" 
                count={stats.easy} 
                color="emerald"
              />
              <div className="hidden sm:block w-px h-12 bg-zinc-300/50 dark:bg-zinc-700/50" />
              <StatBadge 
                label="Medium" 
                count={stats.medium} 
                color="amber"
              />
              <div className="hidden sm:block w-px h-12 bg-zinc-300/50 dark:bg-zinc-700/50" />
              <StatBadge 
                label="Hard" 
                count={stats.hard} 
                color="rose"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="relative max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Filters Section */}
        <div className="mb-10">
          <div className="bg-white/50 dark:bg-zinc-900/50 backdrop-blur-xl rounded-3xl p-6 lg:p-8 border border-zinc-200/60 dark:border-zinc-800/60 shadow-xl shadow-zinc-200/50 dark:shadow-zinc-900/50">
            <PremiumChallengeFilters />
          </div>
        </div>

        {/* Problems Grid */}
        {paginatedItems.length > 0 ? (
          <>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {paginatedItems.map((question) => (
                <PremiumQuestionCard key={question.title} question={question} />
              ))}
            </div>

            {/* Load More Button */}
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
                  Showing {paginatedItems.length} of {filteredQuestions.length} problems
                </p>
              </div>
            )}
          </>
        ) : (
          /* Empty State */
          <div className="py-20">
            <div className="max-w-md mx-auto text-center">
              <div className="relative mb-8">
                {/* Animated background */}
                <div className="absolute inset-0 bg-gradient-to-br from-zinc-100 to-white dark:from-zinc-800 dark:to-zinc-900 rounded-3xl" />
                <div className="absolute inset-[1px] bg-white dark:bg-zinc-900 rounded-3xl" />
                
                {/* Content */}
                <div className="relative px-8 py-12 space-y-6">
                  {/* Icon */}
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-zinc-900 to-zinc-800 dark:from-white dark:to-zinc-100 text-white dark:text-zinc-900 shadow-xl mx-auto">
                    <svg
                      className="w-10 h-10"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  </div>

                  {/* Text */}
                  <div className="space-y-2">
                    <h3 className="text-2xl font-bold text-zinc-900 dark:text-white">
                      No Problems Found
                    </h3>
                    <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
                      No challenges match your current filters. Try adjusting your search criteria to discover more problems.
                    </p>
                  </div>

                  {/* Reset Button */}
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

// Stat Badge Component - Improved design
function StatBadge({ 
  label, 
  count, 
  color 
}: { 
  label: string
  count: number
  color: 'emerald' | 'amber' | 'rose'
}) {
  const colorClasses = {
    emerald: {
      text: 'text-emerald-700 dark:text-emerald-400',
      dot: 'bg-emerald-500',
      bg: 'bg-emerald-50/50 dark:bg-emerald-950/30'
    },
    amber: {
      text: 'text-amber-700 dark:text-amber-400',
      dot: 'bg-amber-500',
      bg: 'bg-amber-50/50 dark:bg-amber-950/30'
    },
    rose: {
      text: 'text-rose-700 dark:text-rose-400',
      dot: 'bg-rose-500',
      bg: 'bg-rose-50/50 dark:bg-rose-950/30'
    }
  }

  const config = colorClasses[color]

  return (
    <div className={`inline-flex items-center gap-4 px-6 py-3 rounded-2xl ${config.bg} backdrop-blur-sm border border-zinc-200/60 dark:border-zinc-800/60`}>
      <div className={`w-2 h-2 rounded-full ${config.dot} animate-pulse`} />
      <div className="text-left">
        <div className={`text-3xl font-bold ${config.text} leading-none mb-1`}>
          {count}
        </div>
        <div className="text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-widest">
          {label}
        </div>
      </div>
    </div>
  )
}