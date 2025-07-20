'use client' // This page needs to be a client component for Clerk's SignUp and your ToggleButton.

import ToggleButton from '@/app/_components/Toggle'
import { SignUp } from '@clerk/nextjs'
import Link from 'next/link' // Import Link for the logo
import { Code } from 'lucide-react' // Import Code icon from lucide-react

export default function Page() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/30 dark:from-gray-900 dark:via-gray-800 dark:to-blue-900/20">
      {/* Background Pattern - Consistent with ChallengesPage and SignInPage */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(59,130,246,0.15)_1px,transparent_0)] dark:bg-[radial-gradient(circle_at_1px_1px,rgba(59,130,246,0.1)_1px,transparent_0)] [background-size:24px_24px] pointer-events-none" />

      <div className="relative mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col items-center justify-center">
        {/* Toggle Button in the top right */}
        <div className="absolute top-5 right-5">
          <ToggleButton />
        </div>

        {/* Main Content Area */}
        <div className="text-center max-w-xl lg:max-w-3xl py-12">
          {/* Logo - Aligned with Home page style, linking to homepage */}
          <div className="mb-6">
            <Link
              href="/"
              className="inline-flex size-20 items-center justify-center rounded-full bg-blue-100 text-blue-600 sm:size-24 dark:bg-indigo-900 dark:text-indigo-400"
            >
              <span className="sr-only">Home</span>
              {/* Using the Code icon for consistency */}
              <Code className="h-12 w-12" /> {/* Use Lucide icon directly */}
            </Link>
          </div>

          {/* Title - Consistent with ChallengesPage and Home */}
          <div className="mb-4">
            <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-900 dark:from-white dark:via-blue-200 dark:to-indigo-200 bg-clip-text text-transparent mb-4 leading-tight">
              Join LeetCode Interviewer Buddy 🚀
            </h1>
            <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-indigo-500 mx-auto rounded-full" />
          </div>

          {/* Subtitle/Description - Consistent with Home and ChallengesPage */}
          <div className="max-w-2xl mx-auto mb-10">
            <p className="text-xl text-gray-600 dark:text-gray-300 leading-relaxed">
              Create your account to start mastering technical interviews.
            </p>
            <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed mt-2">
              Access all LeetCode questions, personalized AI tutor sessions, and track your progress.
            </p>
          </div>

          {/* Clerk SignUp Component */}
          <div className="flex justify-center">
            <SignUp
              appearance={{
                elements: {
                  formButtonPrimary: {
                    fontSize: 14,
                    textTransform: 'none',
                    // Using blue shades from your Home/Challenges page for consistency
                    backgroundColor: '#3B82F6', // A vibrant blue
                    '&:hover, &:focus, &:active': {
                      backgroundColor: '#2563EB', // A slightly darker blue on hover
                    },
                  },
                },
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}