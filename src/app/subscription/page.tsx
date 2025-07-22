'use client';

import { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { checkAndRefreshPremiumStatus } from '@/utils/premiumStatusChecker';
import { Button } from '@/components/ui/button';
import { Check, Star, Zap, Shield, Crown, Sparkles, ArrowRight } from 'lucide-react';
import Navbar from '../_components/layout/Navbar';

interface Product {
  product_id: string;
  name: string;
  description: string;
  price: number;
  is_recurring: boolean;
}

interface Feature {
  icon: React.ComponentType<{ className?: string }>;
  text: string;
  highlight: boolean;
}

function ProductCard({ product }: { product: Product }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { user } = useUser();

  const checkoutProduct = async (productId: string, is_recurring: boolean) => {
    if (!user) {
      console.error("User not loaded. Please ensure you are logged in.");
      return;
    }

    const customerEmail = user.emailAddresses[0]?.emailAddress;
    const customerName = user.fullName || user.username || customerEmail;

    if (!customerEmail) {
      console.error("User email not available for checkout.");
      return;
    }

    setLoading(true);
    let productType = "onetime";
    if (is_recurring) {
      productType = "subscription";
    }

    const billingDetails = {
      city: "New York",
      country: "US",
      state: "NY",
      street: "123 Main St",
      zipcode: "10001",
    };

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/api/checkout/${productType}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            productId: productId,
            customerEmail: customerEmail,
            customerName: customerName,
            billingDetails: billingDetails,
          }),
          cache: "no-store",
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to create payment link: ${response.statusText}`);
      }

      const data = await response.json();
      if (data.payment_link) {
        router.push(data.payment_link);
      } else {
        console.error("No payment link received from API:", data);
      }
    } catch (error) {
      console.error("Error during checkout process:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={() => checkoutProduct(product.product_id, product.is_recurring)}
      disabled={loading || !user}
      className="w-full h-14 text-lg font-bold bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 dark:from-indigo-600 dark:to-purple-600 dark:hover:from-indigo-700 dark:hover:to-purple-700 border-0 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] disabled:transform-none disabled:opacity-50 group"
    >
      {loading ? (
        <div className="flex items-center gap-3 text-white">
          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          Processing...
        </div>
      ) : (
        <div className="flex items-center gap-3  dark:text-white">
          <Crown className="w-5 h-5" />
          Get Premium Access
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </div>
      )}
    </Button>
  );
}

export default function SubscriptionPage() {
  const { user } = useUser();
  const router = useRouter();
  
  const singleProduct: Product = {
    product_id: "pdt_OkHF4hjgzfwwlWxPJnlV4",
    name: "Premium Access",
    description: "Unlock all LeetCode problems and advanced features with a one-time payment.",
    price: 450,
    is_recurring: false,
  };

  const [checking, setChecking] = useState(false);
  const [message, setMessage] = useState('');

  const handleCheckPaymentStatus = async () => {
    if (!user) {
      setMessage('Please log in to check payment status');
      return;
    }
        
    setChecking(true);
    setMessage('');
        
    try {
      const clerkUserId = user.id;
      const email = user.emailAddresses[0]?.emailAddress;
            
      if (!email) {
        setMessage('Email not found');
        return;
      }
            
      const isPremium = await checkAndRefreshPremiumStatus(clerkUserId, email);
            
      if (isPremium) {
        setMessage('Payment confirmed! Redirecting to questions...');
        setTimeout(() => {
          router.push('/leetcode');
        }, 2000);
      } else {
        setMessage('No premium subscription found. Please complete your payment or contact support if you recently paid.');
      }
    } catch (error) {
      setMessage('Error checking payment status. Please try again.');
    } finally {
      setChecking(false);
    }
  };

const features: Feature[] = [
    { icon: Zap, text: "1800+ Premium Problems", highlight: true },
    { icon: Crown, text: "Algorithm Solutions", highlight: false },
    { icon: Shield, text: "Interview Prep Tools", highlight: false },
    { icon: Star, text: "AI Tutor for Each Question", highlight: false }
  ];
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:bg-gradient-to-br dark:from-gray-900 dark:to-indigo-900">
      <Navbar/>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900 dark:to-pink-900 text-purple-800 dark:text-purple-200 text-sm font-semibold mb-6">
            <Sparkles className="w-4 h-4" />
            Limited Time - 50% Off
          </div>
          
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
            Unlock Your
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 dark:from-indigo-400 dark:to-purple-400">
              Coding Potential
            </span>
          </h1>
          
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Master coding interviews with premium problems and solutions
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-center">
          
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="p-8 sm:p-10">
              <div className="text-center mb-8">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-amber-400 to-orange-400 dark:from-amber-500 dark:to-orange-500 text-white text-sm font-bold mb-4">
                  <Crown className="w-4 h-4" />
                  MOST POPULAR
                </div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{singleProduct.name}</h2>
                <p className="text-gray-600 dark:text-gray-300">{singleProduct.description}</p>
              </div>

              <div className="text-center mb-8">
                <div className="flex items-baseline justify-center gap-3 mb-3">
                  <span className="text-5xl font-bold text-gray-900 dark:text-white">${(singleProduct.price / 100).toFixed(0)}</span>
                  <span className="text-2xl text-gray-400 dark:text-gray-500 line-through">${((singleProduct.price / 100) * 2).toFixed(0)}</span>
                  <div className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-sm font-semibold rounded-lg">
                    Save 50%
                  </div>
                </div>
                <p className="text-gray-600 dark:text-gray-300">One-time payment • Lifetime access</p>
              </div>

              <div className="space-y-4 mb-8">
                {features.map((feature, index) => (
                  <div key={index} className={`flex items-center gap-4 p-4 rounded-xl transition-all ${
                    feature.highlight 
                      ? 'bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/30 dark:to-pink-900/30 border-2 border-purple-200 dark:border-purple-700' 
                      : 'bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600'
                  }`}>
                    <div className={`p-2 rounded-lg ${
                      feature.highlight 
                        ? 'bg-gradient-to-r from-purple-500 to-pink-500 dark:from-indigo-500 dark:to-purple-500 text-white' 
                        : 'bg-white dark:bg-gray-600 shadow-sm text-gray-600 dark:text-gray-300'
                    }`}>
                      <feature.icon className="w-5 h-5" />
                    </div>
                    <span className="font-medium text-gray-900 dark:text-white">{feature.text}</span>
                    {feature.highlight && <Star className="w-5 h-5 text-yellow-500 fill-current ml-auto" />}
                  </div>
                ))}
              </div>

              <ProductCard product={singleProduct} />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700 p-8 sm:p-10">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-r from-green-400 to-blue-500 dark:from-green-500 dark:to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Already Purchased?</h3>
              <p className="text-gray-600 dark:text-white">Verify your payment to unlock premium features</p>
            </div>

            <div className="space-y-6">
              <Button 
                onClick={handleCheckPaymentStatus}
                disabled={checking || !user}
                className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 dark:from-green-600 dark:to-blue-700 dark:hover:from-green-700 dark:hover:to-blue-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]"
              >
                {checking ? (
                  <div className="flex items-center gap-3 text-white">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin dark:text-white "></div>
                    Verifying...
                  </div>
                ) : (
                  <div className="flex items-center gap-2 dark:text-white">
                    <Check className="w-5 h-5" />
                    Verify My Payment
                  </div>
                )}
              </Button>

              {!user && (
                <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-center text-sm font-medium">
                  Please log in to verify your payment status
                </div>
              )}

              {message && (
                <div className={`p-4 rounded-xl text-center font-medium text-sm ${
                  message.includes('confirmed') || message.includes('Redirecting')
                    ? 'bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-200'
                    : message.includes('Error') || message.includes('not found')
                    ? 'bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200'
                    : 'bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200'
                }`}>
                  {message}
                </div>
              )}
            </div>

            <div className="mt-8 pt-8 border-t border-gray-100 dark:border-gray-600 text-center">
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-2">Need help?</p>
              <button className="text-blue-600 dark:text-indigo-400 hover:text-blue-700 dark:hover:text-indigo-300 font-medium text-sm transition-colors">
                Contact Support →
              </button>
            </div>
          </div>
        </div>

        {/* <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mt-20">
          <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700">
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">10,000+</div>
            <div className="text-gray-600 dark:text-gray-300">Happy Users</div>
          </div>
          <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700">
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">99.9%</div>
            <div className="text-gray-600 dark:text-gray-300">Uptime</div>
          </div>
          <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700">
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">24/7</div>
            <div className="text-gray-600 dark:text-gray-300">Support</div>
          </div>
        </div> */}
      </div>
    </div>
  );
}