'use client'

import { useState } from 'react'
import { Database } from '@/lib/database.types'
import { User } from '@supabase/supabase-js'
import SimpleCodeEditor from '../editor/CodeEditor' // Updated import
import TestRunner from '../editor/TestRunner'
import { getDifficultyColor } from '@/lib/utils'
import { ArrowLeft, Play, Save, Check, Share2 } from 'lucide-react'
import Link from 'next/link'
import supabase from '@/lib/supabase'
import toast from 'react-hot-toast'

type Challenge = Database['public']['Tables']['challenges']['Row']

interface ChallengeDetailProps {
  challenge: Challenge
  user: User | null
}

export default function ChallengeDetail({ challenge, user }: ChallengeDetailProps) {
  const [code, setCode] = useState(challenge.starter_code)
  const [isRunning, setIsRunning] = useState(false)
  const [testResults, setTestResults] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<'description' | 'submissions' | 'notes'>('description')
  const [isCompleted, setIsCompleted] = useState(false)

  const handleRunTests = async () => {
    if (!user) {
      toast.error('Please sign in to run tests')
      return
    }

    setIsRunning(true)
    try {
      // Simulate test execution (in a real app, you'd run this on the server)
      const results = await simulateTestExecution(code, challenge.test_cases)
      setTestResults(results)
      
      // Save submission
      const { error } = await supabase
        .from('submissions')
        .insert({
          challenge_id: challenge.id,
          user_id: user.id,
          code,
          status: results.allPassed ? 'passed' : 'failed',
          test_results: results.results
        })

      if (error) {
        console.error('Error saving submission:', error)
      }

      if (results.allPassed) {
        toast.success('All tests passed! 🎉')
        setIsCompleted(true)
        // Update user progress
        await supabase
          .from('user_progress')
          .upsert({
            user_id: user.id,
            challenge_id: challenge.id,
            completed: true,
            completed_at: new Date().toISOString()
          })
      } else {
        toast.error('Some tests failed. Keep trying!')
      }
    } catch (error) {
      console.error('Error running tests:', error)
      toast.error('Error running tests')
    } finally {
      setIsRunning(false)
    }
  }

  const handleSaveCode = async () => {
    if (!user) {
      toast.error('Please sign in to save code')
      return
    }

    try {
      const { error } = await supabase
        .from('submissions')
        .insert({
          challenge_id: challenge.id,
          user_id: user.id,
          code,
          status: 'pending'
        })

      if (error) throw error
      toast.success('Code saved!')
    } catch (error) {
      console.error('Error saving code:', error)
      toast.error('Error saving code')
    }
  }

  const handleMarkComplete = async () => {
    if (!user) {
      toast.error('Please sign in to mark as complete')
      return
    }

    try {
      await supabase
        .from('user_progress')
        .upsert({
          user_id: user.id,
          challenge_id: challenge.id,
          completed: true,
          completed_at: new Date().toISOString()
        })
      
      setIsCompleted(true)
      toast.success('Challenge marked as complete!')
    } catch (error) {
      console.error('Error marking as complete:', error)
      toast.error('Error marking as complete')
    }
  }

  const handleShare = () => {
    const url = window.location.href
    navigator.clipboard.writeText(url)
    toast.success('Solution link copied to clipboard!')
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumb */}
      <div className="border-b border-gray-200 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
          <div className="flex items-center text-sm text-gray-600">
            <Link href="/" className="hover:text-gray-900">Home</Link>
            <span className="mx-2">/</span>
            <Link href="/challenges" className="hover:text-gray-900">Challenges</Link>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="border-b border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <Link
                href="/challenges"
                className="flex items-center text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back to Challenges
              </Link>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleMarkComplete}
                disabled={!user || isCompleted}
                className={`flex items-center px-3 py-2 text-sm font-medium rounded-md border ${
                  isCompleted 
                    ? 'bg-green-50 text-green-700 border-green-200' 
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                } disabled:opacity-50`}
              >
                <Check className="h-4 w-4 mr-1" />
                {isCompleted ? 'Completed' : 'Mark as complete'}
              </button>
              <button
                onClick={handleShare}
                className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                <Share2 className="h-4 w-4 mr-1" />
                Share Solution
              </button>
            </div>
          </div>

          <div className="flex items-center space-x-3 mb-4">
            <span className="text-2xl font-bold text-gray-500">#{challenge.id}</span>
            <h1 className="text-2xl font-bold text-gray-900">{challenge.title}</h1>
          </div>

          <div className="flex items-center space-x-4 mb-4">
            <span className="text-sm text-gray-600">by</span>
            <span className="text-sm font-medium text-gray-900">{challenge.created_by}</span>
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getDifficultyColor(challenge.difficulty)}`}>
              {challenge.difficulty}
            </span>
            {challenge.tags?.map((tag) => (
              <span
                key={tag}
                className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>

          {/* Tabs */}
          <div className="flex space-x-8 border-b border-gray-200">
            {(['description', 'submissions', 'notes'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-2 text-sm font-medium capitalize ${
                  activeTab === tab
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left Panel - Description/Submissions/Notes */}
          <div className="space-y-6">
            {activeTab === 'description' && (
              <div className="bg-white">
                <div className="prose prose-sm max-w-none">
                  <p className="text-gray-700 whitespace-pre-line text-base leading-relaxed">
                    {challenge.description}
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'submissions' && (
              <div className="bg-white">
                <h3 className="text-lg font-semibold mb-4">Your Submissions</h3>
                <p className="text-gray-500">No submissions yet. Start coding to see your attempts here!</p>
              </div>
            )}

            {activeTab === 'notes' && (
              <div className="bg-white">
                <h3 className="text-lg font-semibold mb-4">Notes</h3>
                <textarea
                  className="w-full h-32 p-3 border border-gray-300 rounded-md resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Add your notes about this challenge..."
                />
              </div>
            )}

            {/* Test Results */}
            {testResults && (
              <TestRunner results={testResults} />
            )}
          </div>

          {/* Right Panel - Code Editor */}
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          
            <SimpleCodeEditor
              defaultCode={code}
              height="500px"
            />

            <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 text-center">
              <span className="text-sm font-medium text-gray-700">Preview</span>
            </div>

            <div className="p-4 bg-gray-50 border-t border-gray-200">
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleSaveCode}
                  disabled={!user}
                  className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                >
                  <Save className="h-4 w-4 mr-1" />
                  Save
                </button>
                <button
                  onClick={handleRunTests}
                  disabled={!user || isRunning}
                  className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  <Play className="h-4 w-4 mr-1" />
                  {isRunning ? 'Running...' : 'Run Tests'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Simulate test execution (replace with actual test runner)
async function simulateTestExecution(code: string, testCases: any[]) {
  await new Promise(resolve => setTimeout(resolve, 1000))
  
  const results = testCases.map((testCase, index) => ({
    id: testCase.id || index.toString(),
    description: testCase.description,
    passed: Math.random() > 0.3, // Random pass/fail for demo
    expected: testCase.expected,
    actual: testCase.expected, // In reality, you'd execute the code
    error: null
  }))

  return {
    results,
    allPassed: results.every(r => r.passed)
  }
}