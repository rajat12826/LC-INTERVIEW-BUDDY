'use client'

import Link from 'next/link'
import { Code, Trophy, Users, ArrowRight } from 'lucide-react'
import Navbar from './_components/layout/Navbar'
import { useUser } from '@clerk/nextjs'; // Import Clerk hooks
import { useRouter, useSearchParams } from 'next/navigation'; // Import Next.js router
import { useEffect, useState } from 'react'; // Import React hooks (useEffect is removed)
import { supabase } from '@/lib/supabase'; // Assuming this correctly imports your Supabase client
import { toast } from 'sonner';

// Note: The supabase client initialization code that was here previously
// has been moved to '@/lib/supabase' as per your import.
// Ensure '@/lib/supabase' correctly exports 'supabase' as:
// export const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || '', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '');


export default function Home() {
  const { isSignedIn, user, isLoaded } = useUser(); // Get user and loading status from Clerk
  const router = useRouter();
  const [isProcessingClick, setIsProcessingClick] = useState(false); // New state for button loading
  const searchParams = useSearchParams(); 
  
  useEffect(() => {
    // Add debug logging
    console.log('useEffect triggered - checking for payment params');
    console.log('Current URL:', window.location.href);
    console.log('All search params:', Object.fromEntries(searchParams.entries()));
    
    const paymentId = searchParams.get('payment_id');
    const status = searchParams.get('status');
    
    console.log('Payment ID:', paymentId);
    console.log('Status:', status);
    console.log('Status exact match check:', status === 'succeeded');
    console.log('Status type:', typeof status);

    if (paymentId && status === 'succeeded') {
      console.log('✅ Payment success conditions met - showing toast');
      
      // Show toast with explicit configuration
      toast.success('🎉 Payment successful! You now have premium access.', {
        duration: 5000,
        // position: 'top-center',
      });
      
     

      // Clean up the URL after a longer delay to ensure toast shows
      setTimeout(() => {
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.delete('payment_id');
        newUrl.searchParams.delete('status');
        
        console.log('🧹 Cleaning URL - before:', window.location.href);
        console.log('🧹 Cleaning URL - after:', newUrl.pathname + newUrl.search);
        
        router.replace(newUrl.pathname + newUrl.search);
      }, 2000); // Increased delay to 2 seconds
      
    } else {
      console.log('❌ Payment success conditions NOT met');
      if (!paymentId) console.log('- Missing payment_id parameter');
      if (status !== 'succeeded') console.log('- Status is not "succeeded", got:', status, 'type:', typeof status);
    }
  }, [searchParams, router]);

  // Removed useEffect to prevent automatic redirection on page load
  const handleStartPracticingClick = async () => {
    // Only proceed if Clerk user data is loaded and not already processing
    if (!isLoaded || isProcessingClick) {
      return;
    }

    setIsProcessingClick(true); // Indicate that processing has started

    if (isSignedIn && user) {
      const userEmail = user.emailAddresses[0]?.emailAddress;
      const clerkUserId = user.id;
      const userName = user.fullName || user.username || 'Unknown User'; // Get user's full name or a fallback

      if (!userEmail || !clerkUserId) {
        console.error("Clerk user email or ID not found. Cannot proceed with Supabase check.");
        setIsProcessingClick(false); // Stop processing
        // Optionally, show an error message to the user
        return;
      }

      try {
        // 1. Check if user exists in Supabase's 'lc_users' table using clerk_user_id
        const { data: existingUser, error: fetchError } = await supabase
          .from('lc_users') // Changed table name to lc_users
          .select('is_premium')
          .eq('clerk_user_id', clerkUserId) // Query by clerk_user_id
          .single();

        if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 means "no rows found"
          console.error("Error fetching user from Supabase:", fetchError);
          // Handle other types of fetch errors (e.g., network issues)
          setIsProcessingClick(false); // Stop processing
          return;
        }
        console.log("Existing user data from Supabase:", existingUser);

        if (existingUser) {
          // User exists, check premium status
          if (existingUser.is_premium) {
            router.push('/questions'); // Redirect to questions if premium
          } else {
            router.push('/subscription'); // Redirect to subscription if not premium
          }
        } else {
          // User does not exist, create new user in Supabase's 'lc_users' table
          const newUuid = crypto.randomUUID(); // Generates a v4 UUID

          const { error: insertError } = await supabase
            .from('lc_users') // Changed table name to lc_users
            .insert({
              id: newUuid, // IMPORTANT: Provide the generated UUID for the 'id' column
              clerk_user_id: clerkUserId, // Store Clerk's user ID
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
      // User is not signed in, clicking "Start Practicing" should initiate Clerk's sign-in flow.
      // Clerk's components (like SignInButton/SignUpButton) will handle the login flow.
      // For now, we'll let the button simply be a Link to /questions, relying on middleware protection.
      router.push('/sign-in'); // Redirect to Clerk's sign-in page if not signed in
      setIsProcessingClick(false); // Stop processing
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
            {/* Changed to a button to trigger the click handler */}
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