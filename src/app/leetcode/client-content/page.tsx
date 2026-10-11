// app/challenges/client-content.tsx
// This is a client component that conditionally renders the challenges page
// or a premium subscription prompt based on the `isPremium` prop.

'use client';

import { useChallengeFilterStore } from '@/utils/stores/useChallengeFilterStore';
import ChallengeFilters from '@/app/_components/challenges/ChallengeFilter';
import QuestionCard from '@/app/_components/challenges/QuestionCard';
import { useQuestionStore } from '@/utils/stores/useQuestionStore';
import { useQuestionsData } from '@/hooks/useQuestionsData';
import { useUser } from '@clerk/nextjs'; // Import Clerk's useUser hook
import { useRouter } from 'next/navigation';
import { useState } from 'react';

// Define the type for the product, matching your Dodo Payments product structure
type DodoProduct = {
  product_id: string; // Dodo Payments product IDs are strings
  name: string;
  description: string;
  price: number; // Price in smallest currency unit (e.g., cents)
  is_recurring: boolean;
};

// This component will receive the `isPremium` status from the server component
export default function ChallengesClientContent({ isPremium }: { isPremium: boolean }) {
  const { data } = useQuestionsData();
  const allQuestions = data?.qData.questions || [];
  const { search, difficulty, category, companies, topics, solved, clearAll } = useChallengeFilterStore();
  const isSolved = useQuestionStore((state) => state.isSolved);

  const { user, isLoaded: isClerkLoaded } = useUser(); // Get Clerk user data
  const router = useRouter();
  const [loadingCheckout, setLoadingCheckout] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  // Filter questions based on selected filters (existing logic)
  const filteredQuestions = allQuestions?.filter((q) => {
    const matchesSearch =
      search === '' ||
      q.Question.toLowerCase().includes(search.toLowerCase()) ||
      q.Topics.toLowerCase().includes(search.toLowerCase());

    const matchesDifficulty =
      difficulty === '' || q.Difficulty.toLowerCase() === difficulty.toLowerCase();

    const matchesCompanies =
      companies.length === 0 ||
      companies.some((comp) => q['Companies Asking This Question'].includes(comp));

    const matchesTopics =
      topics.length === 0 ||
      topics.some((topic) => q.Topics.toLowerCase().includes(topic.toLowerCase()));

    const matchesSolved =
      solved === 'all' ||
      (solved === 'solved' && isSolved(q.Question)) ||
      (solved === 'unsolved' && !isSolved(q.Question));

    return (
      matchesSearch &&
      matchesDifficulty &&
      matchesCompanies &&
      matchesTopics &&
      matchesSolved
    );
  });

  // Function to handle initiating Dodo Payments checkout
  const handleGoPremium = async () => {
    if (!isClerkLoaded || !user || !user.emailAddresses || user.emailAddresses.length === 0) {
      setCheckoutError("User not logged in or email not available. Please refresh or try again.");
      return;
    }

    setLoadingCheckout(true);
    setCheckoutError(null);

    try {
      // Call your API route to create a Dodo Payments checkout session
      const response = await fetch('/api/dodo-payments/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userEmail: user.emailAddresses[0].emailAddress,
          clerkUserId: user.id,
          // You can pass other user info or product details if your API expects them
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to initiate premium checkout.');
      }

      const { checkoutUrl } = await response.json();
      router.push(checkoutUrl); // Redirect user to Dodo Payments hosted checkout page
    } catch (err: any) {
      console.error('Error initiating premium checkout:', err);
      setCheckoutError(err.message || 'An unexpected error occurred during checkout.');
    } finally {
      setLoadingCheckout(false);
    }
  };

  // If Clerk is still loading, show a loading state
  if (!isClerkLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <p className="text-lg text-gray-700 dark:text-gray-300">Loading user data...</p>
      </div>
    );
  }

  // Conditional rendering based on `isPremium` status
  if (!isPremium) {
    // Show premium options if not subscribed
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 via-white to-blue-50/30 dark:from-gray-900 dark:via-gray-800 dark:to-blue-900/20 p-4">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(59,130,246,0.15)_1px,transparent_0)] dark:bg-[radial-gradient(circle_at_1px_1px,rgba(59,130,246,0.1)_1px,transparent_0)] [background-size:24px_24px] pointer-events-none" />

        <div className="relative z-10 text-center bg-white/70 dark:bg-gray-800/70 backdrop-blur-md rounded-2xl p-8 md:p-12 shadow-xl max-w-2xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-indigo-700 text-transparent bg-clip-text mb-6">
            Unlock Premium Challenges
          </h1>
          <p className="text-lg text-gray-700 dark:text-gray-300 mb-8 leading-relaxed">
            Access all curated challenges, advanced filters, and exclusive interview preparation content.
            Upgrade your account to supercharge your LeetCode journey!
          </p>

          <div className="bg-blue-50/50 dark:bg-blue-900/20 rounded-xl p-6 mb-8 border border-blue-100 dark:border-blue-800">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Premium Plan</h2>
            <p className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-2">$9.99<span className="text-lg text-gray-600 dark:text-gray-400">/month</span></p>
            <ul className="text-gray-700 dark:text-gray-300 list-disc list-inside text-left mx-auto max-w-xs">
              <li>Full access to all problems</li>
              <li>Advanced filtering options</li>
              <li>Detailed solution explanations</li>
              <li>Priority support</li>
            </ul>
          </div>

          <button
            onClick={handleGoPremium}
            disabled={loadingCheckout}
            className="w-full md:w-auto px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-700 text-white font-bold rounded-lg shadow-lg hover:shadow-xl hover:from-blue-700 hover:to-indigo-800 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loadingCheckout ? 'Redirecting to Checkout...' : 'Go Premium Now!'}
          </button>

          {checkoutError && (
            <p className="mt-4 text-red-600 dark:text-red-400 text-sm">{checkoutError}</p>
          )}

          <p className="mt-6 text-sm text-gray-500 dark:text-gray-400">
            By clicking "Go Premium Now!", you will be redirected to Dodo Payments to complete your subscription.
          </p>
        </div>
      </div>
    );
  }

  // If subscribed, render the original ChallengesPage content
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/30 dark:from-gray-900 dark:via-gray-800 dark:to-blue-900/20">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(59,130,246,0.15)_1px,transparent_0)] dark:bg-[radial-gradient(circle_at_1px_1px,rgba(59,130,246,0.1)_1px,transparent_0)] [background-size:24px_24px] pointer-events-none" />

      <div className="relative mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header Section */}
        <div className="mb-12 text-center">
          {/* Main Title */}
          <div className="mb-6">
            <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-900 dark:from-white dark:via-blue-200 dark:to-indigo-200 bg-clip-text text-transparent mb-4 leading-tight">
              LeetCode Problems
            </h1>
            <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-indigo-500 mx-auto rounded-full" />
          </div>

          {/* Subtitle */}
          <div className="max-w-2xl mx-auto">
            <p className="text-xl text-gray-600 dark:text-gray-300 leading-relaxed">
              Master your coding skills with{' '}
              <span className="font-semibold text-blue-600 dark:text-blue-400">
                {filteredQuestions?.length || 0}
              </span>{' '}
              carefully curated challenges from top tech companies
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto mt-8">
            <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl p-4 border border-gray-200/50 dark:border-gray-700/50 shadow-sm hover:shadow-md">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {filteredQuestions?.filter((c) => c.Difficulty === 'EASY').length || 0}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Easy Problems</div>
            </div>
            <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl p-4 border border-gray-200/50 dark:border-gray-700/50 shadow-sm hover:shadow-md">
              <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                {filteredQuestions?.filter((c) => c.Difficulty === 'MEDIUM').length || 0}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Medium Problems</div>
            </div>
            <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl p-4 border border-gray-200/50 dark:border-gray-700/50 shadow-sm hover:shadow-md">
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                {filteredQuestions?.filter((c) => c.Difficulty === 'HARD').length || 0}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Hard Problems</div>
            </div>
          </div>
        </div>

        {/* Filters Section */}
        <div className="mb-10">
          <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 dark:border-gray-700/50 shadow-lg">
            <ChallengeFilters />
          </div>
        </div>

        {/* Problems Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredQuestions?.map((question) => (
            <QuestionCard key={question.Question} question={question} />
          ))}
        </div>

        {/* Empty State */}
        {filteredQuestions?.length === 0 && (
          <div className="text-center py-20">
            <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-2xl p-12 border border-gray-200/50 dark:border-gray-700/50 shadow-lg max-w-md mx-auto">
              {/* Empty State Icon */}
              <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-full flex items-center justify-center">
                <svg
                  className="w-10 h-10 text-blue-500 dark:text-blue-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>

              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                No Problems Found
              </h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                No challenges found matching your current criteria. Try adjusting your filters to
                see more problems.
              </p>

              {/* Reset Button */}
              <button
                className="mt-6 inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors"
                onClick={clearAll}
              >
                Reset Filters
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
