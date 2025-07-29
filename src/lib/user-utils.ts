// lib/user-utils.ts
import { createClient } from '@supabase/supabase-js'
import { currentUser } from '@clerk/nextjs/server'

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

// Get current user data from Supabase
export async function getCurrentUser(): Promise<LCUser | null> {
  const user = await currentUser()
  
  if (!user) {
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

// Update user profile
export async function updateUserProfile(updates: Partial<LCUser>) {
  const user = await currentUser()
  
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

// Update user's premium status
export async function updatePremiumStatus(isPremium: boolean, plan?: string) {
  const user = await currentUser()
  
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

// Update LeetCode username
export async function updateLeetCodeUsername(username: string) {
  const user = await currentUser()
  
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

// Update Stripe information
export async function updateStripeInfo(
  customerId?: string,
  subscriptionId?: string,
  paymentId?: string,
  paymentStatus?: string
) {
  const user = await currentUser()
  
  if (!user) {
    throw new Error('User not authenticated')
  }

  const updates: any = {
    updated_at: new Date().toISOString()
  }

  if (customerId !== undefined) updates.stripe_customer_id = customerId
  if (subscriptionId !== undefined) updates.stripe_subscription_id = subscriptionId
  if (paymentId !== undefined) updates.payment_id = paymentId
  if (paymentStatus !== undefined) updates.payment_status = paymentStatus

  const { data, error } = await supabase
    .from('lc_users')
    .update(updates)
    .eq('clerk_user_id', user.id)
    .select()
    .single()

  if (error) {
    console.error('Error updating Stripe info:', error)
    throw error
  }

  return data
}