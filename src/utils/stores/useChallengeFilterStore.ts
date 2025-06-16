import { create } from 'zustand'

type FilterState = {
  search: string
  difficulty: string
  category: string
  companies: string[]
  topics: string[]
  solved: 'all' | 'solved' | 'unsolved'
  setSearch: (search: string) => void
  setDifficulty: (difficulty: string) => void
  setCategory: (category: string) => void
  addCompany: (company: string) => void
  removeCompany: (company: string) => void
  addTopic: (topic: string) => void
  removeTopic: (topic: string) => void
  setSolved: (solved: 'all' | 'solved' | 'unsolved') => void
  clearAll: () => void
}

export const useChallengeFilterStore = create<FilterState>((set) => ({
  search: '',
  difficulty: '',
  category: '',
  companies: [],
  topics: [],
  solved: 'all',
  setSearch: (search) => set({ search }),
  setDifficulty: (difficulty) => set({ difficulty }),
  setCategory: (category) => set({ category }),
  addCompany: (company) =>
    set((state) => ({
      companies: state.companies.includes(company)
        ? state.companies
        : [...state.companies, company],
    })),
  removeCompany: (company) =>
    set((state) => ({
      companies: state.companies.filter((c) => c !== company),
    })),
  addTopic: (topic) =>
    set((state) => ({
      topics: state.topics.includes(topic)
        ? state.topics
        : [...state.topics, topic],
    })),
  removeTopic: (topic) =>
    set((state) => ({
      topics: state.topics.filter((t) => t !== topic),
    })),
  setSolved: (solved) => set({ solved }),
  clearAll: () =>
    set({
      search: '',
      difficulty: '',
      category: '',
      companies: [],
      topics: [],
      solved: 'all',
    }),
}))
