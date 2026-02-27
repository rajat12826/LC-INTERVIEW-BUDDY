import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";
export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Create a rate limiter: 10 requests every 10 seconds per user/IP
// NOTE: Used for general /leetcode page route protection
export const ratelimit = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(10, "10 s"),
  analytics: true,
});

// ADDED: Stricter rate limiter for API routes (30 requests per 60 seconds)
// Keeps API abuse in check without being too tight for normal usage
export const apiRatelimit = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(30, "60 s"),
  analytics: true,
});

// ADDED: Very strict limiter for sensitive routes like webhooks (5 requests per 60 seconds)
export const strictRatelimit = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(5, "60 s"),
  analytics: true,
});
