'use client'

import { Code, Trophy, Users, ArrowRight, Zap, Target, TrendingUp } from 'lucide-react'
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
const {theme}=useTheme()
// console.log(themes);

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
          router.push(existingUser.is_premium ? '/leetcode' : '/subscription')
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

          router.push('/subscription')
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

      {/* Hero Section with DotGrid - Sophisticated & Clean */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
        {/* DotGrid Background - Interactive elegance */}
        <div className="absolute inset-0 z-0">
          <DotGrid
            dotSize={10}
            gap={15}
            baseColor={theme=="dark"?"#0f172a":"#cbd5e1"}
            activeColor="#0ea5e9"
            proximity={120}
            shockRadius={250}
            shockStrength={5}
            resistance={750}
            returnDuration={1.5}
          />
           {/* <DotGrid
            dotSize={10}
            gap={15}
            baseColor="#0f172a"
            activeColor="#0ea5e9"
            proximity={120}
            shockRadius={250}
            shockStrength={5}
            resistance={750}
            returnDuration={1.5}
          /> */}
        </div>

        {/* Atmospheric gradient overlays */}
        <div className="absolute inset-0 z-[1] bg-gradient-to-b from-zinc-50/80 via-zinc-50/50 to-zinc-50/80 dark:from-zinc-950/80 dark:via-zinc-950/50 dark:to-zinc-950/80" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-sky-500/20 dark:bg-sky-400/10 rounded-full blur-[128px]" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-500/20 dark:bg-indigo-400/10 rounded-full blur-[128px]" />

        {/* Content - Elevated above background */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center space-y-8">
            {/* Eyebrow text */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-900/5 dark:bg-white/5 border border-zinc-900/10 dark:border-white/10 backdrop-blur-xl">
              <Zap className="w-4 h-4 text-sky-600 dark:text-sky-400" />
              <span className="text-sm font-semibold tracking-wide text-zinc-700 dark:text-zinc-300">
                Master Technical Interviews
              </span>
            </div>

            {/* Main heading - Bold typography */}
            <div className="space-y-4">
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight">
                <span className="block text-zinc-900 dark:text-white mb-2">
                  Sharpen Your
                </span>
                <span className="block bg-gradient-to-r from-sky-600 via-indigo-600 to-violet-600 dark:from-sky-400 dark:via-indigo-400 dark:to-violet-400 bg-clip-text text-transparent">
                  Problem-Solving Edge
                </span>
              </h1>
              
              <p className="text-xl sm:text-2xl text-zinc-600 dark:text-zinc-400 max-w-3xl mx-auto leading-relaxed font-light">
                Practice curated coding challenges from top tech companies. 
                <span className="block mt-2">Build confidence. Land your dream role.</span>
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
                    <span>Start Practicing</span>
                    <ArrowRight className="w-5 h-5 group-hover:tranzinc-x-1 transition-transform duration-300" />
                  </>
                )}
              </button>

              <button
                onClick={() => router.push('/about')}
                className="inline-flex items-center gap-2 px-8 py-4 bg-transparent border-2 border-zinc-900/10 dark:border-white/10 text-zinc-700 dark:text-zinc-300 font-semibold rounded-2xl hover:bg-zinc-900/5 dark:hover:bg-white/5 hover:border-zinc-900/20 dark:hover:border-white/20 transition-all duration-300 backdrop-blur-sm"
              >
                Learn More
              </button>
            </div>

            {/* Trust indicators */}
            <div className="flex items-center justify-center gap-8 pt-12 text-sm text-zinc-600 dark:text-zinc-400">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                <span className="font-medium">1800+ Problems</span>
              </div>
              <div className="w-px h-4 bg-zinc-300 dark:bg-zinc-700" />
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-sky-500 rounded-full animate-pulse" />
                <span className="font-medium">FAANG Questions</span>
              </div>
              <div className="w-px h-4 bg-zinc-300 dark:bg-zinc-700" />
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-violet-500 rounded-full animate-pulse" />
                <span className="font-medium">Real Interview Prep</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section - Editorial layout */}
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
                Why Choose Us
              </span>
            </div>
            <h2 id="features-heading" className="text-4xl sm:text-5xl font-bold text-zinc-900 dark:text-white mb-6 leading-tight">
              Everything you need to excel in technical interviews
            </h2>
            <p className="text-xl text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Our platform combines curated problems, intelligent tracking, and community insights 
              to accelerate your interview preparation.
            </p>
          </div>

          {/* Features grid - Balanced layout with proper alignment */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Top row - Two equal cards */}
            <DynamicFeatureCard
              icon={<Code className="w-10 h-10" />}
              title="Curated Question Library"
              description="Access a meticulously selected collection of coding problems from real interviews at Google, Meta, Amazon, and other top tech companies. Each problem is tagged by difficulty, topic, and company frequency."
              variant="primary"
            />
            
            <DynamicFeatureCard
              icon={<Users className="w-10 h-10" />}
              title="Community Insights"
              description="Learn from detailed solutions and discussions from thousands of developers. Share your own approaches, compare different strategies, and discover optimal solutions through collaborative learning."
              variant="primary"
            />

            {/* Bottom row - Three equal cards */}
            <div className="lg:col-span-2 grid md:grid-cols-3 gap-6">

              <DynamicFeatureCard
                icon={<Trophy className="w-8 h-8" />}
                title="Track Progress"
                description="Monitor your improvement with detailed analytics, achievement milestones, and personalized insights into your coding journey."
                variant="secondary"
              />
              
              <DynamicFeatureCard
                icon={<Target className="w-8 h-8" />}
                title="Company Focus"
                description="Filter problems by target companies and prioritize what matters most to your specific job search and career goals."
                variant="secondary"
              />
              
              <DynamicFeatureCard
                icon={<TrendingUp className="w-8 h-8" />}
                title="Skill Building"
                description="Strengthen your algorithmic thinking with structured learning paths designed by industry experts and interview veterans."
                variant="secondary"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section - Sophisticated display */}
      <section className="relative py-20 bg-zinc-900 dark:bg-zinc-950 overflow-hidden">
        {/* Animated gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-sky-500/10 via-transparent to-indigo-500/10" />
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-sky-500/5 rounded-full blur-[128px] animate-pulse" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-8">
            <StatCard number="1800+" label="Coding Problems" />
            <StatCard number="50+" label="Companies Covered" />
            {/* <StatCard number="10k+" label="Active Learners" /> */}
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

function getDifficultyColor(difficulty: string) {
  switch (difficulty) {
    case 'beginner':
      return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200'
    case 'intermediate':
      return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200'
    case 'advanced':
      return 'bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200'
    default:
      return 'bg-zinc-100 text-zinc-800 dark:bg-zinc-700 dark:text-zinc-300'
  }
}