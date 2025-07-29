// lib/supabase.ts
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { Database } from '@/utils/types'; // Assuming you generated this with 'supabase gen types'

const supabaseUrl: string | undefined = process.env.NEXT_PUBLIC_SUPABASE_URL;
// CHANGE THIS LINE: Use SUPABASE_SERVICE_ROLE_KEY for server-side operations
const supabaseServiceRoleKey: string | undefined = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  // Use specific error messages to debug missing environment variables
  throw new Error(
    'Missing Supabase URL or Service Role Key environment variables. ' +
    'Ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.'
  );
}

// Ensure the client is strongly typed with your Database schema
// The 'public' schema is specified as the second generic argument
export const supabase: SupabaseClient<Database, 'public'> = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    persistSession: false, // Essential for serverless functions
  },
});