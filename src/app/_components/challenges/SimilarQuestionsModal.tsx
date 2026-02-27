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
    if (diff === 'easy') return 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60'
    if (diff === 'medium') return 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/60'
    return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800/60'
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
    <div className="group border border-zinc-100 dark:border-zinc-800/70 rounded-xl p-4 bg-white dark:bg-zinc-900/40 hover:border-zinc-300 dark:hover:border-zinc-700 hover:shadow-sm transition-all duration-200">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">

          {/* Title */}
          <h3 className="text-[13.5px] font-semibold text-zinc-800 dark:text-zinc-100 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors mb-2.5 leading-snug">
            {similar.title}
          </h3>

          <div className="flex flex-wrap items-center gap-2 mb-2.5">
            {/* Difficulty badge */}
            <span className={`inline-flex px-2 py-0.5 text-[11px] font-semibold rounded-md border ${getDifficultyColor(similar.difficulty)}`}>
              {similar.difficulty}
            </span>

            {/* Details toggle */}
            {!similar._isExpanded && (
              <button
                onClick={() => toggleExpanded(index)}
                disabled={similar._isLoading}
                className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-medium text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 border border-zinc-200 dark:border-zinc-700/60 hover:border-zinc-400 dark:hover:border-zinc-500 rounded-md bg-zinc-50 dark:bg-zinc-800/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-40 transition-all duration-150"
              >
                {similar._isLoading ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>Loading</span>
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-3 h-3" />
                    <span>Details</span>
                  </>
                )}
              </button>
            )}
          </div>

          {/* Expanded details */}
          {similar._isExpanded && (
            <div className="space-y-2.5 pt-2.5 border-t border-zinc-100 dark:border-zinc-800/60">
              {/* Topic tags */}
              {similar.topicTags && similar.topicTags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {similar.topicTags.slice(0, 5).map((tag) => (
                    <span
                      key={tag.slug}
                      className="px-2 py-0.5 text-[11px] font-medium bg-zinc-100 dark:bg-zinc-800/70 text-zinc-600 dark:text-zinc-400 rounded-md border border-zinc-200/60 dark:border-zinc-700/40"
                    >
                      {tag.name}
                    </span>
                  ))}
                  {similar.topicTags.length > 5 && (
                    <span className="px-2 py-0.5 text-[11px] text-zinc-400 dark:text-zinc-600">
                      +{similar.topicTags.length - 5} more
                    </span>
                  )}
                </div>
              )}

              {/* Stats */}
              <div className="flex items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400">
                <span className="flex items-center gap-1">
                  <ThumbsUp className="w-3 h-3" />
                  <span className="font-medium tabular-nums">{similar.likes?.toLocaleString() || '0'}</span>
                </span>
                <span className="text-zinc-300 dark:text-zinc-700">·</span>
                <span className="tabular-nums">
                  <span className="font-medium">{parseStats(similar.stats || '{}')}</span>
                  <span className="ml-1 text-zinc-400 dark:text-zinc-600">accepted</span>
                </span>
              </div>

              {/* Collapse */}
              <button
                onClick={() => toggleExpanded(index)}
                className="text-[11px] text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 font-medium transition-colors"
              >
                ↑ Hide details
              </button>
            </div>
          )}
        </div>

        {/* Solve button */}
        <a
          href={`https://leetcode.com/problems/${similar.titleSlug}/`}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-700 dark:hover:bg-white text-white dark:text-zinc-900 text-[12px] font-semibold rounded-lg transition-colors duration-150 shadow-sm"
        >
          <span>Solve</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  )

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="inline-flex items-center gap-2 bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-700 dark:hover:bg-white text-white dark:text-zinc-900 rounded-lg font-semibold text-sm shadow-sm transition-colors">
            <Sparkles className="w-4 h-4" />
            Similar Questions
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-2xl max-h-[88vh] p-0 overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-xl rounded-2xl">

        {/* Header */}
        <div className="px-6 pt-6 pb-5 border-b border-zinc-100 dark:border-zinc-800/80">
          <DialogHeader>
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-zinc-400 dark:text-zinc-500" />
              <span className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 tracking-wide uppercase">
                Similar Problems
              </span>
            </div>

            <DialogTitle className="text-xl font-bold text-zinc-900 dark:text-white leading-snug">
              Related to:{' '}
              <span className="text-zinc-500 dark:text-zinc-400 font-medium">{questionTitle}</span>
            </DialogTitle>

            <DialogDescription className="text-sm text-zinc-400 dark:text-zinc-500 mt-1">
              {similarQuestions.length} challenge{similarQuestions.length !== 1 ? 's' : ''} found
            </DialogDescription>
          </DialogHeader>

          {/* Search */}
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500" />
            <input
              type="text"
              placeholder="Search by title or topic..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-300 dark:focus:ring-zinc-700 transition-all"
            />
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Loader2 className="w-6 h-6 text-zinc-400 dark:text-zinc-600 animate-spin" />
              <p className="text-sm text-zinc-400 dark:text-zinc-600">
                Finding similar challenges...
              </p>
            </div>
          ) : filteredQuestions.length === 0 ? (
            <div className="text-center py-16">
              <Search className="w-7 h-7 text-zinc-300 dark:text-zinc-700 mx-auto mb-3" />
              <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">No matches found</p>
              <p className="text-xs text-zinc-400 dark:text-zinc-600 mt-1">Try a different search term</p>
            </div>
          ) : (
            <AnimatedList
              items={filteredQuestions}
              renderItem={renderQuestion}
              showGradients={true}
              enableArrowNavigation={true}
              displayScrollbar={true}
              containerClassName="max-h-[48vh]"
              itemDelay={0.02}
            />
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between gap-4">
          <p className="text-xs text-zinc-400 dark:text-zinc-500">
            Click <span className="font-semibold text-zinc-600 dark:text-zinc-400">Details</span> to expand
          </p>

          <DialogClose asChild>
            <Button
              variant="outline"
              className="text-sm font-semibold rounded-lg border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900"
            >
              Close
            </Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  )
}