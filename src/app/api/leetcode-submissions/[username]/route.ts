import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: { username: string } }
) {
  try {
    const { username } = params;
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get("limit") || "20";

    if (!username) {
      return NextResponse.json(
        { error: "LeetCode username is required" },
        { status: 400 }
      );
    }

    const apiUrl = `https://leetcode-api-pied.vercel.app/user/${username}/submissions?limit=${limit}`;

    const res = await fetch(apiUrl, {
      cache: "no-store",
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `Failed to fetch submissions for ${username}` },
        { status: res.status }
      );
    }

    const submissions = await res.json();

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
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
