import { Webhook } from "standardwebhooks";
import { headers } from "next/headers";
import { dodopayments } from "@/lib/dodopayments";
import { supabaseAdmin } from "@/lib/server";
import { createClerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { sendMail } from "@/utils/mail/sendMail";

// Initialize webhook client
const webhook = new Webhook(process.env.DODO_PAYMENTS_WEBHOOK_KEY!);

// Initialize Clerk client once at the top level
const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY,
});

interface PaymentMetadata {
  payment_id: string;
  payment_status: string;
  customer_id: string;
}

interface SupabaseUpdateData {
  is_premium: boolean;
  updated_at: string;
  stripe_customer_id: string;
  payment_id: string;
  payment_status: string;
  current_plan: string;
}

export async function POST(request: Request) {
  const headersList = await headers();

  console.log("CLERK_SECRET_KEY (for webhook debug):", process.env.CLERK_SECRET_KEY ? "SET" : "NOT SET");

  try {
    const rawBody = await request.text();
    const webhookHeaders = {
      "webhook-id": headersList.get("webhook-id") || "",
      "webhook-signature": headersList.get("webhook-signature") || "",
      "webhook-timestamp": headersList.get("webhook-timestamp") || "",
    };

    console.log("Webhook Headers:", webhookHeaders);
    console.log("Raw Webhook Body:", rawBody);

    await webhook.verify(rawBody, webhookHeaders);
    const payload = JSON.parse(rawBody);

    console.log(`Received Dodopayments webhook: Type=${payload.type}, Payload Type=${payload.data.payload_type}`);
    console.log("Parsed Webhook Payload:", JSON.stringify(payload, null, 2));

    // Only handle one-time payments
    if (payload.data.payload_type === "Payment" && payload.type === "payment.succeeded") {
      const paymentDataResp = await dodopayments.payments.retrieve(payload.data.payment_id);

      console.log("-------PAYMENT DATA START ---------");
      console.log(JSON.stringify(paymentDataResp, null, 2));
      console.log("-------PAYMENT DATA END ---------");

      const customerEmail = paymentDataResp.customer?.email;
      const customerName = paymentDataResp.customer?.name || customerEmail;

      // Fix: Access amount property safely with multiple fallback options
      const getPaymentAmount = (paymentData: any) => {
        // Try different possible property names where amount might be stored
        return paymentData.amount || 
               paymentData.total || 
               paymentData.amount_total || 
               paymentData.total_amount ||
               paymentData.price ||
               paymentData.value ||
               (paymentData.line_items && paymentData.line_items[0]?.amount) ||
               "N/A";
      };

      const paymentAmount = getPaymentAmount(paymentDataResp);

      if (customerEmail) {
        // Update user premium status
        await updateUserPremiumStatus(customerEmail, {
          payment_id: payload.data.payment_id,
          payment_status: 'completed',
          customer_id: paymentDataResp.customer?.customer_id
        });

        // Send welcome email after successful payment
        try {
          await sendMail({
            email: customerEmail,
            subject: "Welcome to LeetCodePrep Premium!",
            templateName: "premium_welcome.ejs",
            data: {
              name: customerName,
              plan: "One-Time Premium",
              paymentAmount: (paymentAmount/100).toFixed(2),
              currency: paymentDataResp.currency || "USD",
              paymentId: payload.data.payment_id,
              paymentDate: new Date().toLocaleDateString(),
            },
          });
          console.log(`Welcome email sent successfully to: ${customerEmail}`);
        } catch (emailError) {
          console.error(`Failed to send welcome email to ${customerEmail}:`, emailError);
          // Don't throw here - we don't want email failures to break the webhook
        }

      } else {
        console.warn("Customer email not found in payment data. Cannot update user or send email.");
      }
    } else {
      console.log(`Ignoring webhook: Type=${payload.type}, Payload Type=${payload.data.payload_type}`);
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
  metadata: PaymentMetadata
): Promise<void> {
  try {
    if (!clerkClient || !clerkClient.users) {
      console.error("Clerk client not initialized properly. Cannot update user metadata.");
      throw new Error("Clerk client not initialized properly.");
    }

    const normalizedEmail = email.toLowerCase().trim();
    console.log(`Attempting to find Clerk user for email: ${normalizedEmail}`);

    // Find Clerk user by email
    const response = await clerkClient.users.getUserList({
      emailAddress: [normalizedEmail]
    });

    if (response.data.length === 0) {
      console.warn(`Clerk user not found with email: ${normalizedEmail}. Cannot update records.`);
      return;
    }

    const clerkUser = response.data[0];

    if (!clerkUser?.id) {
      console.error(`Invalid Clerk user object for email: ${normalizedEmail}.`);
      throw new Error("Clerk user object is invalid.");
    }

    console.log(`Found Clerk user: ${clerkUser.id}`);

    // Update Clerk user public metadata
    await clerkClient.users.updateUserMetadata(clerkUser.id, {
      publicMetadata: {
        ...clerkUser.publicMetadata,
        isPremium: true,
        paymentId: metadata.payment_id,
        paymentStatus: metadata.payment_status,
        customerId: metadata.customer_id,
        updatedAt: new Date().toISOString()
      }
    });

    console.log(`Updated Clerk user ${clerkUser.id} premium status to true`);

    // Update Supabase record
    const supabaseUpdateData: SupabaseUpdateData = {
      is_premium: true,
      updated_at: new Date().toISOString(),
      stripe_customer_id: metadata.customer_id,
      payment_id: metadata.payment_id,
      payment_status: metadata.payment_status,
      current_plan: 'One-Time Premium',
    };

    const { error: updateError } = await supabaseAdmin
      .from('lc_users')
      .update(supabaseUpdateData)
      .eq('clerk_user_id', clerkUser.id);

    if (updateError) {
      console.error("Error updating Supabase record:", updateError);
      throw updateError;
    } else {
      console.log(`Updated Supabase record for ${normalizedEmail} (Clerk ID: ${clerkUser.id})`);
    }

    // Verify the update
    const updatedClerkUser = await clerkClient.users.getUser(clerkUser.id);
    console.log("Verification - Clerk user publicMetadata after update:", updatedClerkUser.publicMetadata);

  } catch (error) {
    console.error(`Error in updateUserPremiumStatus for ${email}:`, error);
    throw error;
  }
}