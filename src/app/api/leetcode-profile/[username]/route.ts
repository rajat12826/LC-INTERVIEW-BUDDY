import { NextResponse } from "next/server";
import axios, { AxiosError } from "axios";

const LEETCODE_GRAPHQL = "https://leetcode.com/graphql/";

const PROFILE_QUERY = `
  query getUserProfile($username: String!) {
    matchedUser(username: $username) {
      username
      submitStats: submitStatsGlobal {
        acSubmissionNum {
          difficulty
          count
          submissions
        }
      }
      profile {
        realName
        userAvatar
        birthday
        ranking
        reputation
        starRating
        aboutMe
        school
        websites
        countryName
        company
        jobTitle
        skillTags
        postViewCount
        solutionCount
      }
      badges {
        id
        displayName
        icon
        creationDate
      }
      upcomingBadges {
        name
        icon
      }
      activeBadge {
        id
        displayName
        icon
        creationDate
      }
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
        { error: "LeetCode username is required" },
        { status: 400 }
      );
    }

    const { data } = await axios.post(
      LEETCODE_GRAPHQL,
      {
        query: PROFILE_QUERY,
        variables: { username },
        operationName: "getUserProfile",
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
          Cookie: "csrftoken=dummy; LEETCODE_SESSION=",
        },
      }
    );

    const user = data?.data?.matchedUser;

    if (!user) {
      return NextResponse.json(
        { error: `LeetCode user '${username}' not found` },
        { status: 404 }
      );
    }

    return NextResponse.json(user);
  } catch (err) {
    console.error("Error fetching LeetCode profile:", err);
    const status =
      err instanceof AxiosError ? (err.response?.status ?? 500) : 500;
    return NextResponse.json(
      { error: "Internal server error" },
      { status }
    );
  }
}