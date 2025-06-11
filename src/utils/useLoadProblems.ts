"use client"
import { useEffect, useState } from 'react'
import data from '../lib/questions.json'
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
  const [allProblems, setAllProblems] = useState<Problem[]>([])
  const [allCompanies, setAllCompanies] = useState<string[]>([])
  const [allTopics, setAllTopics] = useState<string[]>([])

  useEffect(() => {
    async function fetchData() {
      try {
        // const response = await fetch('questions_data.json')
        // if (!response.ok) throw new Error('Failed to load data')

        // const data = await response.json()
        const problems = data.map((problem: any) => ({
          id: problem['Link of Question'] || Math.random().toString(36),
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
// console.log(problems);

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
// console.log(   Object.keys(topicFreq).sort((a, b) => topicFreq[b] - topicFreq[a]));

        setAllCompanies(
          Object.keys(companyFreq).sort((a, b) => companyFreq[b] - companyFreq[a])
        )
        setAllTopics(
          Object.keys(topicFreq).sort((a, b) => topicFreq[b] - topicFreq[a])
        )
        setAllProblems(problems)
      } catch (error) {
        console.error(error)
      }
    }


    fetchData()
    // console.log(allTopics);
  }, [])

  return { allProblems, allCompanies, allTopics }
}
