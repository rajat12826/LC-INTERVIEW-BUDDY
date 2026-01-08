'use client'

import { FC, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowUpRight, Check, Circle, Sparkles, ChevronDown, ChevronUp } from 'lucide-react'
import { useQuestionStore } from '@/utils/stores/useQuestionStore'

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

interface PremiumQuestionCardProps {
  question: PQuestion
}

const PremiumQuestionCard: FC<PremiumQuestionCardProps> = ({ question }) => {
  const router = useRouter()
  const { markAsSolved, isSolved, setCurrentPQuestion, getQuestionIdFromUrl } = useQuestionStore()

  const solved = isSolved(question.title)
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false)

  const handleAITutorClick = () => {
    const questionId = getQuestionIdFromUrl(question.link)
    setCurrentPQuestion(question)
    router.push(`/leetcode/premium/${questionId}`)
  }

  // Difficulty color mapping
  const difficultyConfig = {
    Easy: {
      bg: 'bg-emerald-100 dark:bg-emerald-950/30',
      text: 'text-emerald-700 dark:text-emerald-300',
      border: 'border-emerald-200 dark:border-emerald-900/50',
      dot: 'bg-emerald-500'
    },
    Medium: {
      bg: 'bg-amber-100 dark:bg-amber-950/30',
      text: 'text-amber-700 dark:text-amber-300',
      border: 'border-amber-200 dark:border-amber-900/50',
      dot: 'bg-amber-500'
    },
    Hard: {
      bg: 'bg-rose-100 dark:bg-rose-950/30',
      text: 'text-rose-700 dark:text-rose-300',
      border: 'border-rose-200 dark:border-rose-900/50',
      dot: 'bg-rose-500'
    }
  }

  const config = difficultyConfig[question.difficulty as keyof typeof difficultyConfig] || difficultyConfig.Easy

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
            {question.difficulty}
          </div>
          
          <div className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Premium
          </div>
        </div>

        {/* Title */}
        <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-3 leading-tight min-h-[3.5rem] line-clamp-2 group-hover:text-zinc-700 dark:group-hover:text-zinc-200 transition-colors">
          {question.title}
        </h3>

        {/* Description */}
        <div className="mb-5">
          <p className={`text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed transition-all duration-300 ${
            isDescriptionExpanded ? '' : 'line-clamp-3'
          }`}>
            {question.description}
          </p>
          {question.description.length > 150 && (
            <button
              onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
              className="inline-flex items-center gap-1 mt-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition-colors"
            >
              {isDescriptionExpanded ? (
                <>
                  <ChevronUp className="w-3.5 h-3.5" />
                  View Less
                </>
              ) : (
                <>
                  <ChevronDown className="w-3.5 h-3.5" />
                  View More
                </>
              )}
            </button>
          )}
        </div>

        {/* Metadata Section */}
        <div className="mb-6 flex-grow">
          <div className="flex flex-wrap gap-2">
            {question.examples && question.examples.length > 0 && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 rounded-lg">
                <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                {question.examples.length} Example{question.examples.length !== 1 ? 's' : ''}
              </div>
            )}

            {question.constraints && question.constraints.length > 0 && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 rounded-lg">
                <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                {question.constraints.length} Constraint{question.constraints.length !== 1 ? 's' : ''}
              </div>
            )}
          </div>
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
              onClick={() => markAsSolved(question.title)}
              className={`cursor-pointer inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold rounded-xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] border-2 min-w-[100px] ${
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
            href={question.link}
            target="_blank"
            rel="noopener noreferrer"
            className="group/link inline-flex items-center justify-center gap-2 w-full px-4 py-2.5 text-sm font-semibold text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-xl transition-all duration-200 border border-zinc-200 dark:border-zinc-700"
          >
            <span>View on LeetCode</span>
            <ArrowUpRight className="w-4 h-4 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-transform duration-300" />
          </Link>
        </div>
      </div>
    </div>
  )
}

export default PremiumQuestionCard