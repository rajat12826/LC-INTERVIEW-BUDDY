'use client'

import { Code, Trophy, Users, ArrowRight, Zap, Target, Brain, BookOpen, Sparkles, Award, Clock, CheckCircle } from 'lucide-react'
import Navbar from './_components/layout/Navbar'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { useState, useCallback, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import dynamic from 'next/dynamic'
import DotGrid from './_components/DotGrid'
import { useTheme } from 'next-themes'

// Dynamically import heavy components
const DynamicFeatureCard = dynamic(() => Promise.resolve(FeatureCard), {
  loading: () => 
  <div className="h-64 bg-zinc-100/50 dark:bg-zinc-800/50 animate-pulse rounded-2xl backdrop-blur-sm" />
})

export default function Home() {
  const { isSignedIn, user, isLoaded } = useUser()
  const router = useRouter()
  const [isProcessingClick, setIsProcessingClick] = useState(false)
  const { theme } = useTheme()

  const userData = useMemo(() => {
    if (!user) return null
    return {
      email: user.emailAddresses[0]?.emailAddress,
      id: user.id,
      name: user.fullName || user.username || 'Unknown User'
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
          console.error("Clerk user email or ID not found.")
          return
        }

        const { data: existingUser, error: fetchError } = await supabase
          .from('lc_users')
          .select('is_premium')
          .eq('clerk_user_id', clerkUserId)
          .single()

        if (fetchError && fetchError.code !== 'PGRST116') {
          console.error("Error fetching user:", fetchError)
          return
        }

        if (existingUser) {
          router.push('/leetcode')
        } else {
          const newUuid = crypto.randomUUID()
          const { error: insertError } = await supabase
            .from('lc_users')
            .insert({
              id: newUuid,
              clerk_user_id: clerkUserId,
              email,
              name,
              is_premium: false
            })

          if (insertError) {
            console.error("Error inserting user:", insertError)
            return
          }

          router.push('/leetcode')
        }
      }
    } catch (error) {
      console.error("Unexpected error:", error)
    } finally {
      setIsProcessingClick(false)
    }
  }, [isLoaded, isProcessingClick, userData, isSignedIn, user, router])

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 transition-colors duration-500">
      <Navbar />

      {/* Hero Section with DotGrid */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
        {/* DotGrid Background */}
        <div className="absolute inset-0 z-0">
          <DotGrid
            dotSize={10}
            gap={15}
            baseColor={theme === "dark" ? "#0f172a" : "#cbd5e1"}
            activeColor="#0ea5e9"
            proximity={120}
            shockRadius={250}
            shockStrength={5}
            resistance={750}
            returnDuration={1.5}
          />
        </div>

        {/* Atmospheric gradient overlays */}
        <div className="absolute inset-0 z-[1] bg-gradient-to-b from-zinc-50/80 via-zinc-50/50 to-zinc-50/80 dark:from-zinc-950/80 dark:via-zinc-950/50 dark:to-zinc-950/80" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-sky-500/20 dark:bg-sky-400/10 rounded-full blur-[128px]" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-500/20 dark:bg-indigo-400/10 rounded-full blur-[128px]" />

        {/* Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center space-y-8">
            {/* Eyebrow text */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-900/5 dark:bg-white/5 border border-zinc-900/10 dark:border-white/10 backdrop-blur-xl">
              <Brain className="w-4 h-4 text-sky-600 dark:text-sky-400" />
              <span className="text-sm font-semibold tracking-wide text-zinc-700 dark:text-zinc-300">
                AI-Powered Coding Interview Companion
              </span>
            </div>

            {/* Main heading */}
            <div className="space-y-4">
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight">
                <span className="block text-zinc-900 dark:text-white mb-2">
                  Master Coding Interviews
                </span>
                <span className="block bg-gradient-to-r from-sky-600 via-indigo-600 to-violet-600 dark:from-sky-400 dark:via-indigo-400 dark:to-violet-400 bg-clip-text text-transparent">
                  With Your AI Tutor
                </span>
              </h1>
              
              <p className="text-xl sm:text-2xl text-zinc-600 dark:text-zinc-400 max-w-3xl mx-auto leading-relaxed font-light">
                Practice 1000+ curated problems with Google Gemini AI guidance.
                <span className="block mt-2">Code in Monaco Editor. Track your progress. Land your dream job.</span>
              </p>
            </div>

            {/* CTA Section */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
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
                className="inline-flex items-center gap-2 px-8 py-4 bg-transparent border-2 border-zinc-900/10 dark:border-white/10 text-zinc-700 dark:text-zinc-300 font-semibold rounded-2xl hover:bg-zinc-900/5 dark:hover:bg-white/5 hover:border-zinc-900/20 dark:hover:border-white/20 transition-all duration-300 backdrop-blur-sm"
              >
                <Sparkles className="w-5 h-5" />
                View Premium Problems
              </button>
            </div>

            {/* Trust indicators */}
            <div className="flex items-center justify-center gap-8 pt-12 text-sm text-zinc-600 dark:text-zinc-400 flex-wrap">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                <span className="font-medium">1000+ Curated Problems</span>
              </div>
              <div className="w-px h-4 bg-zinc-300 dark:bg-zinc-700 hidden sm:block" />
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-sky-500 rounded-full animate-pulse" />
                <span className="font-medium">AI-Powered Tutoring</span>
              </div>
              <div className="w-px h-4 bg-zinc-300 dark:bg-zinc-700 hidden sm:block" />
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-violet-500 rounded-full animate-pulse" />
                <span className="font-medium">Monaco Code Editor</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative py-32 bg-white dark:bg-zinc-900" aria-labelledby="features-heading">
        {/* Subtle background texture */}
        <div className="absolute inset-0 opacity-[0.015] dark:opacity-[0.03]" 
             style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgb(0 0 0) 1px, transparent 0)', backgroundSize: '40px 40px' }} 
        />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section header */}
          <div className="max-w-3xl mb-20">
            <div className="inline-block mb-4">
              <span className="text-sm font-semibold tracking-wide uppercase text-sky-600 dark:text-sky-400">
                Everything You Need
              </span>
            </div>
            <h2 id="features-heading" className="text-4xl sm:text-5xl font-bold text-zinc-900 dark:text-white mb-6 leading-tight">
              Built for serious interview preparation
            </h2>
            <p className="text-xl text-zinc-600 dark:text-zinc-400 leading-relaxed">
              From AI-powered guidance to professional code editing, we've built every feature 
              to help you succeed in technical interviews at top tech companies.
            </p>
          </div>

          {/* Features grid */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Top row - Two equal cards */}
            <DynamicFeatureCard
              icon={<Brain className="w-10 h-10" />}
              title="AI Coding Tutor"
              description="Get personalized guidance from Google's Gemini AI. Receive problem analysis, algorithm design strategies, code review with constructive feedback, and optimization tips - all without spoiling the solution. Learn to think like a pro."
              variant="primary"
            />
            
            <DynamicFeatureCard
              icon={<Code className="w-10 h-10" />}
              title="Monaco Code Editor"
              description="Code in the same professional editor that powers VS Code. Enjoy syntax highlighting for 8+ languages, IntelliSense auto-completion, multiple themes, keyboard shortcuts, and auto-formatting. Horizontal or vertical split layouts."
              variant="primary"
            />

            {/* Bottom row - Three equal cards */}
            <div className="lg:col-span-2 grid md:grid-cols-3 gap-6">
              <DynamicFeatureCard
                icon={<Sparkles className="w-8 h-8" />}
                title="Premium Problems"
                description="Access exclusive challenges with detailed explanations, visual diagrams, multiple solution approaches, and company-specific insights."
                variant="secondary"
              />
              
              <DynamicFeatureCard
                icon={<Target className="w-8 h-8" />}
                title="Smart Filtering"
                description="Filter by difficulty, companies (Google, Amazon, Microsoft), topics, and solved status. Find exactly what you need to practice."
                variant="secondary"
              />
              
              <DynamicFeatureCard
                icon={<Trophy className="w-8 h-8" />}
                title="Progress Tracking"
                description="Monitor your improvement with visual indicators, solved problem counts, and difficulty-based completion rates across all topics."
                variant="secondary"
              />
            </div>
          </div>

          {/* Additional Features Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
            <DynamicFeatureCard
              icon={<BookOpen className="w-8 h-8" />}
              title="Similar Questions"
              description="AI-powered recommendations help you discover related problems and master patterns efficiently."
              variant="secondary"
            />

            <DynamicFeatureCard
              icon={<Users className="w-8 h-8" />}
              title="Multi-Language Support"
              description="Code in Python, JavaScript, Java, C++, Go, Rust, TypeScript, and more with full syntax highlighting."
              variant="secondary"
            />

            <DynamicFeatureCard
              icon={<CheckCircle className="w-8 h-8" />}
              title="Real-Time Solutions"
              description="Get instant feedback on your code with time and space complexity analysis from the AI tutor."
              variant="secondary"
            />

            <DynamicFeatureCard
              icon={<Award className="w-8 h-8" />}
              title="Company Focus"
              description="Practice problems asked by Google, Meta, Amazon, Microsoft, Apple, and 50+ top tech companies."
              variant="secondary"
            />
          </div>
        </div>
      </section>

      {/* How It Works Section */}
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
            <StepCard
              number="01"
              title="Browse & Filter"
              description="Explore 1000+ curated problems. Filter by difficulty, company, topic, or solved status to find the perfect challenge."
              icon={<Target className="w-8 h-8" />}
            />

            <StepCard
              number="02"
              title="Code & Learn"
              description="Write code in the Monaco editor while getting personalized AI guidance. Ask questions, get hints, and learn best practices."
              icon={<Code className="w-8 h-8" />}
            />

            <StepCard
              number="03"
              title="Track Progress"
              description="Monitor your growth with visual indicators and statistics. Build confidence as you solve more problems across different topics."
              icon={<Trophy className="w-8 h-8" />}
            />
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative py-20 bg-zinc-900 dark:bg-zinc-950 overflow-hidden">
        {/* Animated gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-sky-500/10 via-transparent to-indigo-500/10" />
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-sky-500/5 rounded-full blur-[128px] animate-pulse" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <StatCard number="1000+" label="Curated Problems" />
            <StatCard number="50+" label="Top Companies" />
            <StatCard number="8+" label="Programming Languages" />
            <StatCard number="24/7" label="AI Tutor Available" />
          </div>
        </div>
      </section>

      {/* CTA Section */}
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

// Enhanced Feature Card Component
function FeatureCard({ 
  icon, 
  title, 
  description,
  variant = 'primary'
}: { 
  icon: React.ReactNode
  title: string
  description: string
  variant?: 'primary' | 'secondary'
}) {
  const isPrimary = variant === 'primary'
  
  return (
    <div className={`group relative h-full rounded-3xl overflow-hidden transition-all duration-500 hover:scale-[1.02] ${
      isPrimary ? 'p-8 lg:p-10' : 'p-6 lg:p-8'
    }`}>
      {/* Card background with gradient border effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-zinc-100 to-white dark:from-zinc-800 dark:to-zinc-900 rounded-3xl" />
      <div className="absolute inset-[1px] bg-white dark:bg-zinc-900 rounded-3xl" />
      
      {/* Hover gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-sky-500/0 via-indigo-500/0 to-violet-500/0 group-hover:from-sky-500/5 group-hover:via-indigo-500/5 group-hover:to-violet-500/5 transition-all duration-500 rounded-3xl" />

      {/* Content */}
      <div className="relative h-full flex flex-col">
        {/* Icon */}
        <div className={`flex items-center justify-center rounded-2xl bg-gradient-to-br from-zinc-900 to-zinc-800 dark:from-white dark:to-zinc-100 text-white dark:text-zinc-900 shadow-xl group-hover:shadow-2xl transition-shadow duration-500 ${
          isPrimary ? 'w-16 h-16 mb-6' : 'w-14 h-14 mb-5'
        }`}>
          {icon}
        </div>

        {/* Text */}
        <h3 className={`font-bold text-zinc-900 dark:text-white mb-3 leading-tight ${
          isPrimary ? 'text-2xl' : 'text-xl'
        }`}>
          {title}
        </h3>
        <p className={`text-zinc-600 dark:text-zinc-400 leading-relaxed flex-grow ${
          isPrimary ? 'text-base' : 'text-sm'
        }`}>
          {description}
        </p>

        {/* Decorative line */}
        <div className="mt-6 pt-6 border-t border-zinc-100 dark:border-zinc-800">
          <div className="w-12 h-px bg-gradient-to-r from-zinc-900/20 to-transparent dark:from-white/20 group-hover:w-24 transition-all duration-500" />
        </div>
      </div>
    </div>
  )
}

// Step Card Component
function StepCard({ 
  number, 
  title, 
  description, 
  icon 
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
        <h3 className="text-2xl font-bold text-zinc-900 dark:text-white mb-3">
          {title}
        </h3>
        <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
          {description}
        </p>
      </div>
    </div>
  )
}

// Stat Card Component
function StatCard({ number, label }: { number: string; label: string }) {
  return (
    <div className="text-center p-8 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-all duration-300">
      <div className="text-5xl font-bold bg-gradient-to-r from-sky-400 via-indigo-400 to-violet-400 bg-clip-text text-transparent mb-2">
        {number}
      </div>
      <div className="text-sm font-semibold tracking-wide uppercase text-zinc-400">
        {label}
      </div>
    </div>
  )
}