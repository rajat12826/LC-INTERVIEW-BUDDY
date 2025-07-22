'use client'

import { useChallengeFilterStore } from '@/utils/stores/useChallengeFilterStore'
import ChallengeFilters from '../_components/challenges/ChallengeFilter'
import QuestionCard from '../_components/challenges/QuestionCard'
import { useQuestionStore } from '@/utils/stores/useQuestionStore'

export default function ChallengesPage() {
  const allQuestions = useQuestionStore((state) => state.allQuestions)

  
const { search, difficulty, category, companies, topics, solved, clearAll } = useChallengeFilterStore()

const isSolved = useQuestionStore((state) => state.isSolved)


  const filteredQuestions = allQuestions?.filter((q) => {
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

    return (
      matchesSearch &&
      matchesDifficulty &&
      // matchesCategory &&
      matchesCompanies &&
      matchesTopics &&
      matchesSolved
    )
  })

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
              LeetCode Problems
            </h1>
            <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-indigo-500 mx-auto rounded-full" />
          </div>

          {/* Subtitle */}
          <div className="max-w-2xl mx-auto">
            <p className="text-xl text-gray-600 dark:text-gray-300 leading-relaxed">
              Master your coding skills with{' '}
              <span className="font-semibold text-blue-600 dark:text-blue-400">
                {filteredQuestions?.length || 0}
              </span>{' '}
              carefully curated challenges from top tech companies
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto mt-8">
            <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl p-4 border border-gray-200/50 dark:border-gray-700/50 shadow-sm hover:shadow-md">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {filteredQuestions?.filter((c) => c.Difficulty === 'EASY').length || 0}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Easy Problems</div>
            </div>
            <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl p-4 border border-gray-200/50 dark:border-gray-700/50 shadow-sm hover:shadow-md">
              <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                {filteredQuestions?.filter((c) => c.Difficulty === 'MEDIUM').length || 0}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Medium Problems</div>
            </div>
            <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl p-4 border border-gray-200/50 dark:border-gray-700/50 shadow-sm hover:shadow-md">
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                {filteredQuestions?.filter((c) => c.Difficulty === 'HARD').length || 0}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Hard Problems</div>
            </div>
          </div>
        </div>

        {/* Filters Section */}
        <div className="mb-10">
          <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 dark:border-gray-700/50 shadow-lg">
            <ChallengeFilters />
          </div>
        </div>

        {/* Problems Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredQuestions?.map((question) => (
            <QuestionCard key={question.Question} question={question} />
          ))}
        </div>

        {/* Empty State */}
        {filteredQuestions?.length === 0 && (
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
              <button
                className="mt-6 inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors"
                onClick={clearAll}
              >
                Reset Filters
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}