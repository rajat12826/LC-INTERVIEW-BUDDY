'use client'

import { FC, useState } from 'react'
import Link from 'next/link'
import { BadgeCheck, ArrowUpRight, ChevronUp, ChevronDown } from 'lucide-react'
import clsx from 'clsx'

interface Question {
  Difficulty: string
  Question: string
  'Frequency (Number of Companies)': number
  'Link of Question': string
  'Companies Asking This Question': string
  Topics: string
}

interface QuestionCardProps {
  question: Question
}

const getDifficultyStyle = (difficulty: string) => {
  switch (difficulty) {
    case 'EASY':
      return 'bg-green-100 text-green-800  flex justify-center items-center  dark:bg-green-900 dark:text-green-200'
    case 'MEDIUM':
      return 'bg-yellow-100 text-[#ffa000]  dark:bg-[#ffa000] dark:text-yellow-200'
    case 'HARD':
      return 'bg-red-100 text-red-800 flex justify-center dark:bg-[#ff1744] dark:text-red-200'
    default:
      return 'bg-gray-100 text-gray-800 flex justify-center dark:bg-gray-700 dark:text-gray-200'
  }
}

const QuestionCard: FC<QuestionCardProps> = ({ question }) => {
    const companyArray=question['Companies Asking This Question']
    .split(',')
  const companies = companyArray
    .map((c) => c.trim())
    .slice(0, 5)
    const remainingCompanies = companyArray.map((c) => c.trim()).slice(5, Math.min(companyArray.length, 50))
    const [isExpanded, setIsExpanded] = useState(false)
  
    const hasMoreCompanies = companyArray.length > 5
console.log();

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <span
          className={clsx(
            'text-xs font-semibold px-3 text-center py-1 rounded-full',
            getDifficultyStyle(question.Difficulty)
          )}
        >
          {question.Difficulty}
        </span>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {question['Frequency (Number of Companies)']} companies
        </span>
      </div>

      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        {question.Question}
      </h3>

      <p className="text-sm text-gray-600  dark:text-gray-300 mb-4">
        Topics: <span className="font-medium">{question.Topics}</span>
      </p>

      {/* <div className="flex flex-wrap gap-2 mb-4 cursor-pointer">
        {companies.map((company, i) => (
          <span
            key={i}
            className="inline-flex items-center text-xs font-medium bg-gray-100 dark:bg-gray-700 dark:text-gray-200 text-gray-800 px-2.5 py-1 rounded-md"
          >
            <BadgeCheck className="w-3 h-3 mr-1" />
            {company}
          </span>
        ))}
        {question['Companies Asking This Question'].split(',').length > 5 && (which!=question["Question"]) && (
          <span className="text-xs text-gray-500 dark:text-gray-400 italic flex justify-center items-center" onClick={()=>{setwhich(question["Question"])}}>+ more</span>
        )}
 {question['Companies Asking This Question'].split(',').length > 5 && (which===question["Question"]) && (
          <span className="text-xs text-gray-500 dark:text-gray-400 italic flex justify-center " onClick={()=>{setwhich(null)}}>- less  </span>

        )}
        <div className=' w-full '> </div>
{
(which===question["Question"]) && remaincompanies.map((company,i)=>(
    <span className='mt-3 flex flex-wrap gap-2 justify-center'>{company}</span>
))
        }
      </div> */}
<div className="mb-4">
        <div className="flex flex-wrap gap-2 mb-2">
          {companies.map((company, i) => (
            <span
              key={i}
              className="inline-flex items-center text-xs font-medium bg-blue-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2.5 py-1.5 rounded-md border border-gray-200 dark:border-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-900/50 "
            >
              <BadgeCheck className="w-3 h-3 mr-1" />
              {company}
            </span>
          ))}
          
          {hasMoreCompanies && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="inline-flex items-center text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-gray-600 dark:hover:text-gray-400 px-2.5 py-1.5 rounded-md border border-gray-300 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 "
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="w-3 h-3 mr-1" />
                  Show less
                </>
              ) : (
                <>
                  <ChevronDown className="w-3 h-3 mr-1" />
                  +{companyArray.length - 5} more
                </>
              )}
            </button>
          )}
        </div>

        {/* Expanded Companies */}
        {isExpanded && remainingCompanies.length > 0 && (
          <div className=" pt-2 border-t border-gray-200 dark:border-gray-700">
            <div className="flex flex-wrap gap-2">
              {remainingCompanies.map((company, i) => (
                <span
                  key={i}
                  className="inline-flex items-center text-xs font-medium bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2.5 py-1.5 rounded-md border border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 "
                >
                  <BadgeCheck className="w-3 h-3 mr-1 text-gray-500 dark:text-gray-400" />
                  {company}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
      <Link
        href={question['Link of Question']}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center text-sm text-blue-600 dark:text-indigo-300 font-medium hover:underline"
      >
        View on LeetCode <ArrowUpRight className="w-4 h-4 ml-1" />
      </Link>
    </div>
  )
}

export default QuestionCard
