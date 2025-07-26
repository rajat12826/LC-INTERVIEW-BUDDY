import { create } from 'zustand'

type FilterState = {
  search: string
  difficulty: string
  
  solved: 'all' | 'solved' | 'unsolved'
  setSearch: (search: string) => void
  setDifficulty: (difficulty: string) => void
 
  setSolved: (solved: 'all' | 'solved' | 'unsolved') => void
  clearAll: () => void
}

export const useChallengeFilterStoreP = create<FilterState>((set) => ({
  search: '',
  difficulty: '',
  category: '',
  companies: [],
  topics: [],
  solved: 'all',
  setSearch: (search) => set({ search }),
  setDifficulty: (difficulty) => set({ difficulty }),
 
  setSolved: (solved) => set({ solved }),
  clearAll: () =>
    set({
      search: '',
      difficulty: '',
    
      solved: 'all',
    }),
}))
