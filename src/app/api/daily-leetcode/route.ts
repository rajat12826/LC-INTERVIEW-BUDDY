// src/app/api/daily-leetcode/route.ts
import { NextResponse } from 'next/server';
import axios, { AxiosError } from 'axios';

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
    const { data } = await axios.post(
      'https://leetcode.com/graphql',
      { query: DAILY_LEETCODE_QUERY },
      {
        headers: {
          'Content-Type': 'application/json',
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Referer: 'https://leetcode.com/problemset/',
          Origin: 'https://leetcode.com',
          Accept: 'application/json',
        },
      }
    );

    return NextResponse.json(data.data.activeDailyCodingChallengeQuestion);
  } catch (err) {
    console.error('Server error fetching daily LeetCode problem:', err);
    const status = err instanceof AxiosError ? (err.response?.status ?? 500) : 500;
    return NextResponse.json(
      { error: 'Failed to fetch daily LeetCode problem from official API' },
      { status }
    );
  }
}