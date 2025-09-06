import { RateLimiterRedis } from 'rate-limiter-flexible';
import redis from './redis';

export const apiLimiter = new RateLimiterRedis({
  storeClient: redis,
  keyPrefix: 'api_rate_limit',
  points: 1, // Number of points
  duration: 600, // Per 60 seconds
  blockDuration: 60 * 10, // Block for 2 minutes if consumed too many points
});

export async function checkRateLimit(ip: string) {
  try {
    await apiLimiter.consume(ip);
    return { success: true };
  } catch (error) {
    const resetAfter = Math.round(error.msBeforeNext / 1000) || 1;
    return {
      success: false,
      error: 'Too many requests',
      resetAfter,
    };
  }
}
