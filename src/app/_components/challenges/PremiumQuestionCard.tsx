// src/app/_components/challenges/PremiumQuestionCard.tsx (New file or renamed from QuestionCard.tsx)

'use client'

import { FC } from 'react' // useState for expansion removed as no companies/topics to expand
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowUpRight, Check, Circle } from 'lucide-react' // BadgeCheck, ChevronUp, ChevronDown removed
import clsx from 'clsx'
import { useQuestionStore} from '@/utils/stores/useQuestionStore' // Import PQuestion
import { Button } from '@/components/ui/button'
type Example = {
  input: string;
  output: string | number;
  explanation?: string;
  image?: string;
};

type PQuestion = {
  title: string;
  link: string;
  difficulty: "Easy" | "Medium" | "Hard";
  description: string;
  steps?: string[];              // For tree-type questions
  illustration?: string;         // Image explaining the concept
  note?: string;                 // Additional note about the problem
  key_points?: string[];         // For maze-type questions
  examples: Example[];           // Test case examples
  constraints: string[];         // Problem constraints
};
interface PremiumQuestionCardProps {
  question: PQuestion // Now expects PQuestion type
}

const getDifficultyStyle = (difficulty: string) => {
  switch (difficulty.toLowerCase()) { // Use toLowerCase for consistent matching
    case 'easy':
      return 'bg-green-100 text-green-800 flex justify-center items-center dark:bg-green-900 dark:text-green-200'
    case 'medium':
      return 'bg-yellow-100 text-[#ffa000] dark:bg-[#ffa000] dark:text-yellow-200'
    case 'hard':
      return 'bg-red-100 text-red-800 flex justify-center dark:bg-[#ff1744] dark:text-red-200'
    default:
      return 'bg-gray-100 text-gray-800 flex justify-center dark:bg-gray-700 dark:text-gray-200'
  }
}

const PremiumQuestionCard: FC<PremiumQuestionCardProps> = ({ question }) => {
  const router = useRouter()
  // Use question.title as the identifier for solved status in the store
  const { markAsSolved, isSolved, setCurrentPQuestion, getQuestionIdFromUrl } = useQuestionStore()

  const solved = isSolved(question.title) // Use question.title for solved status check

  // No more company or topic display logic as per PQuestion type
  // const [isExpanded, setIsExpanded] = useState(false) // Removed

  const handleAITutorClick = () => {
    // Extract ID from the LeetCode URL using the question's link
    const questionId = getQuestionIdFromUrl(question.link)
    
    // Set current question in store for the AI tutor page to access
    // Assuming setCurrentQuestion in your store can handle a PQuestion type.
    setCurrentPQuestion(question)
    
    // Navigate to the AI tutor page with the extracted ID
    router.push(`/leetcode/premium/${questionId}`)
  }

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <span
          className={clsx(
            'text-xs font-semibold px-3 text-center py-1 rounded-full',
            getDifficultyStyle(question.difficulty) // Use question.difficulty
          )}
        >
          {question.difficulty} {/* Display question.difficulty */}
        </span>
        {/* Removed: Frequency (Number of Companies) display, as it's not in PQuestion */}
      </div>

      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        {question.title} {/* Use question.title */}
      </h3>
      <h3 className='text-sm'>
        {question?.description}
      </h3>

      {/* Removed: Topics display, as it's not in PQuestion */}
      {/* <p className="text-sm text-gray-600  dark:text-gray-300 mb-4">
        Topics: <span className="font-medium">{question.Topics}</span>
      </p> */}

      {/* Removed: Companies section entirely, as PQuestion does not have this data */}
      {/* If you add `companies: string[]` to PQuestion, you can reintroduce this. */}

      <div className='flex justify-between items-center mt-4'> {/* Added mt-4 for spacing as previous sections are gone */}
       

        {/* Action Buttons */}
        <div className="flex gap-2">
          {/* AI Tutor Button */}
          <Button
            onClick={handleAITutorClick}
            className="inline-flex items-center justify-center px-3 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-medium rounded-lg transition-all duration-200 shadow-md hover:shadow-lg cursor-pointer"
          >
           
          View
          </Button>

          {/* Solved Status Button */}
          <button
            onClick={() => markAsSolved(question.title)} // Use question.title for marking solved
            className={clsx(
              "group relative inline-flex items-center justify-center px-2 py-1 text-sm font-semibold rounded-lg transition-all duration-200 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 shadow-sm",
              solved
                ? "bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-emerald-500/25 hover:shadow-emerald-500/40 focus:ring-emerald-500 border border-emerald-500"
                : "bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-500 hover:from-gray-100 hover:to-gray-200 dark:hover:from-gray-600 dark:hover:to-gray-500 focus:ring-gray-500 shadow-gray-300/20 hover:shadow-gray-400/30"
            )}
          >
            <div className="flex items-center space-x-2">
              {solved ? (
                <>
                  <Check className="w-4 h-4 transition-transform group-hover:scale-110" />
                  <span>Solved</span>
                </>
              ) : (
                <>
                  <Circle className="w-4 h-4 transition-transform group-hover:scale-110" />
                  <span>Mark as Done</span>
                </>
              )}
            </div>
            
            {/* Subtle glow effect for solved state */}
            {solved && (
              <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-emerald-400/20 to-green-500/20 blur-sm -z-10 group-hover:blur-md transition-all duration-200" />
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default PremiumQuestionCard