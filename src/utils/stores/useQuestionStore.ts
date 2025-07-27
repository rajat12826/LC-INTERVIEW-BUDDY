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

export type PQuestion = any;

interface QuestionState {
  premiumQuestions:PQuestion[]
  allQuestions: Question[]
  solvedQuestions: Set<string>
  currentQuestion: Question | null
  currentPQuestion: PQuestion | null
  randomQuestion: Question | null // Added randomQuestion state
  setAllQuestions: (questions: Question[]) => void
  markAsSolved: (questionTitle: string) => void
  isSolved: (questionTitle: string) => boolean
  resetSolved: () => void
  setCurrentQuestion: (question: Question) => void
  setCurrentPQuestion: (question: PQuestion) => void
  getQuestionById: (id: string) => Question | undefined
  getQuestionPById: (id: string) => PQuestion | undefined
  getPQuestionById: (id: string) => PQuestion | undefined
  getQuestionIdFromUrl: (url: string) => string
  setPremiumQuestions:(questions: PQuestion[]) => void
  setRandomQuestion: () => void // Added setRandomQuestion action
}

export const useQuestionStore = create<QuestionState>()(
  persist(
    (set, get) => ({
      allQuestions: [],
      premiumQuestions:[],
      solvedQuestions: new Set(),
      currentQuestion: null,
      randomQuestion: null, // Initialize randomQuestion
currentPQuestion: null,
      setAllQuestions: (questions) => set({ allQuestions: questions }),
      setPremiumQuestions:(questions) => set({ premiumQuestions: questions }),
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
       setCurrentPQuestion: (question) => {
        set({ currentPQuestion: question })
      },

      setRandomQuestion: () => { // Implementation of setRandomQuestion
        const { allQuestions } = get();
        if (allQuestions.length > 0) {
          const randomIndex = Math.floor(Math.random() * allQuestions.length);
          set({ randomQuestion: allQuestions[randomIndex] });
        } else {
          set({ randomQuestion: null }); // No questions available
        }
      },
     
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
      getQuestionPById: (id: string) => {
        const {premiumQuestions, getQuestionIdFromUrl } = get()
        return premiumQuestions.find((question) => {
          const questionId = getQuestionIdFromUrl(question["link"])
          return questionId === id
        })
      },
      getPQuestionById: (id: string) => {
        const { premiumQuestions, getQuestionIdFromUrl } = get()
        return premiumQuestions.find((question) => {
          const questionId = getQuestionIdFromUrl(question["link"])
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
