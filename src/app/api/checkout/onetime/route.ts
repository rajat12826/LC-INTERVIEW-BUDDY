import { dodopayments } from "@/lib/dodopayments";
import { NextResponse } from "next/server";

// Changed to POST request to accept a request body with user input
export async function POST(request: Request) {
  try {
    // Parse the request body to get the product ID, customer, and billing details
    const { productId, customerEmail, customerName, billingDetails } = await request.json();

    if (!productId || !customerEmail) {
      return NextResponse.json(
        { error: "Missing productId or customer email in request body" },
        { status: 400 }
      );
    }

    const productWithQuantity = { product_id: productId as string, quantity: 1 };

    const response = await dodopayments.payments.create({
      // Use the billing details provided in the request body,
      // or default to empty strings if not provided.
      // Ensure 'country' is a valid ISO 3166-1 alpha-2 code.
      billing: {
        city: billingDetails?.city || "",
        country: billingDetails?.country || "US", // Default to "US" if not provided
        state: billingDetails?.state || "",
        street: billingDetails?.street || "",
        zipcode: billingDetails?.zipcode || "",
      },
      customer: {
        email: customerEmail,
        name: customerName || customerEmail, // Use customerName if available, else fallback to email
      },
      payment_link: true, // Request a payment link
      product_cart: [productWithQuantity],
      return_url: process.env.NEXT_PUBLIC_BASE_URL, // URL to redirect after payment
    });
    console.log("Dodopayments payment link created successfully:", response);
    return NextResponse.json(response);
  } catch (error) {
    console.error("Error creating Dodopayments payment link:", error);
    return NextResponse.json(
      { error: "Failed to create payment link" },
      { status: 500 }
    );
  }
}
