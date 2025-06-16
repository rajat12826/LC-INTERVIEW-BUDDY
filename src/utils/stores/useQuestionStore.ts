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
  setAllQuestions: (questions: Question[]) => void
  markAsSolved: (questionTitle: string) => void
  isSolved: (questionTitle: string) => boolean
  resetSolved: () => void
}

export const useQuestionStore = create<QuestionState>()(
  persist(
    (set, get) => ({
      allQuestions: [],
      solvedQuestions: new Set(),

      setAllQuestions: (questions) => set({ allQuestions: questions }),

     markAsSolved: (questionTitle) => {
  set((state) => {
    const updated = new Set(state.solvedQuestions)
    updated.add(questionTitle)
    return { solvedQuestions: updated } // <- new reference, React re-renders
  })
}
,

      isSolved: (questionTitle) => {
        return get().solvedQuestions.has(questionTitle)
      },

      resetSolved: () => {
        set({ solvedQuestions: new Set() })
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
