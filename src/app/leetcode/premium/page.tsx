'use client'

import { useMemo, useState, useCallback, useEffect, useRef } from 'react'
import { useChallengeFilterStoreP } from '../../../utils/stores/useChallegeStoreP'
import { useQuestionStore } from '@/utils/stores/useQuestionStore'
import PremiumQuestionCard from '@/app/_components/challenges/PremiumQuestionCard'
import PremiumChallengeFilters from '@/app/_components/challenges/ChallegeFilterP'
import { Button } from '@/components/ui/button'
import { ChevronDown, Crown, Flame, Target, Zap } from 'lucide-react'
import DotGrid from '@/app/_components/DotGrid'

type Example = {
  input: string
  output: string | number
  explanation?: string
  image?: string
}

type PQuestion = {
  title: string
  link: string
  difficulty: 'Easy' | 'Medium' | 'Hard'
  description: string
  steps?: string[]
  illustration?: string
  note?: string
  key_points?: string[]
  examples: Example[]
  constraints: string[]
}

function useVirtualScrolling(items: PQuestion[], itemsPerPage = 24) {
  const [currentPage, setCurrentPage] = useState(1)

  const paginatedItems = useMemo(() => {
    return items.slice(0, currentPage * itemsPerPage)
  }, [items, currentPage, itemsPerPage])

  const hasMore = currentPage * itemsPerPage < items.length

  const loadMore = useCallback(() => {
    if (hasMore) setCurrentPage(prev => prev + 1)
  }, [hasMore])

  const reset = useCallback(() => setCurrentPage(1), [])

  return { paginatedItems, hasMore, loadMore, reset }
}

// ── Animated counter ──────────────────────────────────────────────────────────
function AnimatedNumber({ value }: { value: number }) {
  const [display, setDisplay] = useState(0)
  const raf = useRef<number | null>(null)
  const startRef = useRef<number | null>(null)

  useEffect(() => {
    startRef.current = null
    const duration = 800
    const from = display
    const step = (ts: number) => {
      if (startRef.current === null) startRef.current = ts
      const p = Math.min((ts - startRef.current) / duration, 1)
      const ease = 1 - Math.pow(1 - p, 3)
      setDisplay(Math.round(from + (value - from) * ease))
      if (p < 1) raf.current = requestAnimationFrame(step)
    }
    raf.current = requestAnimationFrame(step)
    return () => {
      if (raf.current !== null) cancelAnimationFrame(raf.current)
    }
  }, [value]) // eslint-disable-line react-hooks/exhaustive-deps

  return <>{display}</>
}

export default function PremiumChallengesPage() {
  const allPremiumQuestions = useQuestionStore(s => s.premiumQuestions)
  const { search, difficulty, solved, clearAll } = useChallengeFilterStoreP()
  const isSolved = useQuestionStore(s => s.isSolved)

  const filteredQuestions = useMemo(() => {
    if (!allPremiumQuestions) return []
    return allPremiumQuestions.filter(q => {
      const matchesSearch =
        search === '' ||
        q.title.toLowerCase().includes(search.toLowerCase()) ||
        q.description.toLowerCase().includes(search.toLowerCase())
      const matchesDifficulty =
        difficulty === '' || q.difficulty.toLowerCase() === difficulty.toLowerCase()
      const matchesSolved =
        solved === 'all' ||
        (solved === 'solved' && isSolved(q.title)) ||
        (solved === 'unsolved' && !isSolved(q.title))
      return matchesSearch && matchesDifficulty && matchesSolved
    })
  }, [allPremiumQuestions, search, difficulty, solved, isSolved])

  const { paginatedItems, hasMore, loadMore, reset } = useVirtualScrolling(filteredQuestions, 24)
  useMemo(() => { reset() }, [filteredQuestions.length, reset])

  const stats = useMemo(() => ({
    total: filteredQuestions.length,
    easy: filteredQuestions.filter(c => c.difficulty.toLowerCase() === 'easy').length,
    medium: filteredQuestions.filter(c => c.difficulty.toLowerCase() === 'medium').length,
    hard: filteredQuestions.filter(c => c.difficulty.toLowerCase() === 'hard').length,
  }), [filteredQuestions])

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#050506] transition-colors duration-500 overflow-x-hidden">

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="relative py-24 sm:py-32 overflow-hidden border-b border-zinc-200/60 dark:border-white/[0.06]">

        {/* DotGrid */}
        <div className="absolute inset-0 z-0">
          <DotGrid
            dotSize={8}
            gap={20}
            baseColor="#cbd5e1"
            activeColor="#f59e0b"
            proximity={100}
            shockRadius={200}
            shockStrength={4}
            resistance={800}
            returnDuration={1.8}
          />
        </div>

        {/* Layered atmosphere — dark mode */}
        <div className="absolute inset-0 z-[1] bg-gradient-to-b from-zinc-50/95 via-zinc-50/80 to-zinc-50/95 dark:from-[#050506]/95 dark:via-[#050506]/80 dark:to-[#050506]/95" />

        {/* Animated ambient blobs */}
        <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[900px] h-[500px] rounded-full bg-amber-500/10 dark:bg-amber-500/[0.12] blur-[140px] animate-blob-float z-[2]" />
        <div className="absolute bottom-[-5%] left-[10%] w-[600px] h-[400px] rounded-full bg-orange-500/8 dark:bg-orange-600/[0.08] blur-[120px] animate-blob-float-slow z-[2]" />
        <div className="absolute top-[20%] right-[5%] w-[400px] h-[400px] rounded-full bg-yellow-500/6 dark:bg-yellow-500/[0.06] blur-[100px] animate-blob-float-slower z-[2]" />

        {/* Noise texture overlay */}
        <div className="absolute inset-0 z-[3] opacity-[0.015] dark:opacity-[0.03]"
          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`, backgroundSize: '256px' }} />

        {/* Thin grid overlay */}
        <div className="absolute inset-0 z-[3] opacity-[0.02] dark:opacity-[0.04]"
          style={{ backgroundImage: `linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)`, backgroundSize: '64px 64px' }} />

        {/* Content */}
        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-10">

            {/* Eyebrow badge */}
            <div className={`inline-flex items-center gap-2.5 px-4 py-2 rounded-full
              bg-gradient-to-r from-amber-500/10 to-orange-500/10
              dark:from-amber-500/[0.12] dark:to-orange-500/[0.08]
              border border-amber-500/25 dark:border-amber-500/20
              backdrop-blur-xl
              shadow-[0_0_0_1px_rgba(245,158,11,0.1),0_4px_12px_rgba(245,158,11,0.08)]
              dark:shadow-[0_0_0_1px_rgba(245,158,11,0.08),0_4px_24px_rgba(245,158,11,0.12)]`}>
              <Crown className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span className="text-xs font-semibold tracking-[0.12em] uppercase text-amber-700 dark:text-amber-300">
                Premium Problem Collection
              </span>
              <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            </div>

            {/* Headline */}
            <div className="space-y-4">
              <h1 className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-bold tracking-[-0.03em] leading-[1.05]">
                <span className="block text-zinc-900 dark:text-[#EDEDEF]">
                  Exclusive Premium
                </span>
                <span className={`block bg-gradient-to-r from-amber-600 via-orange-500 to-yellow-500
                  dark:from-amber-400 dark:via-orange-400 dark:to-yellow-400
                  bg-clip-text text-transparent
                  [background-size:200%_auto] animate-shimmer`}>
                  Coding Challenges
                </span>
              </h1>

              <p className="text-lg sm:text-xl text-zinc-600 dark:text-[#8A8F98] max-w-2xl mx-auto leading-relaxed">
                <span className="font-semibold text-zinc-900 dark:text-[#EDEDEF]">
                  <AnimatedNumber value={stats.total} />
                </span>{' '}
                premium problems with detailed explanations, illustrations, and step-by-step solutions
              </p>
            </div>

            {/* Stat pills */}
            <div className="inline-flex flex-wrap items-center justify-center gap-4 sm:gap-6">
              <StatPill label="Easy" count={stats.easy} icon={<Zap className="w-3.5 h-3.5" />} color="emerald" />
              <div className="hidden sm:block w-px h-10 bg-zinc-300/50 dark:bg-white/[0.06]" />
              <StatPill label="Medium" count={stats.medium} icon={<Target className="w-3.5 h-3.5" />} color="amber" />
              <div className="hidden sm:block w-px h-10 bg-zinc-300/50 dark:bg-white/[0.06]" />
              <StatPill label="Hard" count={stats.hard} icon={<Flame className="w-3.5 h-3.5" />} color="rose" />
            </div>
          </div>
        </div>

        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-500/30 to-transparent z-[4]" />
      </section>

      {/* ── MAIN CONTENT ─────────────────────────────────────────────────── */}
      <div className="relative max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">

        {/* Filters */}
        <div className="mb-10">
          <div className={`relative rounded-2xl overflow-hidden
            bg-white/70 dark:bg-white/[0.03]
            border border-zinc-200/60 dark:border-white/[0.06]
            shadow-[0_2px_20px_rgba(0,0,0,0.06),0_0_0_1px_rgba(0,0,0,0.03)]
            dark:shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_4px_40px_rgba(0,0,0,0.4)]
            backdrop-blur-xl`}>
            {/* Subtle top glow line */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-500/40 to-transparent" />
            <div className="p-5 lg:p-7">
              <PremiumChallengeFilters />
            </div>
          </div>
        </div>

        {/* Grid */}
        {paginatedItems.length > 0 ? (
          <>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6 mb-14">
              {paginatedItems.map((question, i) => (
                <div
                  key={question.title}
                  className="animate-card-reveal"
                  style={{ animationDelay: `${(i % 24) * 40}ms` }}
                >
                  <PremiumQuestionCard question={question} />
                </div>
              ))}
            </div>

            {hasMore && (
              <div className="text-center space-y-4">
                <Button
                  onClick={loadMore}
                  size="lg"
                  className={`group relative inline-flex items-center gap-2.5 px-8 py-6 rounded-xl overflow-hidden
                    bg-gradient-to-b from-amber-500 to-orange-600
                    hover:from-amber-400 hover:to-orange-500
                    text-white font-semibold text-sm tracking-wide
                    shadow-[0_0_0_1px_rgba(245,158,11,0.5),0_4px_12px_rgba(245,158,11,0.3),inset_0_1px_0_rgba(255,255,255,0.2)]
                    hover:shadow-[0_0_0_1px_rgba(245,158,11,0.6),0_8px_30px_rgba(245,158,11,0.35),inset_0_1px_0_rgba(255,255,255,0.2)]
                    active:scale-[0.98]
                    transition-all duration-200`}
                >
                  {/* Shine sweep */}
                  <span className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-in-out bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                  <span>Load More Problems</span>
                  <ChevronDown className="w-4 h-4 group-hover:translate-y-0.5 transition-transform duration-200" />
                </Button>
                <p className="text-sm font-medium text-zinc-500 dark:text-[#8A8F98]">
                  Showing{' '}
                  <span className="text-zinc-900 dark:text-[#EDEDEF] font-semibold">{paginatedItems.length}</span>
                  {' '}of{' '}
                  <span className="text-zinc-900 dark:text-[#EDEDEF] font-semibold">{filteredQuestions.length}</span>
                  {' '}problems
                </p>
              </div>
            )}
          </>
        ) : (
          <EmptyState onReset={clearAll} />
        )}
      </div>

      <style jsx>{`
        @keyframes blob-float {
          0%, 100% { transform: translateY(0) rotate(0deg) scale(1); }
          50% { transform: translateY(-20px) rotate(1deg) scale(1.02); }
        }
        @keyframes blob-float-slow {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-30px) rotate(-1deg); }
        }
        @keyframes blob-float-slower {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          33% { transform: translateY(-15px) rotate(0.5deg); }
          66% { transform: translateY(-25px) rotate(-0.5deg); }
        }
        @keyframes shimmer {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes card-reveal {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-blob-float        { animation: blob-float 10s ease-in-out infinite; }
        .animate-blob-float-slow   { animation: blob-float-slow 14s ease-in-out infinite; }
        .animate-blob-float-slower { animation: blob-float-slower 18s ease-in-out infinite; }
        .animate-shimmer           { animation: shimmer 4s ease infinite; background-size: 200% auto; }
        .animate-card-reveal       { animation: card-reveal 0.5s cubic-bezier(0.16, 1, 0.3, 1) both; }
      `}</style>
    </div>
  )
}

// ── Stat Pill ─────────────────────────────────────────────────────────────────
function StatPill({ label, count, icon, color }: {
  label: string
  count: number
  icon: React.ReactNode
  color: 'emerald' | 'amber' | 'rose'
}) {
  const cfg = {
    emerald: {
      wrap:  'bg-emerald-50/80 dark:bg-emerald-500/[0.06] border-emerald-200/60 dark:border-emerald-500/[0.12]',
      icon:  'bg-emerald-100 dark:bg-emerald-500/[0.12] text-emerald-600 dark:text-emerald-400',
      count: 'text-emerald-700 dark:text-emerald-300',
      label: 'text-emerald-600/80 dark:text-emerald-500',
      dot:   'bg-emerald-500',
    },
    amber: {
      wrap:  'bg-amber-50/80 dark:bg-amber-500/[0.06] border-amber-200/60 dark:border-amber-500/[0.12]',
      icon:  'bg-amber-100 dark:bg-amber-500/[0.12] text-amber-600 dark:text-amber-400',
      count: 'text-amber-700 dark:text-amber-300',
      label: 'text-amber-600/80 dark:text-amber-500',
      dot:   'bg-amber-500',
    },
    rose: {
      wrap:  'bg-rose-50/80 dark:bg-rose-500/[0.06] border-rose-200/60 dark:border-rose-500/[0.12]',
      icon:  'bg-rose-100 dark:bg-rose-500/[0.12] text-rose-600 dark:text-rose-400',
      count: 'text-rose-700 dark:text-rose-300',
      label: 'text-rose-600/80 dark:text-rose-500',
      dot:   'bg-rose-500',
    },
  }[color]

  return (
    <div className={`inline-flex items-center gap-3 pl-2 pr-5 py-2 rounded-2xl border backdrop-blur-sm ${cfg.wrap}
      shadow-[0_1px_4px_rgba(0,0,0,0.04)] dark:shadow-none
      transition-all duration-200 hover:scale-[1.02]`}>
      <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${cfg.icon}`}>
        {icon}
      </div>
      <div>
        <div className={`text-2xl font-bold leading-none mb-0.5 ${cfg.count}`}>
          <AnimatedNumber value={count} />
        </div>
        <div className={`text-[10px] font-bold uppercase tracking-[0.12em] ${cfg.label}`}>
          {label}
        </div>
      </div>
    </div>
  )
}

// ── Empty State ───────────────────────────────────────────────────────────────
function EmptyState({ onReset }: { onReset: () => void }) {
  return (
    <div className="py-24 flex flex-col items-center">
      <div className="relative max-w-sm w-full">
        {/* Glow behind card */}
        <div className="absolute inset-0 rounded-3xl bg-amber-500/10 dark:bg-amber-500/[0.06] blur-[40px]" />

        <div className="relative rounded-2xl overflow-hidden
          bg-white/80 dark:bg-white/[0.03]
          border border-zinc-200/60 dark:border-white/[0.06]
          shadow-[0_2px_20px_rgba(0,0,0,0.08)] dark:shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_8px_40px_rgba(0,0,0,0.5)]
          backdrop-blur-xl">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-500/40 to-transparent" />

          <div className="px-8 py-12 text-center space-y-6">
            <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl
              bg-gradient-to-br from-amber-500 to-orange-600
              shadow-[0_0_0_1px_rgba(245,158,11,0.4),0_4px_20px_rgba(245,158,11,0.3),inset_0_1px_0_rgba(255,255,255,0.2)]`}>
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-semibold text-zinc-900 dark:text-[#EDEDEF] tracking-tight">
                No Problems Found
              </h3>
              <p className="text-sm text-zinc-600 dark:text-[#8A8F98] leading-relaxed">
                No challenges match your current filters. Try adjusting your search criteria.
              </p>
            </div>

            <button
              onClick={onReset}
              className="w-full px-5 py-2.5 rounded-xl text-sm font-medium
                bg-zinc-900 dark:bg-white/[0.06]
                text-white dark:text-[#EDEDEF]
                border border-transparent dark:border-white/[0.08]
                hover:bg-zinc-800 dark:hover:bg-white/[0.10]
                shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]
                active:scale-[0.98]
                transition-all duration-200"
            >
              Reset All Filters
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}