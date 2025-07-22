'use client'

import { Code, Trophy, Users, ArrowRight } from 'lucide-react'
import Navbar from './_components/layout/Navbar'
import { useUser } from '@clerk/nextjs'; 
import { useRouter} from 'next/navigation'; 
import { useState } from 'react'; 
import { supabase } from '@/lib/supabase'; 




export default function Home() {
  const { isSignedIn, user, isLoaded } = useUser(); 
  const router = useRouter();
  const [isProcessingClick, setIsProcessingClick] = useState(false); 

  
 

  const handleStartPracticingClick = async () => {
   
    if (!isLoaded || isProcessingClick) {
      return;
    }

    setIsProcessingClick(true); 

    if (isSignedIn && user) {
      const userEmail = user.emailAddresses[0]?.emailAddress;
      const clerkUserId = user.id;
      const userName = user.fullName || user.username || 'Unknown User'; 

      if (!userEmail || !clerkUserId) {
        console.error("Clerk user email or ID not found. Cannot proceed with Supabase check.");
        setIsProcessingClick(false); 
        return;
      }

      try {
     
        const { data: existingUser, error: fetchError } = await supabase
          .from('lc_users') // Changed table name to lc_users
          .select('is_premium')
          .eq('clerk_user_id', clerkUserId) // Query by clerk_user_id
          .single();

        if (fetchError && fetchError.code !== 'PGRST116') { 
          console.error("Error fetching user from Supabase:", fetchError);
        
          setIsProcessingClick(false); // Stop processing
          return;
        }
        console.log("Existing user data from Supabase:", existingUser);

        if (existingUser) {
          // User exists, check premium status
          if (existingUser.is_premium) {
            router.push('/leetcode'); // Redirect to questions if premium
          } else {
            router.push('/subscription'); // Redirect to subscription if not premium
          }
        } else {
          // User does not exist, create new user in Supabase's 'lc_users' table
          const newUuid = crypto.randomUUID(); // Generates a v4 UUID

          const { error: insertError } = await supabase
            .from('lc_users') 
            .insert({
              id: newUuid, 
              clerk_user_id: clerkUserId, 
              email: userEmail,
              name: userName, // Store user's name
              is_premium: false
            });

          if (insertError) {
            console.error("Error inserting user into Supabase:", insertError);
            setIsProcessingClick(false); // Stop processing
            return;
          }
          console.log(`New user ${clerkUserId} created in Supabase with ID: ${newUuid}.`);
          router.push('/subscription'); // New user created, redirect to subscription page
        }
      } catch (error) {
        console.error("An unexpected error occurred during Supabase interaction:", error);
        setIsProcessingClick(false); // Stop processing
      }
    } else if (isLoaded && !isSignedIn) {
     
      setIsProcessingClick(false); 
    }
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 dark:bg-gray-900 dark:text-white">
      <Navbar />

      <section className="bg-gradient-to-r from-blue-600 to-blue-700 text-white dark:from-indigo-800 dark:to-indigo-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Ace Your Tech Interviews
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-blue-100 dark:text-indigo-200">
              Practice top LeetCode-style questions and get interview-ready
            </p>
  
            <button
              onClick={handleStartPracticingClick}
              disabled={isProcessingClick || !isLoaded} // Disable while loading Clerk or processing click
              className="inline-flex items-center px-8 py-3 bg-white text-blue-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors dark:bg-gray-100 dark:text-indigo-900 dark:hover:bg-white"
            >
              {isProcessingClick ? 'Loading...' : 'Start Practicing'}
              <ArrowRight className="ml-2 h-5 w-5" />
            </button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Why Practice Interview Questions??
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
      </section>
    </div>
  )
}

function FeatureCard({ icon, title, description }: { icon: any, title: any, description: any }) {
  return (
    <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
      <div className="bg-blue-100 dark:bg-indigo-900 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
        {icon}
      </div>
      <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">{title}</h3>
      <p className="text-gray-600 dark:text-gray-300">{description}</p>
    </div>
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