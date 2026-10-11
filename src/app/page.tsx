'use client'

import { Code, Trophy, Users, ArrowRight, Zap, Target, Brain, BookOpen, Sparkles, Award, CheckCircle } from 'lucide-react'
import Navbar from './_components/layout/Navbar'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import dynamic from 'next/dynamic'
import { useTheme } from 'next-themes'
import { motion, useMotionValue, useSpring, useTransform } from 'motion/react'
import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

// Lazy-load heavy canvas animation — keeps initial JS parse lean
const DotGrid = dynamic(() => import('./_components/DotGrid'), { ssr: false })

// ─── SpotlightCards Types & Constants ──────────────────────────────────────────

const TILT_MAX = 9
const TILT_SPRING = { stiffness: 300, damping: 28 } as const
const GLOW_SPRING = { stiffness: 180, damping: 22 } as const

export interface SpotlightItem {
  icon: LucideIcon
  title: string
  description: string
  color: string
}

// ─── Feature Data mapped to SpotlightItem format ───────────────────────────────

const PRIMARY_FEATURES: SpotlightItem[] = [
  {
    icon: Brain,
    title: 'AI Coding Tutor',
    description:
      'Get personalized guidance from Groq\'s ultra-fast Llama 3 AI. Receive problem analysis, algorithm design strategies, code review, and optimization tips — all without spoiling the solution.',
    color: '#0ea5e9',
  },
  {
    icon: Code,
    title: 'Monaco Code Editor',
    description:
      'Code in the same professional editor that powers VS Code. Syntax highlighting for 8+ languages, IntelliSense, multiple themes, keyboard shortcuts, and auto-formatting.',
    color: '#6366f1',
  },
]

const SECONDARY_FEATURES: SpotlightItem[] = [
  {
    icon: Sparkles,
    title: 'Premium Problems',
    description:
      'Access exclusive challenges with detailed explanations, visual diagrams, multiple solution approaches, and company-specific insights.',
    color: '#f59e0b',
  },
  {
    icon: Target,
    title: 'Smart Filtering',
    description:
      'Filter by difficulty, companies (Google, Amazon, Microsoft), topics, and solved status. Find exactly what you need to practice.',
    color: '#10b981',
  },
  {
    icon: Trophy,
    title: 'Progress Tracking',
    description:
      'Monitor your improvement with visual indicators, solved problem counts, and difficulty-based completion rates across all topics.',
    color: '#f472b6',
  },
]

const EXTRA_FEATURES: SpotlightItem[] = [
  {
    icon: BookOpen,
    title: 'Similar Questions',
    description:
      'AI-powered recommendations help you discover related problems and master patterns efficiently.',
    color: '#34d399',
  },
  {
    icon: Users,
    title: 'Multi-Language',
    description:
      'Code in Python, JavaScript, Java, C++, Go, Rust, TypeScript, and more with full syntax highlighting.',
    color: '#a78bfa',
  },
  {
    icon: CheckCircle,
    title: 'Real-Time Solutions',
    description:
      'Get instant feedback on your code with time and space complexity analysis from the AI tutor.',
    color: '#38bdf8',
  },
  {
    icon: Award,
    title: 'Company Focus',
    description:
      'Practice problems asked by Google, Meta, Amazon, Microsoft, Apple, and 50+ top tech companies.',
    color: '#fb923c',
  },
]

// ─── SpotlightCard Component ───────────────────────────────────────────────────

interface CardProps {
  item: SpotlightItem
  dimmed: boolean
  onHoverStart: () => void
  onHoverEnd: () => void
}

function SpotlightCard({ item, dimmed, onHoverStart, onHoverEnd }: CardProps) {
  const Icon = item.icon
  const cardRef = useRef<HTMLDivElement>(null)

  const normX = useMotionValue(0.5)
  const normY = useMotionValue(0.5)

  const rawRotateX = useTransform(normY, [0, 1], [TILT_MAX, -TILT_MAX])
  const rawRotateY = useTransform(normX, [0, 1], [-TILT_MAX, TILT_MAX])

  const rotateX = useSpring(rawRotateX, TILT_SPRING)
  const rotateY = useSpring(rawRotateY, TILT_SPRING)
  const glowOpacity = useSpring(0, GLOW_SPRING)

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = cardRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    normX.set((e.clientX - rect.left) / rect.width)
    normY.set((e.clientY - rect.top) / rect.height)
  }

  const handleMouseEnter = () => {
    glowOpacity.set(1)
    onHoverStart()
  }

  const handleMouseLeave = () => {
    normX.set(0.5)
    normY.set(0.5)
    glowOpacity.set(0)
    onHoverEnd()
  }

  return (
    <motion.div
      animate={{
        scale: dimmed ? 0.96 : 1,
        opacity: dimmed ? 0.5 : 1,
      }}
      className={cn(
        'group relative flex flex-col gap-5 overflow-hidden rounded-2xl border p-6 h-full',
        'border-zinc-200 bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04)]',
        'dark:border-white/6 dark:bg-white/3 dark:shadow-none',
        'transition-[border-color] duration-300',
        'hover:border-zinc-300 dark:hover:border-white/14'
      )}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseMove={handleMouseMove}
      ref={cardRef}
      style={{
        rotateX,
        rotateY,
        transformPerspective: 900,
      }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
    >
      {/* Static accent tint */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-2xl"
        style={{
          background: `radial-gradient(ellipse at 20% 20%, ${item.color}14, transparent 65%)`,
        }}
      />

      {/* Hover glow layer */}
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-2xl"
        style={{
          opacity: glowOpacity,
          background: `radial-gradient(ellipse at 20% 20%, ${item.color}2e, transparent 65%)`,
        }}
      />

      {/* Shimmer sweep */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-0 w-[55%] -translate-x-full -skew-x-12 bg-gradient-to-r from-transparent via-white/[0.045] to-transparent transition-transform duration-700 ease-out group-hover:translate-x-[280%]"
      />

      {/* Icon badge */}
      <div
        className="relative z-10 flex h-10 w-10 items-center justify-center rounded-xl flex-shrink-0"
        style={{
          background: `${item.color}18`,
          boxShadow: `inset 0 0 0 1px ${item.color}30`,
        }}
      >
        <Icon size={17} strokeWidth={1.9} style={{ color: item.color }} />
      </div>

      {/* Text */}
      <div className="relative z-10 flex flex-col gap-2 flex-grow">
        <h3 className="font-semibold text-[14px] text-zinc-900 tracking-tight dark:text-white">
          {item.title}
        </h3>
        <p className="text-[12.5px] text-zinc-500 leading-relaxed dark:text-white/40">
          {item.description}
        </p>
      </div>

      {/* Accent bottom line */}
      <div
        aria-hidden="true"
        className="absolute bottom-0 left-0 h-[2px] w-0 rounded-full transition-all duration-500 group-hover:w-full"
        style={{
          background: `linear-gradient(to right, ${item.color}80, transparent)`,
        }}
      />
    </motion.div>
  )
}

// ─── SpotlightGrid wrapper ─────────────────────────────────────────────────────

function SpotlightGrid({
  items,
  columns = 3,
}: {
  items: SpotlightItem[]
  columns?: 2 | 3 | 4
}) {
  const [hoveredTitle, setHoveredTitle] = useState<string | null>(null)

  const colClass = {
    2: 'sm:grid-cols-2',
    3: 'sm:grid-cols-3',
    4: 'sm:grid-cols-2 lg:grid-cols-4',
  }[columns]

  return (
    <div className={`grid grid-cols-1 gap-3 ${colClass}`}>
      {items.map((item) => (
        <SpotlightCard
          dimmed={hoveredTitle !== null && hoveredTitle !== item.title}
          item={item}
          key={item.title}
          onHoverEnd={() => setHoveredTitle(null)}
          onHoverStart={() => setHoveredTitle(item.title)}
        />
      ))}
    </div>
  )
}

export default function Home() {
  const { isSignedIn, user, isLoaded } = useUser()
  const router = useRouter()
  const [isProcessingClick, setIsProcessingClick] = useState(false)
  const { theme } = useTheme()

  useEffect(() => {
    router.prefetch('/leetcode')
  }, [router])

  const userData = useMemo(() => {
    if (!user) return null
    return {
      email: user.emailAddresses[0]?.emailAddress,
      id: user.id,
      name: user.fullName || user.username || 'Unknown User',
    }
  }, [user])

  const handleStartPracticingClick = useCallback(async () => {
    if (!isLoaded || isProcessingClick || !userData) {
      router.push('/sign-in')
      return
    }

    setIsProcessingClick(true)

    try {
      if (isSignedIn && user) {
        const { email, id: clerkUserId, name } = userData

        if (!email || !clerkUserId) {
          console.error('Clerk user email or ID not found.')
          return
        }

        const newUuid = crypto.randomUUID()
        const { error: upsertError } = await supabase
          .from('lc_users')
          .upsert(
            {
              id: newUuid,
              clerk_user_id: clerkUserId,
              email,
              name,
              is_premium: false,
            },
            { onConflict: 'clerk_user_id' }
          )

        if (upsertError) {
          console.error('Error upserting user:', upsertError)
        }

        router.push('/leetcode')
      }
    } catch (error) {
      console.error('Unexpected error:', error)
    } finally {
      setIsProcessingClick(false)
    }
  }, [isLoaded, isProcessingClick, userData, isSignedIn, user, router])

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 transition-colors duration-500">
      <Navbar />

      {/* ── Hero Section ──────────────────────────────────────────────────────── */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <DotGrid
            dotSize={10}
            gap={15}
            baseColor={theme === 'dark' ? '#0f172a' : '#cbd5e1'}
            activeColor="#0ea5e9"
            proximity={120}
            shockRadius={250}
            shockStrength={5}
            resistance={750}
            returnDuration={1.5}
          />
        </div>

        <div className="absolute inset-0 z-[1] bg-gradient-to-b from-zinc-50/80 via-zinc-50/50 to-zinc-50/80 dark:from-zinc-950/80 dark:via-zinc-950/50 dark:to-zinc-950/80" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-sky-500/20 dark:bg-sky-400/10 rounded-full blur-[128px]" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-500/20 dark:bg-indigo-400/10 rounded-full blur-[128px]" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-900/5 dark:bg-white/5 border border-zinc-900/10 dark:border-white/10 backdrop-blur-xl"
            >
              <Brain className="w-4 h-4 text-sky-600 dark:text-sky-400" />
              <span className="text-sm font-semibold tracking-wide text-zinc-700 dark:text-zinc-300">
                AI-Powered Coding Interview Companion
              </span>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: 'easeOut', delay: 0.1 }}
              className="space-y-4"
            >
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight">
                <span className="block text-zinc-900 dark:text-white mb-2">
                  Master Coding Interviews
                </span>
                <span className="block bg-gradient-to-r from-sky-600 via-indigo-600 to-violet-600 dark:from-sky-400 dark:via-indigo-400 dark:to-violet-400 bg-clip-text text-transparent pb-2">
                  With Your AI Tutor
                </span>
              </h1>

              <p className="text-xl sm:text-2xl text-zinc-600 dark:text-zinc-400 max-w-3xl mx-auto leading-relaxed font-light">
                Practice 1800+ curated problems with ultra-fast Groq AI guidance.
                <span className="block mt-2">
                  Code in Monaco Editor. Track your progress. Land your dream job.
                </span>
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: 'easeOut', delay: 0.2 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8"
            >
              <button
                onClick={handleStartPracticingClick}
                disabled={isProcessingClick || !isLoaded}
                className="group relative inline-flex items-center gap-3 px-8 py-4 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-semibold rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 shadow-xl shadow-zinc-900/20 dark:shadow-white/20 hover:shadow-2xl hover:shadow-zinc-900/30 dark:hover:shadow-white/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                aria-label={isProcessingClick ? 'Processing...' : 'Start practicing'}
              >
                {isProcessingClick ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 dark:border-zinc-900/30 border-t-white dark:border-t-zinc-900 rounded-full animate-spin" />
                    <span>Loading...</span>
                  </>
                ) : (
                  <>
                    <span>Start Free Practice</span>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                  </>
                )}
              </button>

              <button
                onClick={() => router.push('/leetcode/premium')}
                className="inline-flex items-center gap-2 px-8 py-4 bg-transparent border-2 border-zinc-900/10 dark:border-white/10 text-zinc-700 dark:text-zinc-300 font-semibold rounded-2xl hover:bg-zinc-900/5 dark:hover:bg-white/5 hover:border-zinc-900/20 dark:hover:border-white/20 transition-all duration-300 backdrop-blur-sm group"
              >
                <Sparkles className="w-5 h-5 text-amber-500 group-hover:scale-110 transition-transform" />
                View Premium Problems
              </button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: 'easeOut', delay: 0.3 }}
              className="flex items-center justify-center gap-8 pt-12 text-sm text-zinc-600 dark:text-zinc-400 flex-wrap"
            >
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                <span className="font-medium">1800+ Curated Problems</span>
              </div>
              <div className="w-px h-4 bg-zinc-300 dark:bg-zinc-700 hidden sm:block" />
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-sky-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(14,165,233,0.5)]" />
                <span className="font-medium">AI-Powered Tutoring</span>
              </div>
              <div className="w-px h-4 bg-zinc-300 dark:bg-zinc-700 hidden sm:block" />
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-violet-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(139,92,246,0.5)]" />
                <span className="font-medium">Monaco Code Editor</span>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Features Section ───────────────────────────────────────────────────── */}
      <section
        className="relative py-32 bg-white dark:bg-zinc-900"
        aria-labelledby="features-heading"
      >
        {/* Dot grid texture */}
        <div
          className="absolute inset-0 opacity-[0.015] dark:opacity-[0.03]"
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, rgb(0 0 0) 1px, transparent 0)',
            backgroundSize: '40px 40px',
          }}
        />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section header */}
          <div className="max-w-3xl mb-16">
            <div className="inline-block mb-4">
              <span className="text-sm font-semibold tracking-wide uppercase text-sky-600 dark:text-sky-400">
                Everything You Need
              </span>
            </div>
            <h2
              id="features-heading"
              className="text-4xl sm:text-5xl font-bold text-zinc-900 dark:text-white mb-6 leading-tight"
            >
              Built for serious interview preparation
            </h2>
            <p className="text-xl text-zinc-600 dark:text-zinc-400 leading-relaxed">
              From AI-powered guidance to professional code editing, we've built every feature
              to help you succeed in technical interviews at top tech companies.
            </p>
          </div>

          {/* Primary features — 2 columns */}
          <div className="mb-3">
            <SpotlightGrid items={PRIMARY_FEATURES} columns={2} />
          </div>

          {/* Secondary features — 3 columns */}
          <div className="mb-3">
            <SpotlightGrid items={SECONDARY_FEATURES} columns={3} />
          </div>

          {/* Extra features — 4 columns */}
          <SpotlightGrid items={EXTRA_FEATURES} columns={4} />
        </div>
      </section>

      {/* ── How It Works Section ───────────────────────────────────────────────── */}
      <section className="relative py-32 bg-zinc-50 dark:bg-zinc-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <div className="inline-block mb-4">
              <span className="text-sm font-semibold tracking-wide uppercase text-sky-600 dark:text-sky-400">
                Simple Process
              </span>
            </div>
            <h2 className="text-4xl sm:text-5xl font-bold text-zinc-900 dark:text-white mb-6 leading-tight">
              How LeetCode Interview Buddy Works
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            >
              <StepCard
                number="01"
                title="Browse & Filter"
                description="Explore 1800+ curated problems. Filter by difficulty, company, topic, or solved status to find the perfect challenge."
                icon={<Target className="w-8 h-8" />}
              />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.5, ease: 'easeOut', delay: 0.15 }}
            >
              <StepCard
                number="02"
                title="Code & Learn"
                description="Write code in the Monaco editor while getting personalized AI guidance. Ask questions, get hints, and learn best practices."
                icon={<Code className="w-8 h-8" />}
              />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.5, ease: 'easeOut', delay: 0.3 }}
            >
              <StepCard
                number="03"
                title="Track Progress"
                description="Monitor your growth with visual indicators and statistics. Build confidence as you solve more problems across different topics."
                icon={<Trophy className="w-8 h-8" />}
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Stats Section ──────────────────────────────────────────────────────── */}
      <section className="relative py-20 bg-zinc-50 dark:bg-zinc-950 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-sky-500/5 via-transparent to-indigo-500/5 dark:from-sky-500/10 dark:via-transparent dark:to-indigo-500/10" />
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-sky-500/5 rounded-full blur-[128px] animate-pulse" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.4, delay: 0.0 }}>
              <StatCard number="1800+" label="Curated Problems" />
            </motion.div>
            <motion.div initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.4, delay: 0.1 }}>
              <StatCard number="100+" label="Top Companies" />
            </motion.div>
            <motion.div initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.4, delay: 0.2 }}>
              <StatCard number="8+" label="Programming Languages" />
            </motion.div>
            <motion.div initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.4, delay: 0.3 }}>
              <StatCard number="24/7" label="AI Tutor Available" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── CTA Section ────────────────────────────────────────────────────────── */}
      <section className="relative py-32 bg-white dark:bg-zinc-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-900/5 dark:bg-white/5 border border-zinc-900/10 dark:border-white/10 backdrop-blur-xl">
              <Zap className="w-4 h-4 text-sky-600 dark:text-sky-400" />
              <span className="text-sm font-semibold tracking-wide text-zinc-700 dark:text-zinc-300">
                Ready to Get Started?
              </span>
            </div>

            <h2 className="text-4xl sm:text-5xl font-bold text-zinc-900 dark:text-white leading-tight">
              Start practicing today and ace your next interview
            </h2>

            <p className="text-xl text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto">
              Join thousands of developers who are mastering coding interviews with AI-powered guidance.
            </p>

            <button
              onClick={handleStartPracticingClick}
              disabled={isProcessingClick || !isLoaded}
              className="group relative inline-flex items-center gap-3 px-8 py-4 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-semibold rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 shadow-xl shadow-zinc-900/20 dark:shadow-white/20 hover:shadow-2xl hover:shadow-zinc-900/30 dark:hover:shadow-white/30 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessingClick ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 dark:border-zinc-900/30 border-t-white dark:border-t-zinc-900 rounded-full animate-spin" />
                  <span>Loading...</span>
                </>
              ) : (
                <>
                  <span>Get Started Free</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                </>
              )}
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}

// ─── StepCard ─────────────────────────────────────────────────────────────────

function StepCard({
  number,
  title,
  description,
  icon,
}: {
  number: string
  title: string
  description: string
  icon: React.ReactNode
}) {
  return (
    <div className="relative group">
      <div className="absolute -inset-0.5 bg-gradient-to-r from-sky-500 to-indigo-500 rounded-3xl opacity-0 group-hover:opacity-20 blur transition-all duration-500" />
      <div className="relative p-8 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 h-full">
        <div className="flex items-start gap-4 mb-6">
          <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-gradient-to-br from-zinc-900 to-zinc-800 dark:from-white dark:to-zinc-100 text-white dark:text-zinc-900 flex items-center justify-center shadow-lg">
            {icon}
          </div>
          <div className="text-6xl font-bold text-zinc-200 dark:text-zinc-800 leading-none">
            {number}
          </div>
        </div>
        <h3 className="text-2xl font-bold text-zinc-900 dark:text-white mb-3">{title}</h3>
        <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">{description}</p>
      </div>
    </div>
  )
}

// ─── StatCard ─────────────────────────────────────────────────────────────────

function StatCard({ number, label }: { number: string; label: string }) {
  return (
    <div className="text-center p-8 rounded-2xl bg-white dark:bg-white/5 backdrop-blur-sm border border-zinc-200 dark:border-white/10 shadow-sm hover:shadow-md dark:shadow-none hover:bg-zinc-50 dark:hover:bg-white/10 transition-all duration-300">
      <div className="text-5xl font-bold bg-gradient-to-r from-sky-500 via-indigo-500 to-violet-500 dark:from-sky-400 dark:via-indigo-400 dark:to-violet-400 bg-clip-text text-transparent mb-2">
        {number}
      </div>
      <div className="text-sm font-semibold tracking-wide uppercase text-zinc-500 dark:text-zinc-400">{label}</div>
    </div>
  )
}