'use client' // This page needs to be a client component for Clerk's SignIn and your ToggleButton.

import ToggleButton from '@/app/_components/Toggle'
import { SignIn } from '@clerk/nextjs'
import Link from 'next/link' // Import Link for the logo

export default function Page() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/30 dark:from-gray-900 dark:via-gray-800 dark:to-blue-900/20">
      {/* Background Pattern - Consistent with ChallengesPage */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(59,130,246,0.15)_1px,transparent_0)] dark:bg-[radial-gradient(circle_at_1px_1px,rgba(59,130,246,0.1)_1px,transparent_0)] [background-size:24px_24px] pointer-events-none" />

      <div className="relative mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col items-center justify-center">
       

        {/* Main Content Area */}
        <div className="text-center max-w-xl lg:max-w-3xl ">
          {/* Logo - Aligned with Home page style, linking to homepage */}
          

          {/* Title - Consistent with ChallengesPage and Home */}
          <div className="mb-4">
            <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-900 dark:from-white dark:via-blue-200 dark:to-indigo-200 bg-clip-text text-transparent mb-4 leading-tight">
              LeetCode Interviewer Buddy 
            </h1>
            <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-indigo-500 mx-auto rounded-full" />
          </div>

          {/* Subtitle/Description - Consistent with Home and ChallengesPage */}
          <div className="max-w-2xl mx-auto mb-10">
            <p className="text-xl text-gray-600 dark:text-gray-300 leading-relaxed">
              Unlock your full potential for technical interviews.
            </p>
            <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed mt-2">
              Practice top LeetCode-style questions and get interview-ready with your AI tutor. Log in to start your journey!
            </p>
          </div>

          {/* Clerk SignIn Component */}
          <div className="flex justify-center">
            <SignIn
              appearance={{
                elements: {
                  formButtonPrimary: {
                    fontSize: 14,
                    textTransform: 'none',
                    // Using blue shades from your Home/Challenges page for consistency
                    backgroundColor: '#16328b', // A vibrant blue
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