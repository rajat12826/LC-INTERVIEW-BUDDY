// src/app/_components/challenges/ChallengeFilter.tsx (Adjust path if you're renaming it for premium)

'use client'

import { Search, Filter, X } from 'lucide-react'
import { useChallengeFilterStoreP } from '@/utils/stores/useChallegeStoreP'// Use the new premium filter store
import { useLayoutEffect, useState } from 'react' // useLayoutEffect might not be strictly necessary here

// Note: useLoadProblems is designed for the old 'Question' type.
// If you're filtering premium questions, you won't be loading companies/topics this way.
// As per the discussion, we are removing company/topic filters from this component.
// Therefore, `useLoadProblems` import is no longer directly relevant for this component.
// You might remove it if it's only used for populating company/topic lists.

const difficulties = ['Easy', 'Medium', 'Hard'] // Match PQuestion's casing

const ChallengeFilters = () => {
  const {
    search,
    difficulty,
    setSearch,
    setDifficulty,
    clearAll,
    solved,
    setSolved
  } = useChallengeFilterStoreP() // Use the premium filter store

  // No longer need companyInput, topicInput, allCompanies, allTopics, etc.

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Filter className="text-blue-600 dark:text-blue-400" />
          <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
            Filter Challenges
          </h3>
        </div>
        <button
          onClick={clearAll}
          className="flex items-center text-sm text-gray-600 dark:text-gray-300 hover:underline"
        >
          <X className="w-4 h-4 mr-1" />
          Clear All
        </button>
      </div>

      {/* Filters Grid - Simplified */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Search */}
        <div>
          <label htmlFor="search-input" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Search
          </label>
          <div className="relative">
            <input
              id="search-input"
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-2 py-2 rounded-lg border text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-blue-500 focus:border-blue-500"
              placeholder="Search by title or description..."
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-300" />
          </div>
        </div>

        {/* Difficulty */}
        <div>
          <label htmlFor="difficulty-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Difficulty
          </label>
          <select
            id="difficulty-select"
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
            className="w-full p-2 text-gray-900 rounded-lg border dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All</option>
            {difficulties.map((diff) => (
              <option key={diff} value={diff.toLowerCase()}> {/* Use lowercase to match PQuestion */}
                {diff}
              </option>
            ))}
          </select>
        </div>

        {/* Solved Filter */}
        <div>
          <label htmlFor="status-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Status
          </label>
          <select
            id="status-select"
            value={solved}
            onChange={(e) => setSolved(e.target.value as 'all' | 'solved' | 'unsolved')}
            className="w-full p-2 text-gray-900 rounded-lg border dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All</option>
            <option value="solved">Solved</option>
            <option value="unsolved">Unsolved</option>
          </select>
        </div>

        {/* Removed: Companies and Topics sections */}
      </div>
    </div>
  )
}

export default ChallengeFilters