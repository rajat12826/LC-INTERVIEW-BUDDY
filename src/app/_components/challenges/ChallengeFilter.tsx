'use client'

import { Search, X, Filter, ChevronDown, ChevronUp } from 'lucide-react'
import { useChallengeFilterStore } from '@/utils/stores/useChallengeFilterStore'
import { useState } from 'react'
import useLoadProblems from '@/utils/useLoadProblems'

const difficulties = ['EASY', 'MEDIUM', 'HARD']

// Popular topics with problem counts
const popularTopics = [
  { name: 'Arrays & Hashing', count: 158 },
  { name: 'Two Pointers', count: 37 },
  { name: 'Sliding Window', count: 41 },
  { name: 'Stack', count: 39 },
  { name: 'Binary Search', count: 39 },
  { name: 'Linked List', count: 39 },
  { name: 'Trees', count: 88 },
  { name: 'Heap / Priority Queue', count: 31 },
  { name: 'Backtracking', count: 33 },
  { name: 'Tries', count: 11 },
  { name: 'Graphs', count: 68 },
  { name: 'Advanced Graphs', count: 29 },
  { name: '1-D Dynamic Programming', count: 49 },
  { name: '2-D Dynamic Programming', count: 50 },
  { name: 'Greedy', count: 65 },
  { name: 'Intervals', count: 20 },
  { name: 'Math & Geometry', count: 60 },
  { name: 'Bit Manipulation', count: 29 },
  { name: 'JavaScript', count: 30 },
]

// Popular companies
const popularCompanies = [
  'Amazon', 'Google', 'Microsoft', 'Apple', 'Meta', 'Netflix',
  'Adobe', 'Bloomberg', 'Goldman Sachs', 'Uber', 'Airbnb', 'Tesla',
  'Oracle', 'Salesforce', 'IBM', 'Walmart', 'PayPal', 'LinkedIn',
  'Twitter', 'Snap', 'Stripe', 'Coinbase', 'Dropbox', 'Atlassian',
  'AMD', 'Accenture', 'Accolite', 'Agoda', 'Akamai', 'Altimetrik',
  'Amadeus', 'American Express', 'Atlassian', 'Avito', 'BNY Mellon',
  'Barclays', 'BlackStone', 'Bolt', 'Braze', 'ByteDance', 'Cadence',
  'Capgemini', 'Careem', 'Chewy', 'Cisco', 'Coforge', 'Cognizant',
  'Comcast', 'Criteo', 'Deloitte', 'Deutsche Bank', 'Devsinc',
  'Docusign', 'DoorDash', 'EPAM Systems', 'EY', 'EarnIn',
  'Epic Systems', 'Expedia', 'FPT', 'Fidelity', 'Flipkart',
  'FreshWorks', 'Grab', 'HCL', 'Huawei',
]

const ChallengeFilters = () => {
  const {
    search,
    difficulty,
    companies,
    topics,
    setSearch,
    setDifficulty,
    addCompany,
    removeCompany,
    addTopic,
    removeTopic,
    clearAll,
    solved,
    setSolved
  } = useChallengeFilterStore()
  
  const { allCompanies, allTopics } = useLoadProblems()
  
  const [companyInput, setCompanyInput] = useState('')
  const [topicInput, setTopicInput] = useState('')
  const [showAllTopics, setShowAllTopics] = useState(false)
  const [showAllCompanies, setShowAllCompanies] = useState(false)

  // Filter suggestions
  const filteredCompanies = allCompanies.filter(
    (c) =>
      c.toLowerCase().includes(companyInput.toLowerCase()) &&
      !companies.includes(c)
  )

  const filteredTopics = allTopics.filter(
    (t) => t.toLowerCase().includes(topicInput.toLowerCase()) && !topics.includes(t)
  )

  const onSelectCompany = (company: string) => {
    addCompany(company)
    setCompanyInput('')
  }

  const onSelectTopic = (topic: string) => {
    addTopic(topic)
    setTopicInput('')
  }

  const activeFiltersCount = 
    (search ? 1 : 0) + 
    (difficulty ? 1 : 0) + 
    companies.length + 
    topics.length + 
    (solved !== 'all' ? 1 : 0)

  // Filter out already selected items
  const availableTopics = popularTopics.filter(t => !topics.includes(t.name))
  const availableCompanies = popularCompanies.filter(c => !companies.includes(c))

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

      {/* Filters Grid - Improved Layout */}
      <div className="space-y-6">
        {/* Top Row - Search takes prominence */}
        <div className="grid md:grid-cols-3 gap-6">
          {/* Search - Wider */}
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
                className="w-full pl-11 pr-4 py-3 text-sm font-medium bg-white dark:bg-zinc-900 border-2 border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-900 dark:text-zinc-100 placeholder-zinc-500 dark:placeholder-zinc-500 focus:outline-none focus:border-zinc-900 dark:focus:border-white transition-all duration-200"
                placeholder="Search by title or topic..."
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
              className="w-full px-4 py-3 text-sm font-medium bg-white dark:bg-zinc-900 border-2 border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-900 dark:focus:border-white transition-all duration-200 cursor-pointer appearance-none"
              style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23475569'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundPosition: 'right 1rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.25rem' }}
            >
              <option value="">All Levels</option>
              {difficulties.map((diff) => (
                <option key={diff} value={diff}>
                  {diff.charAt(0) + diff.slice(1).toLowerCase()}
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
              className="w-full px-4 py-3 text-sm font-medium bg-white dark:bg-zinc-900 border-2 border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-900 dark:focus:border-white transition-all duration-200 cursor-pointer appearance-none"
              style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23475569'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundPosition: 'right 1rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.25rem' }}
            >
              <option value="all">All Status</option>
              <option value="solved">Solved</option>
              <option value="unsolved">Unsolved</option>
            </select>
          </div>
        </div>

        {/* Bottom Row - Companies and Topics */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Companies */}
          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-3 uppercase tracking-wider">
              Filter by Companies
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Search or select companies..."
                value={companyInput}
                onChange={(e) => setCompanyInput(e.target.value)}
                className="w-full px-4 py-3 text-sm font-medium bg-white dark:bg-zinc-900 border-2 border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-900 dark:text-zinc-100 placeholder-zinc-500 dark:placeholder-zinc-500 focus:outline-none focus:border-zinc-900 dark:focus:border-white transition-all duration-200"
              />
              {companyInput && filteredCompanies.length > 0 && (
                <div className="absolute z-20 w-full mt-2 max-h-60 overflow-y-auto bg-white dark:bg-zinc-900 border-2 border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl">
                  {filteredCompanies.slice(0, 10).map((company) => (
                    <button
                      key={company}
                      onClick={() => onSelectCompany(company)}
                      className="w-full text-left px-4 py-3 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white transition-colors first:rounded-t-xl last:rounded-b-xl"
                    >
                      {company}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Select Companies */}
            {!companyInput && availableCompanies.length > 0 && (
              <div className="mt-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">
                    Quick Select
                  </span>
                  {availableCompanies.length > 12 && (
                    <button
                      onClick={() => setShowAllCompanies(!showAllCompanies)}
                      className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white flex items-center gap-1 transition-colors"
                    >
                      {showAllCompanies ? (
                        <>
                          Show Less <ChevronUp className="w-3 h-3" />
                        </>
                      ) : (
                        <>
                          Show All <ChevronDown className="w-3 h-3" />
                        </>
                      )}
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {(showAllCompanies ? availableCompanies : availableCompanies.slice(0, 12)).map((company) => (
                    <button
                      key={company}
                      onClick={() => onSelectCompany(company)}
                      className="px-3 py-1.5 text-xs font-semibold bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border-2 border-zinc-200 dark:border-zinc-800 rounded-lg hover:border-sky-400 dark:hover:border-sky-600 hover:bg-sky-50 dark:hover:bg-sky-950/30 hover:text-sky-700 dark:hover:text-sky-300 transition-all duration-200"
                    >
                      {company}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Selected companies */}
            {companies.length > 0 && (
              <div className="mt-4">
                <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider mb-2 block">
                  Selected ({companies.length})
                </span>
                <div className="flex flex-wrap gap-2">
                  {companies.map((c) => (
                    <FilterTag
                      key={c}
                      label={c}
                      onRemove={() => removeCompany(c)}
                      color="sky"
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Topics */}
          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-3 uppercase tracking-wider">
              Filter by Topics
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Search or select topics..."
                value={topicInput}
                onChange={(e) => setTopicInput(e.target.value)}
                className="w-full px-4 py-3 text-sm font-medium bg-white dark:bg-zinc-900 border-2 border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-900 dark:text-zinc-100 placeholder-zinc-500 dark:placeholder-zinc-500 focus:outline-none focus:border-zinc-900 dark:focus:border-white transition-all duration-200"
              />
              {topicInput && filteredTopics.length > 0 && (
                <div className="absolute z-20 w-full mt-2 max-h-60 overflow-y-auto bg-white dark:bg-zinc-900 border-2 border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl">
                  {filteredTopics.slice(0, 10).map((topic) => (
                    <button
                      key={topic}
                      onClick={() => onSelectTopic(topic)}
                      className="w-full text-left px-4 py-3 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white transition-colors first:rounded-t-xl last:rounded-b-xl"
                    >
                      {topic}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Select Topics */}
            {!topicInput && availableTopics.length > 0 && (
              <div className="mt-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">
                    Quick Select
                  </span>
                  {availableTopics.length > 10 && (
                    <button
                      onClick={() => setShowAllTopics(!showAllTopics)}
                      className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white flex items-center gap-1 transition-colors"
                    >
                      {showAllTopics ? (
                        <>
                          Show Less <ChevronUp className="w-3 h-3" />
                        </>
                      ) : (
                        <>
                          Show All <ChevronDown className="w-3 h-3" />
                        </>
                      )}
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {(showAllTopics ? availableTopics : availableTopics.slice(0, 10)).map((topic) => (
                    <button
                      key={topic.name}
                      onClick={() => onSelectTopic(topic.name)}
                      className="px-3 py-1.5  text-xs font-semibold bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border-2 border-zinc-200 dark:border-zinc-800 rounded-lg hover:border-green-400 dark:hover:border-green-600 hover:bg-green-50 dark:hover:bg-green-950/30 hover:text-green-700 dark:hover:text-green-300 transition-all duration-200 flex items-center gap-1.5"
                    >
                      <span>{topic.name}</span>
                      {/* <span className="text-[10px] opacity-60">({topic.count})</span> */}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Selected topics */}
            {topics.length > 0 && (
              <div className="mt-4">
                <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider mb-2 block">
                  Selected ({topics.length})
                </span>
                <div className="flex flex-wrap gap-2">
                  {topics.map((t) => (
                    <FilterTag
                      key={t}
                      label={t}
                      onRemove={() => removeTopic(t)}
                      color='green'
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Filter Tag Component
function FilterTag({ 
  label, 
  onRemove, 
  color 
}: { 
  label: string
  onRemove: () => void
  color: 'sky' | 'indigo' |'green'
}) {
  const colorClasses = {
    sky: 'bg-sky-100 dark:bg-sky-950/30 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-900/50 hover:bg-sky-200 dark:hover:bg-sky-900/50',
    indigo: 'bg-indigo-100 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-900/50 hover:bg-indigo-200 dark:hover:bg-indigo-900/50',
    green:'bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-900/50 hover:bg-green-200 dark:hover:bg-green-900/50',
  }

  return (
    <span className={`inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold border rounded-lg transition-all duration-200 ${colorClasses[color]}`}>
      <span className="max-w-[150px] truncate">{label}</span>
      <button
        onClick={onRemove}
        className="hover:scale-110 transition-transform duration-200"
        aria-label={`Remove ${label}`}
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </span>
  )
}

export default ChallengeFilters