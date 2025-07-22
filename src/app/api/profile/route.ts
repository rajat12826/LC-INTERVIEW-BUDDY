// app/api/profile/route.ts
// This API route handles updating a user's profile information in Supabase.

import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server'; // To get Clerk user ID
import { supabaseAdmin } from '@/lib/server'; // Your Supabase admin client

export async function POST(req: Request) {
  try {
    // Authenticate the user using Clerk
    const clerkUser = await currentUser();
    if (!clerkUser || !clerkUser.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, leetcodeUsername } = await req.json();

    // Prepare update data, only include fields that are provided
    const updateData: { name?: string; leetcode_username?: string } = {};
    if (name !== undefined) {
      updateData.name = name;
    }
    if (leetcodeUsername !== undefined) {
      updateData.leetcode_username = leetcodeUsername;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ message: 'No data provided for update.' }, { status: 200 });
    }

    // Update the user's profile in Supabase
    const { data, error } = await supabaseAdmin
      .from('lc_users') // Your user table
      .update(updateData)
      .eq('clerk_user_id', clerkUser.id)
      .select() // Select the updated row to return it
      .single();

    if (error) {
      console.error('Supabase error updating user profile:', error);
      return NextResponse.json({ error: 'Failed to update profile.' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Profile updated successfully', user: data });
  } catch (error: any) {
    console.error('Error in profile update API:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

// You might also want a GET method to fetch the current profile data
export async function GET() {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser || !clerkUser.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: userProfile, error } = await supabaseAdmin
      .from('lc_users') // Your user table
      .select('name, email, is_premium, leetcode_username, current_plan, payment_id, payment_status') // Corrected selected columns
      .eq('clerk_user_id', clerkUser.id)
      .single();

    if (error) {
      console.error('Supabase error fetching user profile:', error);
      // If user profile not found, it might be a new user, return default data
      if (error.code === 'PGRST116') { // No rows found
        return NextResponse.json({
          name: clerkUser.firstName || clerkUser.emailAddresses[0].emailAddress,
          email: clerkUser.emailAddresses[0].emailAddress,
          is_premium: false,
          leetcode_username: null,
          current_plan: null,
          payment_id: null, // Default for new user
          payment_status: null, // Default for new user
        });
      }
      return NextResponse.json({ error: 'Failed to fetch profile.' }, { status: 500 });
    }

    return NextResponse.json(userProfile);
  } catch (error: any) {
    console.error('Error in profile GET API:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
