// lib/client-user-utils.ts
'use client'

import { createClient } from '@supabase/supabase-js'
import { useUser } from '@clerk/nextjs'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export interface LCUser {
  id: string
  clerk_user_id: string
  email: string
  name: string | null
  is_premium: boolean | null
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  current_plan: string | null
  payment_id: string | null
  payment_status: string | null
  created_at: string | null
  updated_at: string | null
  leetcode_username: string | null
}

// Custom hook to get current user data from Supabase
export function useCurrentUser() {
  const { user, isLoaded } = useUser()
  
  const getCurrentUser = async (): Promise<LCUser | null> => {
    if (!isLoaded || !user) {
      return null
    }

    const { data, error } = await supabase
      .from('lc_users')
      .select('*')
      .eq('clerk_user_id', user.id)
      .single()

    if (error) {
      console.error('Error fetching user:', error)
      return null
    }

    return data
  }

  const updateUserProfile = async (updates: Partial<LCUser>) => {
    if (!user) {
      throw new Error('User not authenticated')
    }

    const { data, error } = await supabase
      .from('lc_users')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('clerk_user_id', user.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating user:', error)
      throw error
    }

    return data
  }

  const updatePremiumStatus = async (isPremium: boolean, plan?: string) => {
    if (!user) {
      throw new Error('User not authenticated')
    }

    const { data, error } = await supabase
      .from('lc_users')
      .update({
        is_premium: isPremium,
        current_plan: plan || (isPremium ? 'premium' : 'free'),
        updated_at: new Date().toISOString()
      })
      .eq('clerk_user_id', user.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating premium status:', error)
      throw error
    }

    return data
  }

  const updateLeetCodeUsername = async (username: string) => {
    if (!user) {
      throw new Error('User not authenticated')
    }

    const { data, error } = await supabase
      .from('lc_users')
      .update({
        leetcode_username: username,
        updated_at: new Date().toISOString()
      })
      .eq('clerk_user_id', user.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating LeetCode username:', error)
      throw error
    }

    return data
  }

  return {
    user,
    isLoaded,
    getCurrentUser,
    updateUserProfile,
    updatePremiumStatus,
    updateLeetCodeUsername
  }
}