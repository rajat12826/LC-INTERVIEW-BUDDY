import supabase from '@/lib/supabase' // Changed import
// import AuthButton from '../auth/AuthButton'
import Link from 'next/link'
import { Code } from 'lucide-react'
import ToggleButton from '../Toggle'
import { UserButton } from '@clerk/nextjs'

export default async function Navbar() {
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <nav className="bg-white  dark:bg-gray-900   shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <Code className="h-8 w-8 text-blue-600" />
              <span className="text-xl font-bold text-gray-900 dark:text-white">
              LeetCode Interview Prep

              </span>
            </Link>
          </div>
          
          <div className="flex items-center space-x-8">
            <nav className="flex space-x-8">
              <Link 
              href="/questions" 
                className="text-gray-700 dark:text-white hover:text-blue-600 font-medium"
              >
                Questions
              </Link>
              {/* <Link 
                href="/leaderboard" 
                className="text-gray-700 dark:text-white hover:text-blue-600 font-medium"
              >
                Leaderboard
              </Link> */}
              {/* <div className="flex justify-center ">
          <UserButton />
        </div> */}
                <div className="absolute top-0 right-0 p-5">
                              <ToggleButton />
                            </div>
            </nav>
            {/* <AuthButton user={user} /> */}
          </div>
        </div>
      </div>
    </nav>
  )
}