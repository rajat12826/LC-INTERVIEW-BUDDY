'use client'

import { Search, Filter, X } from 'lucide-react'
import { useChallengeFilterStore } from '@/utils/stores/useChallengeFilterStore'
import { useLayoutEffect, useState } from 'react'
import useLoadProblems from '@/utils/useLoadProblems'


const difficulties = ['EASY', 'MEDIUM', 'HARD']


const ChallengeFilters = () => {
  const {
    search,
    difficulty,
    category,
    companies,
    topics,
    setSearch,
    setDifficulty,
    setCategory,
    addCompany,
    removeCompany,
    addTopic,
    removeTopic,
    clearAll,
  } = useChallengeFilterStore()
  const { allProblems, allCompanies, allTopics }=useLoadProblems()
  // console.log(allTopics);
  
  const [companyInput, setCompanyInput] = useState('')
  const [topicInput, setTopicInput] = useState('')

  // Filter suggestions that include input and are NOT already selected
  const filteredCompanies = allCompanies.filter(
    (c) =>
      c.toLowerCase().includes(companyInput.toLowerCase()) &&
      !companies.includes(c)
  )

  const filteredTopics = allTopics.filter(
    (t) => t.toLowerCase().includes(topicInput.toLowerCase()) && !topics.includes(t)
  )

  // Handle selecting a company from suggestions
  const onSelectCompany = (company: string) => {
    addCompany(company)
    setCompanyInput('')
  }

  // Handle selecting a topic from suggestions
  const onSelectTopic = (topic: string) => {
    addTopic(topic)
    setTopicInput('')
  }

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

      {/* Filters Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Search */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Search
          </label>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full p-2 rounded-lg border text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            placeholder="Search by title or topic..."
          />
        </div>

        {/* Difficulty */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Difficulty
          </label>
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
            className="w-full p-2 text-gray-900 rounded-lg border dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            <option value="">All</option>
            {difficulties.map((diff) => (
              <option key={diff} value={diff}>
                {diff}
              </option>
            ))}
          </select>
        </div>

       

        {/* Companies - autocomplete input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Companies
          </label>
          <input
            type="text"
            placeholder="Type to search companies..."
            value={companyInput}
            onChange={(e) => setCompanyInput(e.target.value)}
            className="w-full p-2 mb-2 rounded-lg border dark:bg-gray-700 text-gray-900 dark:border-gray-600 dark:text-white"
          />
          {companyInput && filteredCompanies.length > 0 && (
            <ul className="max-h-32 overflow-y-auto border p-2 rounded-lg dark:bg-gray-700 dark:border-gray-600 space-y-1 cursor-pointer">
              {filteredCompanies.map((company) => (
                <li
                  key={company}
                  onClick={() => onSelectCompany(company)}
                  className="text-sm text-gray-700 dark:text-gray-200 hover:bg-blue-600 hover:text-white rounded px-2 py-1"
                >
                  {company}
                </li>
              ))}
            </ul>
          )}

          {/* Selected companies as tags */}
          <div className="flex flex-wrap gap-2 mt-2">
            {companies.map((c) => (
              <span
                key={c}
                className="flex items-center bg-blue-600 text-white rounded-full px-3 py-1 text-sm"
              >
                {c}
                <button
                  onClick={() => removeCompany(c)}
                  className="ml-2 focus:outline-none"
                  aria-label={`Remove ${c}`}
                >
                  &times;
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Topics - autocomplete input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Topics
          </label>
          <input
            type="text"
            placeholder="Type to search topics..."
            value={topicInput}
            onChange={(e) => setTopicInput(e.target.value)}
            className="w-full p-2 mb-2 rounded-lg border text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
          {topicInput && filteredTopics.length > 0 && (
            <ul className="max-h-32 overflow-y-auto border p-2 rounded-lg dark:bg-gray-700 dark:border-gray-600 space-y-1 cursor-pointer">
              {filteredTopics.map((topic) => (
                <li
                  key={topic}
                  onClick={() => onSelectTopic(topic)}
                  className="text-sm text-gray-700 dark:text-gray-200 hover:bg-blue-600 hover:text-white rounded px-2 py-1"
                >
                  {topic}
                </li>
              ))}
            </ul>
          )}

          {/* Selected topics as tags */}
          <div className="flex flex-wrap gap-2 mt-2">
            {topics.map((t) => (
              <span
                key={t}
                className="flex items-center bg-blue-600 text-white rounded-full px-3 py-1 text-sm"
              >
                {t}
                <button
                  onClick={() => removeTopic(t)}
                  className="ml-2 focus:outline-none"
                  aria-label={`Remove ${t}`}
                >
                  &times;
                </button>
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ChallengeFilters
