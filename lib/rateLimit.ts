import { RateLimiterRedis } from "rate-limiter-flexible";
import redis from "./redis";

export const apiLimiter = new RateLimiterRedis({
  storeClient: redis,
  keyPrefix: "api_rate_limit",
  points: 5, // Number of points
  duration: 60, // Per 60 seconds
  blockDuration: 60 * 1 * 24, // Block for 24 hours if consumed too many points
});

export async function checkRateLimit(ip: string) {
  try {
    await apiLimiter.consume(ip);
    return { success: true };
  } catch (error) {
    const msBeforeNext = typeof error === "object" && error !== null && "msBeforeNext" in error
      ? (error as { msBeforeNext: number }).msBeforeNext
      : 1000;
    const resetAfter = Math.round(msBeforeNext / 1000) || 1;
    return {
      success: false,
      error: "Too many requests",
      resetAfter,
    };
  }
}
