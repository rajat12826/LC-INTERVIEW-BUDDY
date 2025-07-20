'use client'

import { FC, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { BadgeCheck, ArrowUpRight, ChevronUp, ChevronDown, Check, Circle } from 'lucide-react'
import clsx from 'clsx'
import { useQuestionStore } from '@/utils/stores/useQuestionStore'

interface Question {
  Difficulty: string
  Question: string
  'Frequency (Number of Companies)': number
  'Link of Question': string
  'Companies Asking This Question': string
  Topics: string
}

interface QuestionCardProps {
  question: Question
}

const getDifficultyStyle = (difficulty: string) => {
  switch (difficulty) {
    case 'EASY':
      return 'bg-green-100 text-green-800  flex justify-center items-center  dark:bg-green-900 dark:text-green-200'
    case 'MEDIUM':
      return 'bg-yellow-100 text-[#ffa000]  dark:bg-[#ffa000] dark:text-yellow-200'
    case 'HARD':
      return 'bg-red-100 text-red-800 flex justify-center dark:bg-[#ff1744] dark:text-red-200'
    default:
      return 'bg-gray-100 text-gray-800 flex justify-center dark:bg-gray-700 dark:text-gray-200'
  }
}

const QuestionCard: FC<QuestionCardProps> = ({ question }) => {
  const router = useRouter()
  const { markAsSolved, isSolved, setCurrentQuestion, getQuestionIdFromUrl } = useQuestionStore()

  const solved = isSolved(question.Question)

  const companyArray = question['Companies Asking This Question'].split(',')
  const companies = companyArray.map((c) => c.trim()).slice(0, 5)
  const remainingCompanies = companyArray.map((c) => c.trim()).slice(5, Math.min(companyArray.length, 50))
  const [isExpanded, setIsExpanded] = useState(false)
  
  const hasMoreCompanies = companyArray.length > 5

  const handleAITutorClick = () => {
    // Extract ID from the LeetCode URL
    const questionId = getQuestionIdFromUrl(question["Link of Question"])
    
    // Set current question in store for the AI tutor page to access
    setCurrentQuestion(question)
    
    // Navigate to the AI tutor page
    router.push(`/questions/${questionId}`)
  }

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <span
          className={clsx(
            'text-xs font-semibold px-3 text-center py-1 rounded-full',
            getDifficultyStyle(question.Difficulty)
          )}
        >
          {question.Difficulty}
        </span>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {question['Frequency (Number of Companies)']} companies
        </span>
      </div>

      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        {question.Question}
      </h3>

      <p className="text-sm text-gray-600  dark:text-gray-300 mb-4">
        Topics: <span className="font-medium">{question.Topics}</span>
      </p>

      <div className="mb-4">
        <div className="flex flex-wrap gap-2 mb-2">
          {companies.map((company, i) => (
            <span
              key={i}
              className="inline-flex items-center text-xs font-medium bg-blue-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2.5 py-1.5 rounded-md border border-gray-200 dark:border-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-900/50 "
            >
              <BadgeCheck className="w-3 h-3 mr-1" />
              {company}
            </span>
          ))}
          
          {hasMoreCompanies && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="inline-flex items-center text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-gray-600 dark:hover:text-gray-400 px-2.5 py-1.5 rounded-md border border-gray-300 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 "
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="w-3 h-3 mr-1" />
                  Show less
                </>
              ) : (
                <>
                  <ChevronDown className="w-3 h-3 mr-1" />
                  +{companyArray.length - 5} more
                </>
              )}
            </button>
          )}
        </div>

        {/* Expanded Companies */}
        {isExpanded && remainingCompanies.length > 0 && (
          <div className=" pt-2 border-t border-gray-200 dark:border-gray-700">
            <div className="flex flex-wrap gap-2">
              {remainingCompanies.map((company, i) => (
                <span
                  key={i}
                  className="inline-flex items-center text-xs font-medium bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2.5 py-1.5 rounded-md border border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 "
                >
                  <BadgeCheck className="w-3 h-3 mr-1 text-gray-500 dark:text-gray-400" />
                  {company}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className='flex justify-between items-center'>
        <Link
          href={question['Link of Question']}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center text-sm text-blue-600 dark:text-indigo-300 font-medium hover:underline"
        >
          View on LeetCode <ArrowUpRight className="w-4 h-4 ml-1" />
        </Link>

        {/* Action Buttons */}
        <div className="flex gap-2">
          {/* AI Tutor Button */}
          <button
            onClick={handleAITutorClick}
            className="inline-flex items-center justify-center px-3 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-medium rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
          >
            <svg className="w-3 h-3 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
              />
            </svg>
            AI Tutor
          </button>

          {/* Solved Status */}
          <button
            onClick={() => markAsSolved(question.Question)}
            className={clsx(
              "group relative inline-flex items-center justify-center px-2 py-1 text-sm font-semibold rounded-lg transition-all duration-200 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 shadow-sm",
              solved
                ? "bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-emerald-500/25 hover:shadow-emerald-500/40 focus:ring-emerald-500 border border-emerald-500"
                : "bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-500 hover:from-gray-100 hover:to-gray-200 dark:hover:from-gray-600 dark:hover:to-gray-500 focus:ring-gray-500 shadow-gray-300/20 hover:shadow-gray-400/30"
            )}
          >
            <div className="flex items-center space-x-2">
              {solved ? (
                <>
                  <Check className="w-4 h-4 transition-transform group-hover:scale-110" />
                  <span>Solved</span>
                </>
              ) : (
                <>
                  <Circle className="w-4 h-4 transition-transform group-hover:scale-110" />
                  <span>Mark as Done</span>
                </>
              )}
            </div>
            
            {/* Subtle glow effect for solved state */}
            {solved && (
              <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-emerald-400/20 to-green-500/20 blur-sm -z-10 group-hover:blur-md transition-all duration-200" />
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default QuestionCard