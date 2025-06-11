// stores/useQuestionStore.ts
import { create } from 'zustand'

type Question = {
  Difficulty: string
  Question: string
  "Frequency (Number of Companies)": number
  "Link of Question": string
  "Companies Asking This Question": string
  Topics: string
}


interface QuestionState {
    allQuestions: Question[]
    setAllQuestions: (questions: Question[]) => void
  }
  
  export const useQuestionStore = create<QuestionState>((set) => ({
    allQuestions: [],
    setAllQuestions: (questions) => set({ allQuestions: questions }),
  }))