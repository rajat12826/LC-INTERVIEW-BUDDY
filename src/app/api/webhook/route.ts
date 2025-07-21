import { Webhook } from "standardwebhooks";
import { headers } from "next/headers";
import { dodopayments } from "@/lib/dodopayments";
import { supabaseAdmin } from "@/lib/server";
import { createClerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Initialize webhook client
const webhook = new Webhook(process.env.DODO_PAYMENTS_WEBHOOK_KEY!);

// Initialize Clerk client once at the top level
const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY,
});

interface PaymentMetadata {
  payment_id?: string;
  payment_status?: string;
  subscription_id?: string;
  subscription_status?: string;
  type: 'payment' | 'subscription';
  customer_id?: string;
}

interface SupabaseUpdateData {
  is_premium: boolean;
  updated_at: string;
  stripe_customer_id: string | null;
  payment_id?: string | null;
  payment_status?: string | null;
  current_plan?: string;
  stripe_subscription_id?: string | null;
}

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
    console.log("Parsed Webhook Payload:", JSON.stringify(payload, null, 2));

    if (payload.data.payload_type === "Subscription") {
      switch (payload.type) {
        case "subscription.active": {
          const subscription = await dodopayments.subscriptions.retrieve(payload.data.subscription_id);
          console.log("-------SUBSCRIPTION DATA START ---------");
          console.log(JSON.stringify(subscription, null, 2));
          console.log("-------SUBSCRIPTION DATA END ---------");

          const subscriptionEmail = subscription.customer?.email;
          if (subscriptionEmail) {
            await updateUserPremiumStatus(subscriptionEmail, true, {
              subscription_id: payload.data.subscription_id,
              subscription_status: 'active',
              type: 'subscription',
              customer_id: subscription.customer?.customer_id
            });
          }
          break;
        }

        case "subscription.failed":
        case "subscription.cancelled": {
          const cancelledSubscription = await dodopayments.subscriptions.retrieve(payload.data.subscription_id);
          const cancelledEmail = cancelledSubscription.customer?.email;

          if (cancelledEmail) {
            await updateUserPremiumStatus(cancelledEmail, false, {
              subscription_status: payload.type === 'subscription.cancelled' ? 'cancelled' : 'failed',
              type: 'subscription',
              customer_id: cancelledSubscription.customer?.customer_id
            });
          }
          break;
        }

        case "subscription.renewed": {
          const renewedSubscription = await dodopayments.subscriptions.retrieve(payload.data.subscription_id);
          const renewedEmail = renewedSubscription.customer?.email;

          if (renewedEmail) {
            await updateUserPremiumStatus(renewedEmail, true, {
              subscription_status: 'active',
              type: 'subscription',
              customer_id: renewedSubscription.customer?.customer_id
            });
          }
          break;
        }

        default:
          // console.log(`Unhandled subscription type: ${payload.type}`);
          break;
      }
    } else if (payload.data.payload_type === "Payment") {
      switch (payload.type) {
        case "payment.succeeded": {
          const paymentDataResp = await dodopayments.payments.retrieve(payload.data.payment_id);
          // console.log("-------PAYMENT DATA START ---------");
          // console.log(JSON.stringify(paymentDataResp, null, 2));
          // console.log("-------PAYMENT DATA END ---------");

          const customerEmail = paymentDataResp.customer?.email;
          // console.log(`Customer email from payment data: ${customerEmail}`);

          if (customerEmail) {
            await updateUserPremiumStatus(customerEmail, true, {
              payment_id: payload.data.payment_id,
              payment_status: 'completed',
              type: 'payment',
              customer_id: paymentDataResp.customer?.customer_id
            });
          } else {
            console.warn("Customer email not found in payment data for 'payment.succeeded' webhook. Cannot update Supabase/Clerk.");
          }
          break;
        }

        default:
          // console.log(`Unhandled payment type: ${payload.type}`);
          break;
      }
    } else {
      // console.log(`Unhandled payload type: ${payload.data.payload_type}`);
    }

    return NextResponse.json(
      { message: "Webhook processed successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("----- Webhook verification failed or processing error -----");
    console.error("Error details:", error);

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
  metadata: PaymentMetadata
): Promise<void> {
  try {
    // console.log("Debugging clerkClient in updateUserPremiumStatus:");
    // console.log("  Type of clerkClient:", typeof clerkClient);
    // console.log("  clerkClient object (if not undefined):", clerkClient);
    // console.log("  Type of clerkClient.users:", typeof clerkClient?.users);
    // console.log("  clerkClient.users object (if not undefined):", clerkClient?.users);

    if (!clerkClient || !clerkClient.users) {
      console.error("Clerk client or clerkClient.users is undefined. This indicates a problem with Clerk SDK initialization at the module level.");
      throw new Error("Clerk client not initialized properly. Cannot update user metadata.");
    }

    const normalizedEmail = email.toLowerCase().trim();
    // console.log(`Attempting to find Clerk user for email: ${normalizedEmail}`);

    // 1. Find Clerk user by email
    const response = await clerkClient.users.getUserList({
      emailAddress: [normalizedEmail]
    });

    // console.log("Clerk getUserList response (full object):", response);
    // console.log("Clerk users found by email (response.data):", response.data);

    if (response.data.length === 0) {
      console.warn(`Clerk user not found with email: ${normalizedEmail}. Cannot update Clerk metadata or Supabase record.`);
      return;
    }

    const clerkUser = response.data[0];
    // console.log("First Clerk user object from array:", clerkUser);

    if (!clerkUser || !clerkUser.id) {
      console.error(`Unexpected: response.data[0] or its ID is undefined/null for email: ${normalizedEmail}.`);
      throw new Error("Clerk user object is invalid after fetching from getUserList.");
    }

    // console.log(`Found Clerk user: ${clerkUser.id}`);

    // 2. Update Clerk user public metadata
    await clerkClient.users.updateUserMetadata(clerkUser.id, {
      publicMetadata: {
        ...clerkUser.publicMetadata,
        isPremium: isPremium,
        ...metadata,
        updatedAt: new Date().toISOString()
      }
    });

    // console.log(`Updated Clerk user ${clerkUser.id} premium status to ${isPremium}`);

    // 3. Also update Supabase record
    const supabaseUpdateData: SupabaseUpdateData = {
      is_premium: isPremium,
      updated_at: new Date().toISOString(),
      stripe_customer_id: metadata.customer_id || null,
    };

    if (metadata.type === 'payment') {
      supabaseUpdateData.payment_id = metadata.payment_id || null;
      supabaseUpdateData.payment_status = metadata.payment_status || null;
      supabaseUpdateData.current_plan = 'One-Time Premium';
      supabaseUpdateData.stripe_subscription_id = null;
    } else if (metadata.type === 'subscription') {
      supabaseUpdateData.stripe_subscription_id = metadata.subscription_id || null;
      supabaseUpdateData.current_plan = metadata.subscription_status === 'active' ? 'Subscription Premium' : metadata.subscription_status;
      supabaseUpdateData.payment_id = null;
      supabaseUpdateData.payment_status = null;
    }

    const { error: updateError } = await supabaseAdmin
      .from('lc_users')
      .update(supabaseUpdateData)
      .eq('clerk_user_id', clerkUser.id);

    // if (updateError) {
    //   console.error("Error updating Supabase record for user:", updateError);
    //   console.error("Supabase Update Error Details:", updateError.details);
    //   console.error("Supabase Update Error Hint:", updateError.hint);
    //   console.error("Supabase Update Error Message:", updateError.message);
    // } else {
    //   console.log(`Updated Supabase record for ${normalizedEmail} (Clerk ID: ${clerkUser.id})`);
    // }

    // 4. Verify the update worked (optional, but good for debugging)
    const updatedClerkUser = await clerkClient.users.getUser(clerkUser.id);
    console.log("Verification - Clerk user publicMetadata after webhook:", updatedClerkUser.publicMetadata);

  } catch (error) {
    console.error(`Error in updateUserPremiumStatus for ${email}:`, error);
    throw error;
  }
}