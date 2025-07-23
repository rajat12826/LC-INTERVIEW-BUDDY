// app/api/leetcode-submissions/[username]/route.ts
// This API route fetches a user's recent LeetCode submissions.

import { NextResponse } from 'next/server';

export async function GET(request: Request, { params }: { params: { username: string } }) {
  try {
    const { username } = params;
    if (!username) {
      return NextResponse.json({ error: 'LeetCode username is required' }, { status: 400 });
    }

    // You can adjust the limit as needed, or make it a query parameter
    const leetcodeApiUrl = `https://leetcode-api-pied.vercel.app/user/${username}/submissions?limit=20`;
    const response = await fetch(leetcodeApiUrl);

    if (!response.ok) {
      // If LeetCode API returns an error, pass it through
      const errorData = await response.json();
      return NextResponse.json({ error: errorData.error || `Failed to fetch LeetCode submissions for ${username}` }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error fetching LeetCode submissions:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}