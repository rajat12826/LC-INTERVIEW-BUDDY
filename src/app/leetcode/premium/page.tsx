// app/your-path-to-challenges/page.tsx (Adjust path as per your project structure)

'use client'

import { useMemo, useState, useCallback } from 'react'
import { useChallengeFilterStoreP}from '../../../utils/stores/useChallegeStoreP'// Use the new premium filter store
import ChallengeFilters from '@/app/_components/challenges/ChallegeFilterP' // Your simplified ChallengeFilters
import { useQuestionStore } from '@/utils/stores/useQuestionStore' // Import PQuestion
import PremiumQuestionCard from '@/app/_components/challenges/PremiumQuestionCard'// Use the new PremiumQuestionCard

// 📦 Shadcn UI Imports
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
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
  steps?: string[];              // For tree-type questions
  illustration?: string;         // Image explaining the concept
  note?: string;                 // Additional note about the problem
  key_points?: string[];         // For maze-type questions
  examples: Example[];           // Test case examples
  constraints: string[];         // Problem constraints
};

// Virtual scrolling hook - now typed for PQuestion[]
function useVirtualScrolling(items: PQuestion[], itemsPerPage = 20) {
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

export default function ChallengesPage() {
  // Get premiumQuestions from the store, which are of type PQuestion[]
  const allPremiumQuestions = useQuestionStore((state) => state.premiumQuestions)
  console.log(allPremiumQuestions);
  
  // Use the new premium filter store
  const { search, difficulty, solved, clearAll } = useChallengeFilterStoreP()
  const isSolved = useQuestionStore((state) => state.isSolved)

  // Memoize filtered questions to avoid recalculating on every render
  const filteredQuestions = useMemo(() => {
    if (!allPremiumQuestions) return []
  
    
    return allPremiumQuestions.filter((q) => {
          console.log(q);
      // Filter by title (PQuestion's 'title' field) or description
      const matchesSearch =
        search === '' ||
        q.title.toLowerCase().includes(search.toLowerCase()) ||
        q.description.toLowerCase().includes(search.toLowerCase())

      // Filter by difficulty (matches PQuestion.difficulty casing)
      const matchesDifficulty =
        difficulty === '' || q.difficulty.toLowerCase() === difficulty.toLowerCase()

      // Companies and Topics filters are removed as PQuestion doesn't have these fields
      // and useChallengeFilterStoreP no longer tracks them.

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

  // Reset pagination when filters change (e.g., a filter value changes, causing filteredQuestions.length to change)
  useMemo(() => {
    reset()
  }, [filteredQuestions.length, reset])

  // Memoize stats calculations - using PQuestion.difficulty
  const stats = useMemo(() => ({
    easy: filteredQuestions.filter((c) => c.difficulty.toLowerCase() === 'easy').length,
    medium: filteredQuestions.filter((c) => c.difficulty.toLowerCase() === 'medium').length,
    hard: filteredQuestions.filter((c) => c.difficulty.toLowerCase() === 'hard').length,
  }), [filteredQuestions])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/30 dark:from-gray-900 dark:via-gray-800 dark:to-blue-900/20">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(59,130,246,0.15)_1px,transparent_0)] dark:bg-[radial-gradient(circle_at_1px_1px,rgba(59,130,246,0.1)_1px,transparent_0)] [background-size:24px_24px] pointer-events-none" />

      <div className="relative mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header Section */}
        <div className="mb-12 text-center">
          {/* Main Title */}
          <div className="mb-6">
            <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-900 dark:from-white dark:via-blue-200 dark:to-indigo-200 bg-clip-text text-transparent mb-4 leading-tight">
              Premium LeetCode Problems
            </h1>
            <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-indigo-500 mx-auto rounded-full" />
          </div>

          {/* Subtitle */}
          <div className="max-w-2xl mx-auto">
            <p className="text-xl text-gray-600 dark:text-gray-300 leading-relaxed">
              Master your coding skills with{' '}
              <span className="font-semibold text-blue-600 dark:text-blue-400">
                {filteredQuestions.length}
              </span>{' '}
              carefully curated challenges.
            </p>
          </div>

          {/* Stats Cards - Memoized */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto mt-8">
            <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl p-4 border border-gray-200/50 dark:border-gray-700/50 shadow-sm hover:shadow-md">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {stats.easy}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Easy Problems</div>
            </div>
            <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl p-4 border border-gray-200/50 dark:border-gray-700/50 shadow-sm hover:shadow-md">
              <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                {stats.medium}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Medium Problems</div>
            </div>
            <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl p-4 border border-gray-200/50 dark:border-gray-700/50 shadow-sm hover:shadow-md">
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                {stats.hard}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Hard Problems</div>
            </div>
          </div>
        </div>

        {/* Filters Section */}
        <div className="mb-10">
          <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 dark:border-gray-700/50 shadow-lg">
            <ChallengeFilters /> {/* This now uses useChallengeFilterStoreP internally */}
          </div>
        </div>

        {/* Problems Grid - Only render visible items */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {paginatedItems.map((question) => (
            // Ensure PremiumQuestionCard is imported and used here
            <PremiumQuestionCard key={question.title} question={question} />
          ))}
        </div>

        {/* --- */}

        {/* Load More Button */}
        {hasMore && (
          <div className="text-center mt-12">
            <Button
              onClick={loadMore}
              className="inline-flex items-center px-8 py-3 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105
                         bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium"
              size="lg"
            >
              Load More Problems
              <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </Button>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              Showing {paginatedItems.length} of {filteredQuestions.length} problems
            </p>
          </div>
        )}

        {/* Optional: Add a separator above the "Load More" or "Empty State" for visual break */}
        {(hasMore || filteredQuestions.length === 0) && (
          <div className="mt-12">
            <Separator />
          </div>
        )}

        {/* --- */}

        {/* Empty State */}
        {filteredQuestions.length === 0 && (
          <div className="text-center py-20">
            <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-2xl p-12 border border-gray-200/50 dark:border-gray-700/50 shadow-lg max-w-md mx-auto">
              {/* Empty State Icon */}
              <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-full flex items-center justify-center">
                <svg
                  className="w-10 h-10 text-blue-500 dark:text-blue-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>

              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                No Problems Found
              </h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                No challenges found matching your current criteria. Try adjusting your filters to
                see more problems.
              </p>

              {/* Reset Button */}
              <Button
                className="mt-6"
                onClick={clearAll}
              >
                Reset Filters
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}