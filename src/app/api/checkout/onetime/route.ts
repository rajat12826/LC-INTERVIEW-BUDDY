import { dodopayments } from "@/lib/dodopayments";
import { NextResponse } from "next/server";


export async function POST(request: Request) {
  try {
  
    const { productId, customerEmail, customerName, billingDetails } = await request.json();

    if (!productId || !customerEmail) {
      return NextResponse.json(
        { error: "Missing productId or customer email in request body" },
        { status: 400 }
      );
    }

    const productWithQuantity = { product_id: productId as string, quantity: 1 };

    const response = await dodopayments.payments.create({
    
      billing: {
        city: billingDetails?.city || "",
        country: billingDetails?.country || "US", // Default to "US" if not provided
        state: billingDetails?.state || "",
        street: billingDetails?.street || "",
        zipcode: billingDetails?.zipcode || "",
      },
      customer: {
        email: customerEmail,
        name: customerName || customerEmail, 
      },
      payment_link: true, // Request a payment link
      product_cart: [productWithQuantity],
      return_url: process.env.NEXT_PUBLIC_BASE_URL, // URL to redirect after payment
    });
    // console.log("Dodopayments payment link created successfully:", response);
    return NextResponse.json(response);
  } catch (error) {
    console.error("Error creating Dodopayments payment link:", error);
    return NextResponse.json(
      { error: "Failed to create payment link" },
      { status: 500 }
    );
  }
}
