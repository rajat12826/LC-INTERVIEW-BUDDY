// src/app/api/daily-leetcode/route.ts
import { NextResponse } from 'next/server';

const DAILY_LEETCODE_QUERY = `
  query dailyChallenge {
    activeDailyCodingChallengeQuestion {
      date
      userStatus
      link
      question {
        questionFrontendId
        title
        titleSlug
        difficulty
        isPaidOnly
        status
        acRate
        solutionNum
        topicTags {
          name
          slug
        }
      }
    }
  }
`;

export async function GET() {
  try {
    const leetcodeApiUrl = 'https://leetcode.com/graphql';

    const response = await fetch(leetcodeApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: DAILY_LEETCODE_QUERY,
      }),
    });
    
    if (!response.ok) {
      console.error(`Error fetching daily LeetCode problem: ${response.status} ${response.statusText}`);
      return NextResponse.json(
        { error: 'Failed to fetch daily LeetCode problem from official API' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data.data.activeDailyCodingChallengeQuestion);
  } catch (error) {
    console.error('Server error fetching daily LeetCode problem:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}