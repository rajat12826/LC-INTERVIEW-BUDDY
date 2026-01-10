// app/api/leetcode/problem/[titleSlug]/route.ts
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: { titleSlug: string } }
) {
  try {
    const { titleSlug } = params;

    if (!titleSlug) {
      return NextResponse.json(
        { error: "Problem titleSlug is required" },
        { status: 400 }
      );
    }

    const apiUrl = `https://leetcode-api-pied.vercel.app/problem/${titleSlug}`;

    // Server-side fetch avoids CORS issues
    const res = await fetch(apiUrl, {
      cache: "no-store",
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `Failed to fetch problem '${titleSlug}'` },
        { status: res.status }
      );
    }

    const problem = await res.json();

    if (!problem || Object.keys(problem).length === 0) {
      return NextResponse.json(
        { error: `Problem '${titleSlug}' not found` },
        { status: 404 }
      );
    }

    // Return the problem details to frontend
    return NextResponse.json({
      titleSlug,
      problem,
    });
  } catch (err) {
    console.error("Problem fetch error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
