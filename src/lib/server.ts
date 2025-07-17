// src/lib/server.ts
import { createClient } from '@supabase/supabase-js';

// Ensure these environment variables are set in your .env.local and deployment environment
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
// IMPORTANT: Use the correct environment variable name for your Supabase Service Role Key


const supabaseServiceRoleKey = process.env.NEXT_SUPABSE_SERVICEROLEKEY!; 

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});