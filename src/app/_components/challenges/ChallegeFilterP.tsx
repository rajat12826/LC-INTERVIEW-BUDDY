'use client'

import { Search, X, Filter } from 'lucide-react'
import { useChallengeFilterStoreP } from '@/utils/stores/useChallegeStoreP'

const difficulties = ['Easy', 'Medium', 'Hard']

const PremiumChallengeFilters = () => {
  const {
    search,
    difficulty,
    setSearch,
    setDifficulty,
    clearAll,
    solved,
    setSolved
  } = useChallengeFilterStoreP()

  const activeFiltersCount = 
    (search ? 1 : 0) + 
    (difficulty ? 1 : 0) + 
    (solved !== 'all' ? 1 : 0)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-zinc-900 to-zinc-800 dark:from-white dark:to-zinc-100 text-white dark:text-zinc-900 shadow-lg">
            <Filter className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white">
              Filter Problems
            </h3>
            {activeFiltersCount > 0 && (
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                {activeFiltersCount} active {activeFiltersCount === 1 ? 'filter' : 'filters'}
              </p>
            )}
          </div>
        </div>
        
        {activeFiltersCount > 0 && (
          <button
            onClick={clearAll}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-xl transition-all duration-200 border border-zinc-200 dark:border-zinc-700"
          >
            <X className="w-4 h-4" />
            Clear All
          </button>
        )}
      </div>

      {/* Filters Grid */}
      <div className="space-y-6">
        {/* Main Filters Row */}
        <div className="grid md:grid-cols-3 gap-6">
          {/* Search */}
          <div className="md:col-span-3 lg:col-span-1">
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-3 uppercase tracking-wider">
              Search Problems
            </label>
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 dark:text-zinc-500 group-focus-within:text-zinc-900 dark:group-focus-within:text-white transition-colors" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label="Search problems by title or description"
                className="w-full pl-11 pr-4 py-3 text-sm font-medium bg-white dark:bg-zinc-900 border-2 border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-900 dark:text-zinc-100 placeholder-zinc-500 dark:placeholder-zinc-500 focus:outline-none focus:border-zinc-900 dark:focus:border-white transition-all duration-200"
                placeholder="Search by title or description..."
              />
            </div>
          </div>

          {/* Difficulty */}
          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-3 uppercase tracking-wider">
              Difficulty Level
            </label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              aria-label="Filter by difficulty level"
              className="w-full px-4 py-3 text-sm font-medium bg-white dark:bg-zinc-900 border-2 border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-900 dark:focus:border-white transition-all duration-200 cursor-pointer appearance-none"
              style={{ 
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23475569'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, 
                backgroundPosition: 'right 1rem center', 
                backgroundRepeat: 'no-repeat', 
                backgroundSize: '1.25rem' 
              }}
            >
              <option value="">All Levels</option>
              {difficulties.map((diff) => (
                <option key={diff} value={diff}>
                  {diff}
                </option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-3 uppercase tracking-wider">
              Problem Status
            </label>
            <select
              value={solved}
              onChange={(e) => setSolved(e.target.value as 'all' | 'solved' | 'unsolved')}
              aria-label="Filter by problem completion status"
              className="w-full px-4 py-3 text-sm font-medium bg-white dark:bg-zinc-900 border-2 border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-900 dark:focus:border-white transition-all duration-200 cursor-pointer appearance-none"
              style={{ 
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23475569'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, 
                backgroundPosition: 'right 1rem center', 
                backgroundRepeat: 'no-repeat', 
                backgroundSize: '1.25rem' 
              }}
            >
              <option value="all">All Status</option>
              <option value="solved">Solved</option>
              <option value="unsolved">Unsolved</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PremiumChallengeFilters