// utils/premiumStatusChecker.ts
import { supabase } from '@/lib/supabase';

export async function checkAndRefreshPremiumStatus(clerkUserId: string, email: string) {
  try {
    console.log(`Checking premium status for: ${clerkUserId}, ${email}`);
    
    // First try to find by clerk_user_id
    let { data: user, error } = await supabase
      .from('lc_users')
      .select('is_premium, email, clerk_user_id')
      .eq('clerk_user_id', clerkUserId)
      .single();

    // If not found by clerk_user_id, try by email
    if (error && error.code === 'PGRST116') {
      console.log('User not found by clerk_user_id, trying email...');
      const normalizedEmail = email.toLowerCase().trim();
      
      const { data: userByEmail, error: emailError } = await supabase
        .from('lc_users')
        .select('is_premium, email, clerk_user_id')
        .eq('email', normalizedEmail)
        .single();
        
      if (emailError && emailError.code === 'PGRST116') {
        // Try case-insensitive search
        const { data: userByIlike, error: ilikeError } = await supabase
          .from('lc_users')
          .select('is_premium, email, clerk_user_id')
          .ilike('email', normalizedEmail)
          .single();
          
        user = userByIlike;
        error = ilikeError;
      } else {
        user = userByEmail;
        error = emailError;
      }
    }

    if (error) {
      console.error('Error fetching user:', error);
      return false;
    }

    console.log('Found user:', user);
    return user?.is_premium || false;
  } catch (err) {
    console.error('Unexpected error checking premium status:', err);
    return false;
  }
}

// Hook for checking premium status with refresh capability
import { useState, useEffect, useCallback } from 'react';
import { useUser } from '@clerk/nextjs';

export function usePremiumStatus() {
  const { user, isLoaded } = useUser();
  const [isPremium, setIsPremium] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshPremiumStatus = useCallback(async () => {
    if (!user || !isLoaded) return;
    
    setLoading(true);
    const clerkUserId = user.id;
    const email = user.emailAddresses[0]?.emailAddress;
    
    if (email) {
      const premiumStatus = await checkAndRefreshPremiumStatus(clerkUserId, email);
      setIsPremium(premiumStatus);
    }
    setLoading(false);
  }, [user, isLoaded]);

  useEffect(() => {
    if (isLoaded) {
      refreshPremiumStatus();
    }
  }, [isLoaded, refreshPremiumStatus]);

  return { isPremium, loading, refreshPremiumStatus };
}