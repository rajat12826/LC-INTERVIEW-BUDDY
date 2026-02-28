import { NextResponse } from "next/server";
import axios, { AxiosError } from "axios";

const LEETCODE_GRAPHQL = "https://leetcode.com/graphql/";

const SUBMISSIONS_QUERY = `
  query recentAcSubmissions($username: String!, $limit: Int!) {
    recentAcSubmissionList(username: $username, limit: $limit) {
      id
      title
      titleSlug
      timestamp
      lang
      runtime
      memory
    }
  }
`;

export async function GET(
  request: Request,
  { params }: { params: { username: string } }
) {
  try {
   
    
    const { username } = await params;
     console.log(username);
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "20", 10);

    if (!username) {
      return NextResponse.json(
        { error: "LeetCode username is required" },
        { status: 400 }
      );
    }

    const { data } = await axios.post(
      LEETCODE_GRAPHQL,
      {
        query: SUBMISSIONS_QUERY,
        variables: { username, limit },
        operationName: "recentAcSubmissions",
      },
      {
        headers: {
          "Content-Type": "application/json",
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Referer: `https://leetcode.com/${username}/`,
          Origin: "https://leetcode.com",
          Accept: "application/json",
          "Accept-Language": "en-US,en;q=0.9",
          "x-csrftoken": "dummy",
          // Cookie: "csrftoken=dummy; LEETCODE_SESSION=",
        },
      }
    );
    console.log(data);
    

    const submissions = data?.data?.recentAcSubmissionList;

    if (!Array.isArray(submissions) || submissions.length === 0) {
      return NextResponse.json(
        { error: `No submissions found for '${username}'` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      username,
      count: submissions.length,
      submissions,
    });
  } catch (err) {
    console.error("Submissions fetch error:", err);
    const status =
      err instanceof AxiosError ? (err.response?.status ?? 500) : 500;
    return NextResponse.json(
      { error: "Internal server error" },
      { status }
    );
  }
}