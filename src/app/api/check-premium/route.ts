// src/app/api/check-premium/route.ts (App Router)
// or src/pages/api/check-premium.ts (Pages Router)

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/server'; // This is where @supabase/supabase-js is imported

/**
 * API Route to check if a user is premium.
 * This route should ONLY be called internally by the middleware or other trusted server-side code.
 */
export async function GET(request: Request) {
  // --- IMPORTANT SECURITY CONSIDERATIONS ---
  // This API route should be protected to ensure only your middleware
  // or other trusted internal services can call it.
  // DO NOT expose this publicly without strong authentication.

  // Method 1: Shared Secret Header (Simple for internal calls)
  const internalSecret = request.headers.get('X-Internal-Secret');
  if (!process.env.INTERNAL_API_SECRET || internalSecret !== process.env.INTERNAL_API_SECRET) {
    console.warn('Unauthorized access attempt to /api/check-premium');
    return new NextResponse('Unauthorized', { status: 401 });
  }
  // --- END SECURITY CONSIDERATIONS ---

  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
  }

  try {
    const { data: userRecord, error } = await supabaseAdmin
      .from('lc_users')
      .select('is_premium')
      .eq('clerk_user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "No rows found"
      console.error("API Supabase fetch error:", error);
      return NextResponse.json({ error: 'Database error occurred' }, { status: 500 });
    }

    // Return true if userRecord exists and is_premium is true, otherwise false
    return NextResponse.json({ isPremium: userRecord?.is_premium || false });

  } catch (e) {
    console.error("Unexpected error in /api/check-premium:", e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
