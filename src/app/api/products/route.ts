import { dodopayments } from "@/lib/dodopayments";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const products = await dodopayments.products.list();
    return NextResponse.json(products.items);
  } catch (error) {
    console.error("Error fetching products from Dodopayments:", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}
