import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from './lib/server';

import { apiRatelimit, ratelimit, strictRatelimit } from './lib/redis';



// Define which routes require premium access (is_main = true)
const isPremiumRoute = createRouteMatcher(["/leetcode/premium(.*)"]);

// Define which routes require any LeetCode access (for general protection)
const isLeetcodeRoute = createRouteMatcher(["/leetcode(.*)"]);
const subscriptionRoute = createRouteMatcher(["/subscription(.*)"]);

// ADDED: Matcher for sensitive API routes that need stricter limiting
const isSensitiveApiRoute = createRouteMatcher(["/api/webhook(.*)", "/api/auth(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth();
  const pathname = req.nextUrl.pathname;

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    ?? req.headers.get("x-real-ip")
    ?? "127.0.0.1";
  const identifier = userId ?? ip;

  // ADDED: Prefix keys to avoid Redis key collisions if Redis is shared across projects
  const leetcodeKey = `lc_page_${identifier}`;
  const apiKey = `lc_api_${identifier}`;
  const strictKey = `lc_strict_${identifier}`;

  // Apply rate limiting to /leetcode routes and all /api routes
  if (isLeetcodeRoute(req) || pathname.startsWith('/api')) {

    // ADDED: Apply strictest limiter to sensitive routes first (webhooks, auth endpoints)
    if (isSensitiveApiRoute(req)) {
      const { success, limit, reset, remaining } = await strictRatelimit.limit(strictKey);
      if (!success) {
        return new NextResponse("Too Many Requests", {
          status: 429,
          headers: {
            "X-Ratelimit-Limit": limit.toString(),
            "X-Ratelimit-Remaining": remaining.toString(),
            "X-Ratelimit-Reset": reset.toString(),
          },
        });
      }
    }
    // ADDED: Apply API-specific limiter for all other /api routes
    else if (pathname.startsWith('/api')) {
      const { success, limit, reset, remaining } = await apiRatelimit.limit(apiKey);
      if (!success) {
        return new NextResponse("Too Many Requests", {
          status: 429,
          headers: {
            "X-Ratelimit-Limit": limit.toString(),
            "X-Ratelimit-Remaining": remaining.toString(),
            "X-Ratelimit-Reset": reset.toString(),
          },
        });
      }
    }
    // Original limiter applies to /leetcode page routes
    else {
      const { success, limit, reset, remaining } = await ratelimit.limit(leetcodeKey);

      if (!success) {
        return new NextResponse("Too Many Requests", {
          status: 429,
          headers: {
            "X-Ratelimit-Limit": limit.toString(),
            "X-Ratelimit-Remaining": remaining.toString(),
            "X-Ratelimit-Reset": reset.toString(),
          },
        });
      }
    }
  }
  // --- RATE LIMITING END ---

  // if(subscriptionRoute(req)) {
  //     if (!userId) {
  //       // If not authenticated, redirect to sign-in
  //       return (await auth()).redirectToSignIn();
  //     }
  //     return NextResponse.redirect(new URL('/', req.url));
  //   }
  // Handle general /leetcode protection first (authentication)
  if (isLeetcodeRoute(req)) {
    if (!userId) {
      // If not authenticated, redirect to sign-in
      return (await auth()).redirectToSignIn();
    }

    // Fetch user data from Supabase for both is_premium AND is_main
    //     try {
    //       const { data: userRecord, error } = await supabaseAdmin
    //         .from('lc_users')
    //         .select('*') // Select both columns
    //         .eq('clerk_user_id', userId)
    //         .single();
    // // console.log(userRecord);

    //       if (error && error.code !== 'PGRST116') { 
    //         console.error("Middleware Supabase fetch error:", error);
    //         return NextResponse.redirect(new URL('/subscription', req.url));
    //       }

    //       if (!userRecord) {
    //         // User record not found in Supabase (e.g., webhook failed, or race condition)
    //         console.warn(`User profile not found in Supabase for Clerk ID: ${userId}. Redirecting to /subscription.`);
    //         return NextResponse.redirect(new URL('/subscription', req.url));
    //       }

    //       // Handle /leetcode/premium specific protection (is_main check)
    //       // if (isPremiumRoute(req)) {
    //       //   if (!userRecord.is_premium) {
    //       //     // console.log(`User ${userId} is not 'main'. Redirecting from premium route to /leetcode.`);
    //       //     return NextResponse.redirect(new URL('/subscription', req.url));
    //       //   }
    //       //   // If is_main is true, allow access to premium route
    //       //   // console.log(`User ${userId} is 'main'. Allowing access to premium route: ${pathname}`);
    //       //   return NextResponse.next();
    //       // }

    //       // Handle /leetcode (non-premium) routes (is_premium check)
    //       // This applies to any /leetcode route that is NOT /leetcode/premium
    //       if (!isPremiumRoute(req)) {
    //         // if (!userRecord.is_premium) {
    //         //   console.log(`User ${userId} is not premium. Redirecting to subscription.`);
    //         //   return NextResponse.redirect(new URL('/subscription', req.url));
    //         // }
    //         // If is_premium is true, allow access to regular leetcode route
    //         // console.log(`User ${userId} is premium. Allowing access to ${pathname}`);
    //         return NextResponse.next();
    //       }

    //     } catch (e) {
    //       console.error("Unexpected error in middleware:", e);
    //       return NextResponse.redirect(new URL('/subscription', req.url));
    //     }
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