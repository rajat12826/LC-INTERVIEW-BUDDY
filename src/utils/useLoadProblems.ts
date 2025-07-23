// src/utils/useLoadProblems.ts
"use client"
import { useEffect, useState } from 'react'
import { useQuestionStore } from '@/utils/stores/useQuestionStore' // Import your question store

type Problem = {
  id: string
  title: string
  difficulty: string
  frequency: number
  link: string
  companies: string[]
  topics: string[]
}

export default function useLoadProblems() {
  const allProblemsRaw = useQuestionStore((state) => state.allQuestions); // Get allQuestions from Zustand
  const [allProblems, setAllProblems] = useState<Problem[]>([]);
  const [allCompanies, setAllCompanies] = useState<string[]>([]);
  const [allTopics, setAllTopics] = useState<string[]>([]);

  useEffect(() => {
    // Only process if allProblemsRaw is available
    if (allProblemsRaw.length === 0) {
        // If questions are not yet loaded into the store,
        // you might want to show a loading state in ChallengeFilter
        // or ensure Layout loads them first.
        return;
    }

    try {
        const problems = allProblemsRaw.map((problem: any) => ({
          id: problem['Link of Question'] || Math.random().toString(36), // Use a more robust ID if available
          title: problem.Question,
          difficulty: problem.Difficulty,
          frequency: parseInt(problem['Frequency (Number of Companies)']) || 0,
          link: problem['Link of Question'],
          companies: (problem['Companies Asking This Question'] || '')
            .split(',')
            .map((c: string) => c.trim())
            .filter(Boolean),
          topics: (problem.Topics || '')
            .split(',')
            .map((t: string) => t.trim())
            .filter(Boolean),
        }))

        const companyFreq: Record<string, number> = {}
        const topicFreq: Record<string, number> = {}

        problems.forEach((problem) => {
          problem.companies.forEach((company:any) => {
            companyFreq[company] = (companyFreq[company] || 0) + 1
          })
          problem.topics.forEach((topic:any) => {
            topicFreq[topic] = (topicFreq[topic] || 0) + 1
          })
        })

        setAllCompanies(
          Object.keys(companyFreq).sort((a, b) => companyFreq[b] - companyFreq[a])
        )
        setAllTopics(
          Object.keys(topicFreq).sort((a, b) => topicFreq[b] - topicFreq[a])
        )
        setAllProblems(problems)
      } catch (error) {
        console.error("Error processing problems from store:", error)
      }
  }, [allProblemsRaw]); // Depend on allProblemsRaw from the store

  return { allProblems, allCompanies, allTopics }
}