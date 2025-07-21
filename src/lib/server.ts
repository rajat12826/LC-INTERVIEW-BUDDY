// src/lib/server.ts
import { createClient } from '@supabase/supabase-js';

// Ensure these environment variables are set in your .env.local and deployment environment
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
// IMPORTANT: Use the correct environment variable name for your Supabase Service Role Key
// Based on your login API, it seems to be `NEXT_SUPABSE_SERVICEROLEKEY`.
// I recommend changing it to `SUPABASE_SERVICE_ROLE_KEY` for consistency and clarity,
// but I will use the one you provided for now.
const supabaseServiceRoleKey = process.env.NEXT_SUPABSE_SERVICEROLEKEY!; 

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});