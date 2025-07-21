'use client';
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs"; // Import useUser from Clerk

type Product = {
  product_id: string;
  name: string;
  description: string;
  price: number;
  is_recurring: boolean;
};

export default function ProductCard({ product }: { product: Product }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { user } = useUser(); // Get the current authenticated user from Clerk

  const checkoutProduct = async (productId: string, is_recurring: boolean) => { // Removed useDynamicPaymentLinks as it's always true now
    // Ensure user data is available before proceeding
    if (!user) {
      console.error("User not loaded. Please ensure you are logged in.");
      // Optionally, redirect to login or show a user-friendly message
      return;
    }

    // Extract user email and name from Clerk user object
    const customerEmail = user.emailAddresses[0]?.emailAddress;
    const customerName = user.fullName || user.username || customerEmail;

    if (!customerEmail) {
      console.error("User email not available for checkout.");
      return;
    }

    setLoading(true);
    let productType = "onetime";
    if (is_recurring) {
      productType = "subscription"; // Assuming Dodopayments handles subscription types
    }

    // --- Placeholder for collecting user billing input ---
    // In a real application, you would have a form here to collect
    // city, country, state, street, zipcode from the user.
    // For demonstration, we'll use some default/placeholder values.
    const billingDetails = {
      city: "New York", // Example: Replace with user input from a form
      country: "US",    // Example: Replace with user input from a form (ISO 3166-1 alpha-2)
      state: "NY",      // Example: Replace with user input from a form
      street: "123 Main St", // Example: Replace with user input from a form
      zipcode: "10001", // Example: Replace with user input from a form
    };
    // ---------------------------------------------------

    try {
      // Send a POST request with the product ID, customer details, and billing details in the body
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/api/checkout/${productType}`,
        {
          method: 'POST', // Changed to POST method
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            productId: productId,
            customerEmail: customerEmail,
            customerName: customerName,
            billingDetails: billingDetails, // Include billing details in the body
          }),
          cache: "no-store",
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to create payment link: ${response.statusText}`);
      }

      const data = await response.json();
      if (data.payment_link) {
        router.push(data.payment_link); // Redirect to Dodopayments checkout page
      } else {
        console.error("No payment link received from API:", data);
        // Show error message to user
      }
    } catch (error) {
      console.error("Error during checkout process:", error);
      // Show error message to user
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-6 hover:transform hover:scale-105 hover:shadow-xl transition-all duration-300">
      <h2 className="text-xl font-bold text-gray-900">{product.name}</h2>
      <p className="text-gray-700 mt-2">{product.description}</p>
      <p className="text-green-600 font-semibold mt-4">${(product.price / 100).toFixed(2)}</p>
      <button
        className="mt-4 inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
        onClick={() => checkoutProduct(product.product_id, product.is_recurring)} // Removed the last argument
        disabled={loading}
      >
        {loading ? "Processing..." : "Buy now"}
      </button>
    </div>
  );
}
