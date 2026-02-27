// app/api/leetcode/similar/[titleSlug]/route.ts

import { NextResponse } from "next/server";
import axios, { AxiosError } from "axios";

// In-memory cache (use Redis for production)
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 1000 * 60 * 60 * 24; // 24 hours

interface GraphQLResponse {
  data: {
    question: {
      questionId: string;
      questionFrontendId: string;
      title: string;
      titleSlug: string;
      difficulty: string;
      likes: number;
      dislikes: number;
      similarQuestions: string;
      topicTags: Array<{ name: string; slug: string }>;
      stats: string;
    };
  };
}

// Optimized: Fetch only ONE problem at a time
async function getProblem(titleSlug: string): Promise<any> {
  // Check cache first
  const cached = cache.get(titleSlug);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }

  const query = `
    query questionData($titleSlug: String!) {
      question(titleSlug: $titleSlug) {
        questionId
        questionFrontendId
        title
        titleSlug
        difficulty
        likes
        dislikes
        similarQuestions
        topicTags {
          name
          slug
        }
        stats
      }
    }
  `;

  const { data } = await axios.post<GraphQLResponse>(
    "https://leetcode.com/graphql/",
    {
      query,
      variables: { titleSlug },
      operationName: "questionData",
    },
    {
      headers: {
        "Content-Type": "application/json",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Referer: `https://leetcode.com/problems/${titleSlug}/`,
        Origin: "https://leetcode.com",
        Accept: "application/json",
        "Accept-Language": "en-US,en;q=0.9",
        "x-csrftoken": "dummy",
        Cookie: "csrftoken=dummy; LEETCODE_SESSION=",
      },
    }
  );

  if (!data.data?.question) {
    throw new Error(`Problem not found: ${titleSlug}`);
  }

  const problem = data.data.question;

  // Cache the result
  cache.set(titleSlug, {
    data: problem,
    timestamp: Date.now(),
  });

  return problem;
}

// Parse similar questions from JSON string
function parseSimilarQuestions(
  problem: any
): Array<{ titleSlug: string; title: string; difficulty: string }> {
  try {
    const similar = problem.similarQuestions
      ? JSON.parse(problem.similarQuestions)
      : [];
    return similar;
  } catch {
    return [];
  }
}

export async function GET(
  request: Request,
  { params }: { params: { titleSlug: string } }
) {
  try {
    const { titleSlug } = await params;
    const { searchParams } = new URL(request.url);
    const depth = parseInt(searchParams.get("depth") || "1", 10);

    if (!titleSlug) {
      return NextResponse.json(
        { error: "Problem titleSlug is required" },
        { status: 400 }
      );
    }

    // OPTIMIZATION 1: Only depth 1 by default (no expensive BFS)
    if (depth > 1) {
      return NextResponse.json(
        {
          error:
            "Deep search (depth > 1) is disabled for performance. Use depth=1 for fast results.",
          suggestion:
            "Fetch depth 1, then lazy-load individual similar problems on demand",
        },
        { status: 400 }
      );
    }

    // OPTIMIZATION 2: Fetch ONLY the main problem
    const mainProblem = await getProblem(titleSlug);
    const similarList = parseSimilarQuestions(mainProblem);

    // OPTIMIZATION 3: Return immediately with titleSlugs
    // Frontend can lazy-load details when user expands
    const response = {
      titleSlug,
      depth,
      problem: {
        ...mainProblem,
        // Return ONLY the list of similar titleSlugs, not full details
        similarProblems: similarList.map((s) => ({
          titleSlug: s.titleSlug,
          title: s.title,
          difficulty: s.difficulty,
          // Mark as not loaded yet
          _needsDetails: true,
        })),
      },
      // Provide endpoint for lazy loading
      lazyLoadEndpoint: `/api/leetcode/problem/{titleSlug}`,
    };

    return NextResponse.json(response);
  } catch (err: any) {
    console.error("Similar problems fetch error:", err);
    // Axios wraps HTTP errors — extract the real status if available
    const status = err instanceof AxiosError ? (err.response?.status ?? 500) : 500;
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status }
    );
  }
}

// Optional: Separate endpoint for loading individual problem details
// GET /api/leetcode/problem/[titleSlug]
// This way, frontend can lazy-load when user expands a similar problem