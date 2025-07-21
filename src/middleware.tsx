import { clerkMiddleware, createRouteMatcher, auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { supabaseAdmin } from './lib/server';

// Define protected routes
const isProtectedRoute = createRouteMatcher(["/questions(.*)"]);

// Initialize Supabase Admin client for use in middleware


export default clerkMiddleware(async (auth, req) => {
  // Get the current authentication state from Clerk
  const { userId } = await auth();
  
  // Protect the route only if it matches the protected pattern
  if (isProtectedRoute(req)) {
    // If user is not authenticated, redirect to sign-in
    if (!userId) {
      const authResult = await auth();
      return authResult.redirectToSignIn();
    }
    
    // If user is authenticated, check their premium status in Supabase
    try {
      // Fetch user's premium status from lc_users table using their Clerk user ID
      const { data: userRecord, error } = await supabaseAdmin
        .from('lc_users')
        .select('is_premium')
        .eq('clerk_user_id', userId)
        .single();
      
      if (error && error.code !== 'PGRST116') { // PGRST116 means "no rows found"
        console.error("Middleware Supabase fetch error:", error);
        return NextResponse.redirect(new URL('/subscription', req.url));
      }
      
      // If user record is not found or they are not premium, redirect to subscription page
      if (!userRecord || !userRecord.is_premium) {
        console.log(`User ${userId} is not premium. Redirecting to subscription.`);
        return NextResponse.redirect(new URL('/subscription', req.url));
      }
      
      // If user is premium, allow them to proceed
      console.log(`User ${userId} is premium. Allowing access to ${req.nextUrl.pathname}`);
      return NextResponse.next();
      
    } catch (e) {
      console.error("Unexpected error in middleware premium check:", e);
      return NextResponse.redirect(new URL('/subscription', req.url));
    }
  }
  
  // For non-protected routes, allow access
  return NextResponse.next();
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};