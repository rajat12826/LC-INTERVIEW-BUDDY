// app/_components/challenges/SimilarQuestionsModal.tsx
// FINAL VERSION: Proper Dialog pattern + Generic AnimatedList + Distinctive UI

'use client'

import { useState, useEffect } from 'react'
import { Search, ExternalLink, Sparkles, ChevronDown, Loader2, ThumbsUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import AnimatedList from '@/components/ui/AnimatedList'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
  DialogTrigger,
} from '@/components/ui/dialog'

interface SimilarQuestion {
  questionId?: string
  questionFrontendId?: string
  title: string
  titleSlug: string
  difficulty: string
  likes?: number
  dislikes?: number
  topicTags?: Array<{ name: string; slug: string }>
  stats?: string
  _needsDetails?: boolean
  _isLoading?: boolean
  _isExpanded?: boolean
}

interface Props {
  questionTitle: string
  similarQuestions: SimilarQuestion[]
  isLoading: boolean
  trigger?: React.ReactNode
}

export default function SimilarQuestionsModal({
  questionTitle,
  similarQuestions: initialSimilarQuestions,
  isLoading,
  trigger,
}: Props) {
  const [searchQuery, setSearchQuery] = useState('')
  const [similarQuestions, setSimilarQuestions] = useState<SimilarQuestion[]>(initialSimilarQuestions)
  const [isOpen, setIsOpen] = useState(false)

  // Update when new data comes in
  useEffect(() => {
    setSimilarQuestions(initialSimilarQuestions)
  }, [initialSimilarQuestions])

  // Lazy-load details for a specific question
  const loadQuestionDetails = async (titleSlug: string, index: number) => {
    setSimilarQuestions(prev => {
      const updated = [...prev]
      updated[index] = { ...updated[index], _isLoading: true }
      return updated
    })

    try {
      const response = await fetch(`/api/problem/${titleSlug}`)
      if (!response.ok) throw new Error('Failed to load details')
      
      const data = await response.json()
      
      setSimilarQuestions(prev => {
        const updated = [...prev]
        updated[index] = {
          ...data.problem,
          _needsDetails: false,
          _isLoading: false,
          _isExpanded: true
        }
        return updated
      })
    } catch (error) {
      console.error('Error loading question details:', error)
      setSimilarQuestions(prev => {
        const updated = [...prev]
        updated[index] = { ...updated[index], _isLoading: false }
        return updated
      })
    }
  }

  const toggleExpanded = (index: number) => {
    const question = similarQuestions[index]
    
    if (question._needsDetails && !question._isLoading) {
      loadQuestionDetails(question.titleSlug, index)
    } else if (!question._needsDetails) {
      setSimilarQuestions(prev => {
        const updated = [...prev]
        updated[index] = { 
          ...updated[index], 
          _isExpanded: !updated[index]._isExpanded 
        }
        return updated
      })
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    const diff = difficulty?.toLowerCase()
    if (diff === 'easy') return 'text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/30 border-teal-300 dark:border-teal-800'
    if (diff === 'medium') return 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800'
    return 'text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 border-rose-300 dark:border-rose-800'
  }

  const parseStats = (stats: string) => {
    try {
      const parsed = JSON.parse(stats)
      return parsed.acRate || 'N/A'
    } catch {
      return 'N/A'
    }
  }

  const filteredQuestions = similarQuestions.filter(q =>
    searchQuery === '' ||
    q.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    q.topicTags?.some(tag => tag.name.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  // Render individual question card
  const renderQuestion = (similar: SimilarQuestion, index: number) => (
    <div className="group relative border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl p-5 bg-white/50 dark:bg-zinc-900/30 backdrop-blur-sm hover:border-teal-400/50 dark:hover:border-teal-600/50 hover:shadow-xl hover:shadow-teal-500/10 dark:hover:shadow-teal-400/5 transition-all duration-500 hover:-translate-y-0.5">
      {/* Subtle gradient background on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-teal-50/0 via-transparent to-sky-50/0 dark:from-teal-950/0 dark:to-sky-950/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-xl pointer-events-none" />
      
      <div className="relative flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h3 className="text-[15px] font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-teal-700 dark:group-hover:text-teal-400 transition-colors duration-300 mb-3 leading-snug">
            {similar.title}
          </h3>

          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className={`inline-flex px-2.5 py-0.5 text-[11px] font-bold rounded-md border tracking-wide uppercase ${getDifficultyColor(similar.difficulty)}`}>
              {similar.difficulty}
            </span>

            {/* Show Details button when collapsed (either not loaded yet OR loaded but collapsed) */}
            {!similar._isExpanded && (
              <button
                onClick={() => toggleExpanded(index)}
                disabled={similar._isLoading}
                className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium bg-gradient-to-r from-teal-50 to-sky-50 dark:from-teal-950/30 dark:to-sky-950/30 text-teal-700 dark:text-teal-400 rounded-md hover:from-teal-100 hover:to-sky-100 dark:hover:from-teal-900/50 dark:hover:to-sky-900/50 border border-teal-200/50 dark:border-teal-800/50 disabled:opacity-50 transition-all duration-300"
              >
                {similar._isLoading ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>Loading</span>
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-3 h-3" />
                    <span className='cursor-pointer'>Details</span>
                  </>
                )}
              </button>
            )}
          </div>

          {/* Expanded details section - show when expanded */}
          {similar._isExpanded && (
            <div className="space-y-3 pt-2 border-t border-zinc-200/50 dark:border-zinc-800/50">
              {/* Topic tags */}
              {similar.topicTags && similar.topicTags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {similar.topicTags.slice(0, 5).map((tag) => (
                    <span
                      key={tag.slug}
                      className="px-2.5 py-0.5 text-[11px] font-medium bg-zinc-100 dark:bg-zinc-800/80 text-zinc-700 dark:text-zinc-400 rounded-md border border-zinc-200/50 dark:border-zinc-700/50"
                    >
                      {tag.name}
                    </span>
                  ))}
                  {similar.topicTags.length > 5 && (
                    <span className="px-2.5 py-0.5 text-[11px] font-medium text-zinc-500 dark:text-zinc-500">
                      +{similar.topicTags.length - 5}
                    </span>
                  )}
                </div>
              )}

              {/* Stats */}
              <div className="flex items-center gap-4 text-xs text-zinc-600 dark:text-zinc-400">
                <span className="flex items-center gap-1.5">
                  <ThumbsUp className="w-3.5 h-3.5 text-teal-600 dark:text-teal-500" />
                  <span className="font-semibold tabular-nums">{similar.likes?.toLocaleString() || '0'}</span>
                </span>
                <span className="w-1 h-1 rounded-full bg-zinc-300 dark:bg-zinc-700" />
                <span className="tabular-nums">
                  <span className="font-semibold">{parseStats(similar.stats || '{}')}</span>
                  <span className="ml-1 text-zinc-500 dark:text-zinc-500">accepted</span>
                </span>
              </div>

              {/* Collapse button */}
              <button
                onClick={() => toggleExpanded(index)}
                className="cursor-pointer text-xs text-teal-700 dark:text-teal-400 hover:text-teal-800 dark:hover:text-teal-300 font-medium transition-colors underline decoration-dotted underline-offset-2"
              >
                Hide details
              </button>
            </div>
          )}
        </div>

        {/* Solve button */}
        <a
          href={`https://leetcode.com/problems/${similar.titleSlug}/`}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-br from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 dark:from-teal-500 dark:to-teal-600 dark:hover:from-teal-600 dark:hover:to-teal-700 text-white text-sm font-bold rounded-lg transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-teal-500/30 hover:shadow-xl hover:shadow-teal-500/40"
        >
          <span>Solve</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  )

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="inline-flex items-center gap-2 bg-gradient-to-r from-teal-600 to-sky-600 hover:from-teal-700 hover:to-sky-700 text-white rounded-lg font-semibold shadow-lg shadow-teal-500/30">
            <Sparkles className="w-4 h-4" />
            Similar Questions
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-5xl max-h-[90vh] p-0 overflow-hidden border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-950">
        {/* Header with gradient background */}
        <div className="relative px-6 sm:px-8 pt-8 pb-6 border-b border-zinc-200/80 dark:border-zinc-800/80 overflow-hidden">
          {/* Animated gradient background */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-teal-100/40 via-sky-100/30 to-transparent dark:from-teal-950/30 dark:via-sky-950/20 dark:to-transparent" />
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-teal-200/20 via-sky-200/10 to-transparent dark:from-teal-900/20 dark:via-sky-900/10 dark:to-transparent blur-3xl" />
          
          <div className="relative">
            <DialogHeader>
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-teal-100 to-sky-100 dark:from-teal-950/50 dark:to-sky-950/50 border border-teal-200/50 dark:border-teal-800/50 mb-4 w-fit">
                <Sparkles className="w-3.5 h-3.5 text-teal-700 dark:text-teal-400" />
                <span className="text-xs font-bold text-teal-800 dark:text-teal-300 tracking-wide uppercase">
                  Similar Problems
                </span>
              </div>
              
              <DialogTitle className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-white leading-tight mb-2">
                Related to: <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-700 to-sky-700 dark:from-teal-400 dark:to-sky-400">{questionTitle}</span>
              </DialogTitle>
              
              <DialogDescription className="text-sm text-zinc-600 dark:text-zinc-400">
                Discovered <span className="font-bold text-zinc-900 dark:text-white">{similarQuestions.length}</span> related challenge{similarQuestions.length !== 1 ? 's' : ''} • Expand for detailed insights
              </DialogDescription>
            </DialogHeader>

            {/* Search bar */}
            <div className="relative mt-6">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 dark:text-zinc-500" />
              <input
                type="text"
                placeholder="Search by title or topic..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl text-sm placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50 dark:focus:ring-teal-400/50 focus:border-teal-500/50 dark:focus:border-teal-400/50 transition-all"
              />
            </div>
          </div>
        </div>

        {/* Body with AnimatedList */}
        <div className="px-6 sm:px-8 py-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="relative w-16 h-16 mb-6">
                <div className="absolute inset-0 border-[3px] border-zinc-200 dark:border-zinc-800 rounded-full" />
                <div className="absolute inset-0 border-[3px] border-transparent border-t-teal-600 dark:border-t-teal-400 rounded-full animate-spin" />
              </div>
              <p className="text-sm font-semibold text-zinc-600 dark:text-zinc-400 animate-pulse">
                Searching for similar challenges...
              </p>
            </div>
          ) : filteredQuestions.length === 0 ? (
            <div className="text-center py-20">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-zinc-900 dark:to-zinc-800 mb-6 shadow-inner">
                <Search className="w-8 h-8 text-zinc-400 dark:text-zinc-600" />
              </div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-2">
                No matches found
              </h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Try a different search term or clear filters
              </p>
            </div>
          ) : (
            <AnimatedList
              items={filteredQuestions}
              renderItem={renderQuestion}
              showGradients={true}
              enableArrowNavigation={true}
              displayScrollbar={true}
              containerClassName="max-h-[50vh]"
              itemDelay={0.02}
            />
          )}
        </div>

        {/* Footer */}
        <div className="px-6 sm:px-8 py-5 border-t border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/30">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-zinc-600 dark:text-zinc-400 flex items-center gap-2">
              <span className="text-base">💡</span>
              <span>Click <span className="font-semibold text-zinc-900 dark:text-white">Details</span> to expand problem information</span>
            </p>
            
            <DialogClose asChild>
              <Button className="w-full sm:w-auto bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 rounded-lg font-semibold shadow-lg">
                Close
              </Button>
            </DialogClose>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}