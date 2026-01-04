import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: { username: string } }
) {
  try {
    const { username } = params;

    if (!username) {
      return NextResponse.json(
        { error: "LeetCode username is required" },
        { status: 400 }
      );
    }

    const apiUrl = `https://leetcode-api-pied.vercel.app/user/${username}`;

    const res = await fetch(apiUrl, {
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: "Failed to fetch LeetCode profile" },
        { status: res.status }
      );
    }

    const data = await res.json();

    // If API returns null / invalid user
    if (!data?.username) {
      return NextResponse.json(
        { error: `LeetCode user '${username}' not found` },
        { status: 404 }
      );
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error("Error fetching LeetCode data:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
