import { useQuery } from '@tanstack/react-query'

export type Question = {
  Difficulty: string
  Question: string
  "Frequency (Number of Companies)": number
  "Link of Question": string
  "Companies Asking This Question": string
  Topics: string
}

export type PQuestion = any

export function useQuestionsData() {
  return useQuery({
    queryKey: ['questionsData'],
    queryFn: async () => {
      const [qRes, pRes] = await Promise.all([
        fetch('/api/questions'),
        fetch('/api/premiumQ')
      ])
      
      if (!qRes.ok || !pRes.ok) throw new Error('Failed to fetch questions')
      
      const qData = await qRes.json()
      const pData = await pRes.json()
      
      return { 
        qData: qData as { questions: Question[], allTopics: string[], allCompanies: string[] }, 
        pData: pData as PQuestion[] 
      }
    },
    staleTime: Infinity,
  })
}

export function useQuestionById(id: string) {
  const { data, isLoading } = useQuestionsData()
  
  const question = data?.qData.questions.find((q) => {
    const match = q["Link of Question"].match(/\/problems\/([^\/]+)/)
    return match ? match[1] === id : false
  })

  return { question, isLoading }
}

export function usePremiumQuestionById(id: string) {
  const { data, isLoading } = useQuestionsData()
  
  const question = data?.pData.find((q) => {
    const match = q["link"].match(/\/problems\/([^\/]+)/)
    return match ? match[1] === id : false
  })

  return { question, isLoading }
}
