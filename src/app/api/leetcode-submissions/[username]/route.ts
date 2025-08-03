import { NextResponse } from 'next/server';

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
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');

    if (!username) {
      return NextResponse.json(
        { error: 'LeetCode username is required' }, 
        { status: 400 }
      );
    }

    const leetcodeApiUrl = 'https://leetcode.com/graphql';

    const response = await fetch(leetcodeApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (compatible; LeetCodeAPI/1.0)',
      },
      body: JSON.stringify({
        query: LEETCODE_SUBMISSIONS_QUERY,
        variables: { username, limit },
      }),
    });

    if (!response.ok) {
      console.error(`Error fetching submissions: ${response.status}`);
      return NextResponse.json(
        { error: `Failed to fetch LeetCode submissions for ${username}` }, 
        { status: response.status }
      );
    }

    const data = await response.json();

    if (!data.data?.recentAcSubmissionList) {
      return NextResponse.json(
        { error: `No submissions found for user '${username}'` }, 
        { status: 404 }
      );
    }

    return NextResponse.json({
      username,
      submissions: data.data.recentAcSubmissionList,
      count: data.data.recentAcSubmissionList.length
    });

  } catch (error: any) {
    console.error('Error fetching LeetCode submissions:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}