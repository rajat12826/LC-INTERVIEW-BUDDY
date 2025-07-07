import { clerkMiddleware, createRouteMatcher, auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { supabaseAdmin } from './lib/server';


const isProtectedRoute = createRouteMatcher(["/questions(.*)"]);




export default clerkMiddleware(async (auth, req) => {
  
  const { userId } = await auth();
  
  
  if (isProtectedRoute(req)) {
  
    if (!userId) {
      const authResult = await auth();
      return authResult.redirectToSignIn();
    }
    
    try {
     
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
  

  return NextResponse.next();
});

export const config = {
  matcher: [
   
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
  
    '/(api|trpc)(.*)',
  ],
};