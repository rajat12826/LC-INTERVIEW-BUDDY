import { NextResponse } from "next/server";
import axios, { AxiosError } from "axios";

const LEETCODE_GRAPHQL = "https://leetcode.com/graphql/";

const CORE_QUERY = `
  query userProfileAndStats($username: String!) {
    allQuestionsCount {
      difficulty
      count
    }
    matchedUser(username: $username) {
      username
      profile {
        realName
        ranking
        userAvatar
        reputation
        starRating
        aboutMe
        school
        websites
        countryName
        company
        jobTitle
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
      submitStats: submitStatsGlobal {
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

const CALENDAR_QUERY = `
  query userProfileCalendar($username: String!) {
    matchedUser(username: $username) {
      submissionCalendar
    }
  }
`;

const CONTEST_QUERY = `
  query userContest($username: String!) {
    userContestRanking(username: $username) {
      attendedContestsCount
      rating
      globalRanking
      totalParticipants
      topPercentage
    }
  }
`;

async function fetchGraphQL(query: string, variables: any, username: string) {
  const { data } = await axios.post(
    LEETCODE_GRAPHQL,
    { query, variables },
    {
      headers: {
        "Content-Type": "application/json",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Referer: `https://leetcode.com/${username}/`,
        Origin: "https://leetcode.com",
        Accept: "application/json",
      },
    }
  );
  return data;
}

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

    const coreData = await fetchGraphQL(CORE_QUERY, { username }, username);

    const user = coreData?.data?.matchedUser;
    if (!user) {
      return NextResponse.json(
        { error: `LeetCode user '${username}' not found` },
        { status: 404 }
      );
    }

    // Fetch enrichments in parallel
    const [calendarRes, contestRes] = await Promise.allSettled([
      fetchGraphQL(CALENDAR_QUERY, { username }, username),
      fetchGraphQL(CONTEST_QUERY, { username }, username)
    ]);

    let submissionCalendar = null;
    if (calendarRes.status === "fulfilled" && calendarRes.value?.data?.matchedUser?.submissionCalendar) {
      try {
        submissionCalendar = JSON.parse(calendarRes.value.data.matchedUser.submissionCalendar);
      } catch (e) {
        submissionCalendar = null;
      }
    }

    let contestRanking = null;
    if (contestRes.status === "fulfilled") {
      contestRanking = contestRes.value?.data?.userContestRanking ?? null;
    }

    return NextResponse.json({
      username: user.username,
      profile: user.profile,
      badges: user.badges,
      upcomingBadges: user.upcomingBadges,
      activeBadge: user.activeBadge,
      submitStats: user.submitStats,
      allQuestionsCount: coreData.data.allQuestionsCount,
      enrichment: {
        submissionCalendar,
        contestRanking
      }
    });
  } catch (err) {
    console.error("Error fetching LeetCode profile:", err);
    const status = err instanceof AxiosError ? (err.response?.status ?? 500) : 500;
    return NextResponse.json(
      { error: "Internal server error" },
      { status }
    );
  }
}