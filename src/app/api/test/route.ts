import { createClerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  // Initialize Clerk client explicitly within the function for this test,
  // ensuring it has access to environment variables.
  const clerkClient = createClerkClient({
    secretKey: process.env.CLERK_SECRET_KEY,
  });

  console.log("CLERK_SECRET_KEY (for test API debug):", process.env.CLERK_SECRET_KEY ? "SET" : "NOT SET");
  console.log("Clerk Client initialized in test API:", clerkClient);

  const testEmail = "pariharrajat078@gmail.com"; // Use the problematic email for testing
  console.log(`Attempting to find Clerk user for email: ${testEmail}`);

  try {
    const response = await clerkClient.users.getUserList({ // Renamed to 'response' to avoid confusion
      emailAddress: [testEmail]
    });

    // --- Added Debugging Logs ---
    console.log("Clerk getUserList response (full object):", response); // Log the full response object
    console.log("Clerk users array length (response.data.length):", response.data.length); // Correctly access length
    console.log("Clerk users found by email in test API (response.data):", response.data); // Correctly access the data array
    // --------------------------

    if (response.data.length === 0) { // Check length on response.data
      console.warn(`Clerk user not found with email: ${testEmail} in test API.`);
      return NextResponse.json({
        message: `Clerk user not found for email: ${testEmail}`,
        found: false,
        clerkUsers: []
      }, { status: 200 });
    }

    const clerkUser = response.data[0]; // Access the first user from the 'data' array
    console.log("First Clerk user object from array in test API:", clerkUser); // Log the first element

    if (!clerkUser || !clerkUser.id) {
        console.error(`Unexpected: response.data[0] or its ID is undefined/null for email: ${testEmail} in test API.`);
        return NextResponse.json({
            message: "Clerk user object is invalid after fetching from getUserList in test API.",
            found: false,
            clerkUser: clerkUser // Return the problematic object for inspection
        }, { status: 500 });
    }

    console.log(`Found Clerk user ID in test API: ${clerkUser.id}`);

    return NextResponse.json({
      message: `Clerk user found for email: ${testEmail}`,
      found: true,
      clerkUser: {
        id: clerkUser.id,
        email: clerkUser.emailAddresses[0]?.emailAddress,
        firstName: clerkUser.firstName,
        lastName: clerkUser.lastName
      }
    }, { status: 200 });

  } catch (error) {
    console.error("Error in test API while fetching Clerk user:", error);
    return NextResponse.json({
      message: "Error fetching Clerk user in test API",
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
