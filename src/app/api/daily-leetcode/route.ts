// src/app/api/daily-leetcode/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const response = await fetch('https://leetcode-api-pied.vercel.app/daily');
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Error fetching daily LeetCode problem from external API:', errorData);
      return NextResponse.json({ error: errorData.message || 'Failed to fetch daily LeetCode problem' }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Server error fetching daily LeetCode problem:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
