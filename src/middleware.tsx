// middleware.ts
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from './lib/server';

// Define which routes require premium access (is_main = true)
const isPremiumRoute = createRouteMatcher(["/leetcode/premium(.*)"]);

// Define which routes require any LeetCode access (for general protection)
const isLeetcodeRoute = createRouteMatcher(["/leetcode(.*)"]); 

export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth(); // Use await here for consistency
  const pathname = req.nextUrl.pathname;

  // Handle general /leetcode protection first (authentication)
  if (isLeetcodeRoute(req)) {
    if (!userId) {
      // If not authenticated, redirect to sign-in
      return (await auth()).redirectToSignIn();
    }

    // Fetch user data from Supabase for both is_premium AND is_main
    try {
      const { data: userRecord, error } = await supabaseAdmin
        .from('lc_users')
        .select('*') // Select both columns
        .eq('clerk_user_id', userId)
        .single();
// console.log(userRecord);

      if (error && error.code !== 'PGRST116') { 
        console.error("Middleware Supabase fetch error:", error);
        return NextResponse.redirect(new URL('/subscription', req.url));
      }

      if (!userRecord) {
        // User record not found in Supabase (e.g., webhook failed, or race condition)
        console.warn(`User profile not found in Supabase for Clerk ID: ${userId}. Redirecting to /subscription.`);
        return NextResponse.redirect(new URL('/subscription', req.url));
      }

      // Handle /leetcode/premium specific protection (is_main check)
      if (isPremiumRoute(req)) {
        if (!userRecord.is_premium) {
          // console.log(`User ${userId} is not 'main'. Redirecting from premium route to /leetcode.`);
          return NextResponse.redirect(new URL('/subscription', req.url));
        }
        // If is_main is true, allow access to premium route
        // console.log(`User ${userId} is 'main'. Allowing access to premium route: ${pathname}`);
        return NextResponse.next();
      }

      // Handle /leetcode (non-premium) routes (is_premium check)
      // This applies to any /leetcode route that is NOT /leetcode/premium
      if (!isPremiumRoute(req)) {
        // if (!userRecord.is_premium) {
        //   console.log(`User ${userId} is not premium. Redirecting to subscription.`);
        //   return NextResponse.redirect(new URL('/subscription', req.url));
        // }
        // If is_premium is true, allow access to regular leetcode route
        // console.log(`User ${userId} is premium. Allowing access to ${pathname}`);
        return NextResponse.next();
      }

    } catch (e) {
      console.error("Unexpected error in middleware:", e);
      return NextResponse.redirect(new URL('/subscription', req.url));
    }
  }

  // Allow access to other routes that are not protected by this middleware
  return NextResponse.next();
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};