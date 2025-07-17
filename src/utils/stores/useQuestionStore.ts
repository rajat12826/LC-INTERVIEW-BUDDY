import { create } from 'zustand'
import { persist } from 'zustand/middleware'

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
  solvedQuestions: Set<string>
  currentQuestion: Question | null
  setAllQuestions: (questions: Question[]) => void
  markAsSolved: (questionTitle: string) => void
  isSolved: (questionTitle: string) => boolean
  resetSolved: () => void
  setCurrentQuestion: (question: Question) => void
  getQuestionById: (id: string) => Question | undefined
  getQuestionIdFromUrl: (url: string) => string
}

export const useQuestionStore = create<QuestionState>()(
  persist(
    (set, get) => ({
      allQuestions: [],
      solvedQuestions: new Set(),
      currentQuestion: null,

      setAllQuestions: (questions) => set({ allQuestions: questions }),

      markAsSolved: (questionTitle) => {
        set((state) => {
          const updated = new Set(state.solvedQuestions)
          updated.add(questionTitle)
          return { solvedQuestions: updated }
        })
      },

      isSolved: (questionTitle) => {
        return get().solvedQuestions.has(questionTitle)
      },

      resetSolved: () => {
        set({ solvedQuestions: new Set() })
      },

      setCurrentQuestion: (question) => {
        set({ currentQuestion: question })
      },

      // Extract question ID from LeetCode URL
      getQuestionIdFromUrl: (url: string) => {
        const match = url.match(/\/problems\/([^\/]+)/)
        return match ? match[1] : ''
      },

   
      getQuestionById: (id: string) => {
        const { allQuestions, getQuestionIdFromUrl } = get()
        return allQuestions.find((question) => {
          const questionId = getQuestionIdFromUrl(question["Link of Question"])
          return questionId === id
        })
      },
    }),
    {
      name: 'question-storage',
      partialize: (state) => ({
        solvedQuestions: Array.from(state.solvedQuestions),
      }),
      merge: (persistedState: any, currentState) => ({
        ...currentState,
        ...persistedState,
        solvedQuestions: new Set(persistedState?.solvedQuestions ?? []),
      }),
    }
  )
)