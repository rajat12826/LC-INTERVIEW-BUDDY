// app/api/leetcode-profile/[username]/route.ts
// This API route fetches a user's LeetCode profile data.

import { NextResponse } from 'next/server';

export async function GET(request: Request, { params }: { params: { username: string } }) {
  try {
    // Await the params object first, then access the username property
    const { username } = await params;

    if (!username) {
      return NextResponse.json({ error: 'LeetCode username is required' }, { status: 400 });
    }

    const leetcodeApiUrl = `https://leetcode-api-pied.vercel.app/user/${username}`;
    const response = await fetch(leetcodeApiUrl);

    if (!response.ok) {
      // If LeetCode API returns an error, pass it through
      const errorData = await response.json();
      return NextResponse.json({ error: errorData.error || `Failed to fetch LeetCode profile for ${username}` }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error fetching LeetCode profile:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}