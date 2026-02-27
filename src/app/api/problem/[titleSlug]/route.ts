// app/api/leetcode/problem/[titleSlug]/route.ts
import { NextResponse } from "next/server";
import axios, { AxiosError } from "axios";

export async function GET(
  request: Request,
  { params }: { params: { titleSlug: string } }
) {
  try {
    const { titleSlug } = await params;

    if (!titleSlug) {
      return NextResponse.json(
        { error: "Problem titleSlug is required" },
        { status: 400 }
      );
    }

    const { data: problem } = await axios.get(
      `https://leetcode-api-pied.vercel.app/problem/${titleSlug}`
    );

    if (!problem || Object.keys(problem).length === 0) {
      return NextResponse.json(
        { error: `Problem '${titleSlug}' not found` },
        { status: 404 }
      );
    }

    // Return the problem details to frontend
    return NextResponse.json({ titleSlug, problem });
  } catch (err) {
    console.error("Problem fetch error:", err);
    const status = err instanceof AxiosError ? (err.response?.status ?? 500) : 500;
    return NextResponse.json(
      { error: "Internal server error" },
      { status }
    );
  }
}