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
// src/utils/stores/useQuestionStore.ts (or wherever PQuestion is defined)

// src/utils/stores/useQuestionStore.ts (or wherever your types are defined)

// src/utils/stores/useQuestionStore.ts (or wherever your types are defined)
export type PQuestion = any;
// type Example = {
//   // input can be a single string OR an array of strings
//   input: string | string[];

//   // output can be a single string, an array of strings, OR an array of mixed types
//   output: string | string[] | (number | boolean | null)[]; // Changed from string | string[]

//   image?: string;
//   explanation?: string;

//   // params can be a complex nested array. Using 'any' as a fallback,
//   // or a more specific type if the structure is consistent.
//   // Given number[][][][], let's try to be more specific if possible,
//   // but if it varies wildly, 'any' might be needed.
//   // For now, let's use a broader type to resolve the error.
//   params?: any; // Change this from any[] to any, as number[][][][] is not an array of arrays of any.
//                 // If it's *always* number[][][][], then use that.
//                 // params?: number[][][][]; // If you want to be extremely strict and only this shape is allowed
// };

// export type PQuestion = {
//   title: string;
//   link: string;
//   difficulty: string; // As decided previously, keeping this as string
//   description: string;
//   steps?: string[];
//   illustration?: string | null;
//   note?: string;
//   key_points?: string[];
//   examples: Example[]; // This will now correctly accept the updated Example type
//   constraints: string[];
//   process?: undefined; // Keep this if it's consistently undefined in your data
// };
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
