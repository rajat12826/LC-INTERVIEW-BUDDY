import { Webhook } from "standardwebhooks";
import { headers } from "next/headers";
import { dodopayments } from "@/lib/dodopayments";
import { supabaseAdmin } from "@/lib/server"; // Import the admin Supabase client from src/lib/server
import { createClerkClient } from "@clerk/nextjs/server"; // Import createClerkClient function
import { NextResponse } from "next/server";

// Initialize webhook client
const webhook = new Webhook(process.env.DODO_PAYMENTS_WEBHOOK_KEY!);

// Initialize Clerk client once at the top level
// This relies on process.env.CLERK_SECRET_KEY being available at module load time.
const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY,
});

export async function POST(request: Request) {
  const headersList = await headers();

  // --- Debugging: Check CLERK_SECRET_KEY ---
  console.log("CLERK_SECRET_KEY (for webhook debug):", process.env.CLERK_SECRET_KEY ? "SET" : "NOT SET");
  // ------------------------------------------

  try {
    const rawBody = await request.text();
    const webhookHeaders = {
      "webhook-id": headersList.get("webhook-id") || "",
      "webhook-signature": headersList.get("webhook-signature") || "",
      "webhook-timestamp": headersList.get("webhook-timestamp") || "",
    };

    console.log("Webhook Headers:", webhookHeaders);
    console.log("Raw Webhook Body:", rawBody);

    // Verify the webhook signature for security
    await webhook.verify(rawBody, webhookHeaders);
    const payload = JSON.parse(rawBody);

    console.log(`Received Dodopayments webhook: Type=${payload.type}, Payload Type=${payload.data.payload_type}`);
    console.log("Parsed Webhook Payload:", JSON.stringify(payload, null, 2)); // Log the entire parsed payload with formatting

    if (payload.data.payload_type === "Subscription") {
      switch (payload.type) {
        case "subscription.active":
          const subscription = await dodopayments.subscriptions.retrieve(payload.data.subscription_id);
          console.log("-------SUBSCRIPTION DATA START ---------")
          console.log(JSON.stringify(subscription, null, 2));
          console.log("-------SUBSCRIPTION DATA END ---------")

          const subscriptionEmail = subscription.customer?.email;
          if (subscriptionEmail) {
            await updateUserPremiumStatus(subscriptionEmail, true, {
              subscription_id: subscription.id,
              subscription_status: 'active', // This will be used to set current_plan
              type: 'subscription',
              customer_id: subscription.customer?.customer_id // Pass customer_id for stripe_customer_id mapping
            });
          }
          break;

        case "subscription.failed":
        case "subscription.cancelled":
          const cancelledSubscription = await dodopayments.subscriptions.retrieve(payload.data.subscription_id);
          const cancelledEmail = cancelledSubscription.customer?.email;

          if (cancelledEmail) {
            await updateUserPremiumStatus(cancelledEmail, false, {
              subscription_status: payload.type === 'subscription.cancelled' ? 'cancelled' : 'failed', // This will be used to set current_plan
              type: 'subscription',
              customer_id: cancelledSubscription.customer?.customer_id // Pass customer_id
            });
          }
          break;

        case "subscription.renewed":
          const renewedSubscription = await dodopayments.subscriptions.retrieve(payload.data.subscription_id);
          const renewedEmail = renewedSubscription.customer?.email;

          if (renewedEmail) {
            await updateUserPremiumStatus(renewedEmail, true, {
              subscription_status: 'active', // This will be used to set current_plan
              type: 'subscription',
              customer_id: renewedSubscription.customer?.customer_id // Pass customer_id
            });
          }
          break;
        default:
          console.log(`Unhandled subscription type: ${payload.type}`);
          break;
      }
    } else if (payload.data.payload_type === "Payment") {
      switch (payload.type) {
        case "payment.succeeded":
          const paymentDataResp = await dodopayments.payments.retrieve(payload.data.payment_id);
          console.log("-------PAYMENT DATA START ---------");
          console.log(JSON.stringify(paymentDataResp, null, 2));
          console.log("-------PAYMENT DATA END ---------");

          const customerEmail = paymentDataResp.customer?.email;
          console.log(`Customer email from payment data: ${customerEmail}`);

          if (customerEmail) {
            await updateUserPremiumStatus(customerEmail, true, {
              payment_id: paymentDataResp.id,
              payment_status: 'completed',
              type: 'payment',
              customer_id: paymentDataResp.customer?.customer_id // Pass customer_id for stripe_customer_id mapping
            });
          } else {
            console.warn("Customer email not found in payment data for 'payment.succeeded' webhook. Cannot update Supabase/Clerk.");
          }
          break;
        default:
          console.log(`Unhandled payment type: ${payload.type}`);
          break;
      }
    } else {
      console.log(`Unhandled payload type: ${payload.data.payload_type}`);
    }

    return NextResponse.json(
      { message: "Webhook processed successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("----- Webhook verification failed or processing error -----");
    console.error("Error details:", error);

    // Determine status code based on error type (e.g., 400 for verification, 500 for internal)
    const statusCode = error instanceof Error && error.message.includes('webhook') ? 400 : 500;

    return NextResponse.json(
      {
        message: "Webhook processing failed",
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: statusCode }
    );
  }
}

async function updateUserPremiumStatus(
  email: string,
  isPremium: boolean,
  metadata: any
) {
  try {
    // These logs are now less critical as the issue was in array access,
    // but kept for general debugging if needed.
    console.log("Debugging clerkClient in updateUserPremiumStatus:");
    console.log("  Type of clerkClient:", typeof clerkClient);
    console.log("  clerkClient object (if not undefined):", clerkClient);
    console.log("  Type of clerkClient.users:", typeof clerkClient?.users);
    console.log("  clerkClient.users object (if not undefined):", clerkClient?.users);

    if (!clerkClient || !clerkClient.users) {
      console.error("Clerk client or clerkClient.users is undefined. This indicates a problem with Clerk SDK initialization at the module level.");
      throw new Error("Clerk client not initialized properly. Cannot update user metadata.");
    }

    const normalizedEmail = email.toLowerCase().trim();
    console.log(`Attempting to find Clerk user for email: ${normalizedEmail}`);

    // 1. Find Clerk user by email
    // CORRECTED: Accessing the 'data' property of the response object
    const response = await clerkClient.users.getUserList({
      emailAddress: [normalizedEmail]
    });

    console.log("Clerk getUserList response (full object):", response);
    console.log("Clerk users found by email (response.data):", response.data);

    if (response.data.length === 0) { // Check length on response.data
      console.warn(`Clerk user not found with email: ${normalizedEmail}. Cannot update Clerk metadata or Supabase record.`);
      return; // Exit if Clerk user is not found
    }

    const clerkUser = response.data[0]; // Access the first user from the 'data' array
    console.log("First Clerk user object from array:", clerkUser);

    // Add a check to ensure clerkUser is not null/undefined before accessing its properties
    if (!clerkUser || !clerkUser.id) {
        console.error(`Unexpected: response.data[0] or its ID is undefined/null for email: ${normalizedEmail}.`);
        throw new Error("Clerk user object is invalid after fetching from getUserList.");
    }

    console.log(`Found Clerk user: ${clerkUser.id}`);

    // 2. Update Clerk user public metadata
    await clerkClient.users.updateUserMetadata(clerkUser.id, {
      publicMetadata: {
        ...clerkUser.publicMetadata, // Preserve existing metadata
        isPremium: isPremium, // Set premium status
        ...metadata, // Add payment/subscription specific metadata
        updatedAt: new Date().toISOString() // Add a timestamp for when it was updated
      }
    });

    console.log(`Updated Clerk user ${clerkUser.id} premium status to ${isPremium}`);

    // 3. Also update Supabase record
    // Prepare the update object based on the type of event (payment or subscription)
    const supabaseUpdateData: any = {
      is_premium: isPremium,
      updated_at: new Date().toISOString(),
      // Always update stripe_customer_id if available in metadata
      stripe_customer_id: metadata.customer_id || null,
    };

    if (metadata.type === 'payment') {
      supabaseUpdateData.payment_id = metadata.payment_id;
      supabaseUpdateData.payment_status = metadata.payment_status;
      supabaseUpdateData.current_plan = 'One-Time Premium';
      // Ensure subscription-related fields are nulled out if this is a one-time payment
      supabaseUpdateData.stripe_subscription_id = null;
      // supabaseUpdateData.subscription_status = null; // This column does not exist in your schema
    } else if (metadata.type === 'subscription') {
      supabaseUpdateData.stripe_subscription_id = metadata.subscription_id;
      // Map subscription status to current_plan if subscription_status column is missing
      supabaseUpdateData.current_plan = metadata.subscription_status === 'active' ? 'Subscription Premium' : metadata.subscription_status;
      supabaseUpdateData.payment_id = null; // Clear payment_id for subscriptions
      supabaseUpdateData.payment_status = null; // Clear payment_status for subscriptions
    }

    const { error: updateError } = await supabaseAdmin
      .from('lc_users')
      .update(supabaseUpdateData) // Use the dynamically built object
      .eq('clerk_user_id', clerkUser.id); // Match by Clerk user ID in Supabase

    if (updateError) {
      console.error("Error updating Supabase record for user:", updateError);
      console.error("Supabase Update Error Details:", updateError.details);
      console.error("Supabase Update Error Hint:", updateError.hint);
      console.error("Supabase Update Error Message:", updateError.message);
    } else {
      console.log(`Updated Supabase record for ${normalizedEmail} (Clerk ID: ${clerkUser.id})`);
    }

    // 4. Verify the update worked (optional, but good for debugging)
    const updatedClerkUser = await clerkClient.users.getUser(clerkUser.id);
    console.log("Verification - Clerk user publicMetadata after webhook:", updatedClerkUser.publicMetadata);

  } catch (error) {
    console.error(`Error in updateUserPremiumStatus for ${email}:`, error);
    throw error;
  }
}
