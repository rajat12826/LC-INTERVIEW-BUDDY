'use client'

import { FC, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowUpRight, ChevronDown, ChevronUp, Building2, Check, Circle, Sparkles } from 'lucide-react'
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
    const questionId = getQuestionIdFromUrl(question["Link of Question"])
    setCurrentQuestion(question)
    router.push(`/leetcode/${questionId}`)
  }

  // Difficulty color mapping
  const difficultyConfig = {
    EASY: {
      bg: 'bg-emerald-100 dark:bg-emerald-950/30',
      text: 'text-emerald-700 dark:text-emerald-300',
      border: 'border-emerald-200 dark:border-emerald-900/50',
      dot: 'bg-emerald-500'
    },
    MEDIUM: {
      bg: 'bg-amber-100 dark:bg-amber-950/30',
      text: 'text-amber-700 dark:text-amber-300',
      border: 'border-amber-200 dark:border-amber-900/50',
      dot: 'bg-amber-500'
    },
    HARD: {
      bg: 'bg-rose-100 dark:bg-rose-950/30',
      text: 'text-rose-700 dark:text-rose-300',
      border: 'border-rose-200 dark:border-rose-900/50',
      dot: 'bg-rose-500'
    }
  }

  const config = difficultyConfig[question.Difficulty as keyof typeof difficultyConfig] || difficultyConfig.EASY

  return (
    <div className="group relative h-full rounded-3xl overflow-hidden transition-all duration-500 hover:scale-[1.02]">
      {/* Card background with gradient border effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-zinc-100 to-white dark:from-zinc-800 dark:to-zinc-900 rounded-3xl" />
      <div className="absolute inset-[1px] bg-white dark:bg-zinc-950 rounded-3xl" />
      
      {/* Hover gradient effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-sky-500/0 via-indigo-500/0 to-violet-500/0 group-hover:from-sky-500/5 group-hover:via-indigo-500/5 group-hover:to-violet-500/5 transition-all duration-500 rounded-3xl" />

      {/* Content */}
      <div className="relative h-full p-7 flex flex-col">
        {/* Header Section */}
        <div className="flex items-start justify-between gap-3 mb-5">
          <div className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-xl border ${config.bg} ${config.text} ${config.border}`}>
            <div className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
            {question.Difficulty}
          </div>
          
          <div className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700">
            <Building2 className="w-3.5 h-3.5" />
            {question['Frequency (Number of Companies)']}
          </div>
        </div>

        {/* Title */}
        <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-5 leading-tight min-h-[3.5rem] line-clamp-2 group-hover:text-zinc-700 dark:group-hover:text-zinc-200 transition-colors">
          {question.Question}
        </h3>

        {/* Topics */}
        <div className="mb-5">
          <div className="inline-flex items-center gap-2 px-3.5 py-2 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl max-w-full">
            <svg className="w-3.5 h-3.5 text-zinc-600 dark:text-zinc-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
            <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 truncate">
              {question.Topics}
            </span>
          </div>
        </div>

        {/* Companies Section */}
        <div className="mb-6 flex-grow min-h-[4rem]">
          <div className="flex flex-wrap gap-2">
            {companies.map((company, i) => (
              <span
                key={i}
                className="inline-flex items-center px-3 py-1.5 text-xs font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
              >
                {company}
              </span>
            ))}
            
            {hasMoreCompanies && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-800/50 border-2 border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all"
              >
                {isExpanded ? (
                  <>
                    <ChevronUp className="w-3.5 h-3.5" />
                    Less
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-3.5 h-3.5" />
                    +{companyArray.length - 5}
                  </>
                )}
              </button>
            )}
          </div>

          {/* Expanded Companies */}
          {isExpanded && remainingCompanies.length > 0 && (
            <div className="mt-3 pt-3 border-t border-zinc-200 dark:border-zinc-800">
              <div className="flex flex-wrap gap-2">
                {remainingCompanies.map((company, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center px-3 py-1.5 text-xs font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 rounded-lg"
                  >
                    {company}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Actions Section */}
        <div className="space-y-3 pt-5 border-t-2 border-zinc-200 dark:border-zinc-800">
          {/* Primary actions row */}
          <div className="flex items-center gap-3">
            {/* AI Tutor Button - Primary CTA */}
            <button
              onClick={handleAITutorClick}
              className="group/btn relative flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-br from-zinc-900 to-zinc-800 dark:from-white dark:to-zinc-100 text-white dark:text-zinc-900 text-sm font-bold rounded-xl overflow-hidden transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl"
            >
              <span className="absolute inset-0 w-full h-full bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300" />
              <Sparkles className="w-4 h-4 relative z-10" />
              <span className="relative z-10">AI Tutor</span>
            </button>

            {/* Solved Status Button */}
            <button
              onClick={() => markAsSolved(question.Question)}
              className={`inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold rounded-xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] border-2 min-w-[100px] ${
                solved
                  ? 'bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/50 hover:bg-emerald-200 dark:hover:bg-emerald-900/50'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-700'
              }`}
            >
              {solved ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Solved</span>
                </>
              ) : (
                <>
                  <Circle className="w-4 h-4" />
                  <span>Mark</span>
                </>
              )}
            </button>
          </div>

          {/* View Problem Link */}
          <Link
            href={question['Link of Question']}
            target="_blank"
            rel="noopener noreferrer"
            className="group/link inline-flex items-center justify-center gap-2 w-full px-4 py-2.5 text-sm font-semibold text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-xl transition-all duration-200 border border-zinc-200 dark:border-zinc-700"
          >
            <span>View on LeetCode</span>
            <ArrowUpRight className="w-4 h-4 group-hover/link:tranzinc-x-0.5 group-hover/link:-tranzinc-y-0.5 transition-transform duration-300" />
          </Link>
        </div>
      </div>
    </div>
  )
}

export default QuestionCard