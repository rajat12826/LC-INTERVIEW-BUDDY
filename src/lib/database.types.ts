export interface Database {
    public: {
      Tables: {
        profiles: {
          Row: {
            id: string
            username: string | null
            full_name: string | null
            avatar_url: string | null
            created_at: string
            updated_at: string
          }
          Insert: {
            id: string
            username?: string | null
            full_name?: string | null
            avatar_url?: string | null
            created_at?: string
            updated_at?: string
          }
          Update: {
            id?: string
            username?: string | null
            full_name?: string | null
            avatar_url?: string | null
            created_at?: string
            updated_at?: string
          }
        }
        challenges: {
          Row: {
            id: string
            title: string
            description: string
            difficulty: 'beginner' | 'intermediate' | 'advanced'
            category: string
            tags: string[]
            starter_code: string
            solution_code: string
            test_cases: any[]
            created_by: string | null
            created_at: string
            updated_at: string
          }
          Insert: {
            id?: string
            title: string
            description: string
            difficulty: 'beginner' | 'intermediate' | 'advanced'
            category: string
            tags?: string[]
            starter_code: string
            solution_code: string
            test_cases?: any[]
            created_by?: string | null
            created_at?: string
            updated_at?: string
          }
          Update: {
            id?: string
            title?: string
            description?: string
            difficulty?: 'beginner' | 'intermediate' | 'advanced'
            category?: string
            tags?: string[]
            starter_code?: string
            solution_code?: string
            test_cases?: any[]
            created_by?: string | null
            created_at?: string
            updated_at?: string
          }
        }
        submissions: {
          Row: {
            id: string
            challenge_id: string
            user_id: string
            code: string
            status: 'pending' | 'passed' | 'failed'
            test_results: any[]
            submitted_at: string
          }
          Insert: {
            id?: string
            challenge_id: string
            user_id: string
            code: string
            status?: 'pending' | 'passed' | 'failed'
            test_results?: any[]
            submitted_at?: string
          }
          Update: {
            id?: string
            challenge_id?: string
            user_id?: string
            code?: string
            status?: 'pending' | 'passed' | 'failed'
            test_results?: any[]
            submitted_at?: string
          }
        }
        user_progress: {
          Row: {
            id: string
            user_id: string
            challenge_id: string
            completed: boolean
            completed_at: string | null
            attempts: number
          }
          Insert: {
            id?: string
            user_id: string
            challenge_id: string
            completed?: boolean
            completed_at?: string | null
            attempts?: number
          }
          Update: {
            id?: string
            user_id?: string
            challenge_id?: string
            completed?: boolean
            completed_at?: string | null
            attempts?: number
          }
        }
      }
    }
  }