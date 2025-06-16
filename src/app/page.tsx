"use client"
import Link from 'next/link'
// import supabase from '@/lib/supabase'
import { Code, Trophy, Users, ArrowRight } from 'lucide-react'
import {motion} from "framer-motion"
export default async function Home() {

   
  return (
   <div className="min-h-screen bg-white text-gray-900 dark:bg-gray-900 dark:text-white">
      {/* Hero Section */}
      <motion.section
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="bg-gradient-to-r from-blue-600 to-blue-700 text-white dark:from-indigo-800 dark:to-indigo-900"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Ace Your Tech Interviews
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-blue-100 dark:text-indigo-200">
              Practice top LeetCode-style questions and get interview-ready
            </p>
            <Link
              href="/questions"
              className="inline-flex items-center px-8 py-3 bg-white text-blue-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors dark:bg-gray-100 dark:text-indigo-900 dark:hover:bg-white"
            >
              Start Practicing
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </div>
      </motion.section>

      {/* Features Section */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1 }}
        className="py-20 bg-white dark:bg-gray-900"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Why Practice Interview Questions?
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Boost your problem-solving skills and prepare for technical interviews at top companies
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Code className="h-8 w-8 text-blue-600 dark:text-indigo-400" />}
              title="Curated Questions"
              description="Practice with questions commonly asked at FAANG and other top-tier tech companies"
            />
            <FeatureCard
              icon={<Trophy className="h-8 w-8 text-blue-600 dark:text-indigo-400" />}
              title="Track Progress"
              description="See your improvement over time and unlock achievements as you solve problems"
            />
            <FeatureCard
              icon={<Users className="h-8 w-8 text-blue-600 dark:text-indigo-400" />}
              title="Join the Community"
              description="Learn strategies from others and share your own interview experiences"
            />
          </div>
        </div>
      </motion.section>
    </div>
  )
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: any
  title: string
  description: string
}) {
  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      viewport={{ once: true }}
      className="text-center p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md"
    >
      <div className="bg-blue-100 dark:bg-indigo-900 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
        {icon}
      </div>
      <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
        {title}
      </h3>
      <p className="text-gray-600 dark:text-gray-300">{description}</p>
    </motion.div>
  )
}

function getDifficultyColor(difficulty: string) {
  switch (difficulty) {
    case 'beginner':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
    case 'intermediate':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
    case 'advanced':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
  }
}
