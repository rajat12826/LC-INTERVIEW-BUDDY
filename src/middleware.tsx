import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

import { apiRatelimit, ratelimit, strictRatelimit } from './lib/redis';



// Define which routes require any LeetCode access (for general protection)
const isLeetcodeRoute = createRouteMatcher(["/leetcode(.*)"]);

// Matcher for sensitive API routes that need stricter limiting
const isSensitiveApiRoute = createRouteMatcher(["/api/auth(.*)"]); // Webhooks bypass rate limiting

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
    try {
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
      // ADDED: Apply API-specific limiter for all other /api routes (except webhooks)
      else if (pathname.startsWith('/api') && !pathname.startsWith('/api/webhook')) {
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
    } catch (rateLimitErr) {
      console.warn("Redis rate-limiting failed (failing open):", rateLimitErr);
    }
  }
  // --- RATE LIMITING END ---

  // Handle general /leetcode protection first (authentication)
  if (isLeetcodeRoute(req)) {
    if (!userId) {
      // If not authenticated, redirect to sign-in
      return (await auth()).redirectToSignIn();
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