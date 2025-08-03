export interface LeetCodeProfile {
  realName: string | null;
  websites: string[];
  countryName: string | null;
  company: string | null;
  school: string | null;
  aboutMe: string;
  reputation: number;
  ranking: number;
}

export interface SubmissionStats {
  difficulty: string;
  count: number;
  submissions: number;
}

export interface LeetCodeSubmitStats {
  acSubmissionNum: SubmissionStats[];
  totalSubmissionNum: SubmissionStats[];
}

export interface LeetCodeUserData {
  username: string;
  profile: LeetCodeProfile;
  submitStats: LeetCodeSubmitStats;
}

export interface RecentSubmission {
  id: string;
  title: string;
  titleSlug: string;
  timestamp: string;
  statusDisplay: string;
  lang: string;
}

// app/api/leetcode/[username]/route.ts
// Complete API route that fetches user profile, stats, and recent submissions

import { NextResponse } from 'next/server';

// GraphQL query for user profile and statistics
const LEETCODE_USER_PROFILE_QUERY = `
  query userProfile($username: String!) {
    matchedUser(username: $username) {
      username
      profile {
        realName
        websites
        countryName
        company
        school
        aboutMe
        reputation
        ranking
      }
      submitStats {
        acSubmissionNum {
          difficulty
          count
          submissions
        }
        totalSubmissionNum {
          difficulty
          count
          submissions
        }
      }
    }
  }
`;

// GraphQL query for recent submissions
const LEETCODE_SUBMISSIONS_QUERY = `
  query recentSubmissions($username: String!, $limit: Int!) {
    recentAcSubmissionList(username: $username, limit: $limit) {
      id
      title
      titleSlug
      timestamp
      statusDisplay
      lang
    }
  }
`;

export async function GET(
  request: Request, 
  { params }: { params: { username: string } }
) {
  try {
    const { username } = await params;

    if (!username) {
      return NextResponse.json(
        { error: 'LeetCode username is required' }, 
        { status: 400 }
      );
    }

    const leetcodeApiUrl = 'https://leetcode.com/graphql';
    
    // Fetch user profile and statistics
    const profileResponse = await fetch(leetcodeApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (compatible; LeetCodeAPI/1.0)',
      },
      body: JSON.stringify({
        query: LEETCODE_USER_PROFILE_QUERY,
        variables: { username },
      }),
    });

    if (!profileResponse.ok) {
      console.error(`Error fetching profile: ${profileResponse.status}`);
      return NextResponse.json(
        { error: `Failed to fetch LeetCode profile for ${username}` }, 
        { status: profileResponse.status }
      );
    }

    const profileData = await profileResponse.json();

    // Check if user exists
    if (!profileData.data?.matchedUser) {
      return NextResponse.json(
        { error: `LeetCode user '${username}' not found` }, 
        { status: 404 }
      );
    }

    // Fetch recent submissions (optional - can be separate endpoint)
    const submissionsResponse = await fetch(leetcodeApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (compatible; LeetCodeAPI/1.0)',
      },
      body: JSON.stringify({
        query: LEETCODE_SUBMISSIONS_QUERY,
        variables: { username, limit: 20 },
      }),
    });

    let recentSubmissions = [];
    if (submissionsResponse.ok) {
      const submissionsData = await submissionsResponse.json();
      recentSubmissions = submissionsData.data?.recentAcSubmissionList || [];
    }

    // Combine the data according to your schema
    const userData = {
      username: profileData.data.matchedUser.username,
      profile: profileData.data.matchedUser.profile,
      submitStats: profileData.data.matchedUser.submitStats,
      recentSubmissions, // Additional field for recent submissions
    };

    return NextResponse.json(userData);

  } catch (error: any) {
    console.error('Error fetching LeetCode data:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}