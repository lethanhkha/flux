import Redis from 'ioredis';
import { env } from './index';

export const redis = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: 3,
  retryStrategy(times) {
    if (times > 5) {
      console.warn('⚠️ Redis connection failed after 5 retries. Running in degraded mode.');
      return null; // Stop reconnecting
    }
    return Math.min(times * 200, 2000);
  },
  lazyConnect: true,
});

redis.on('connect', () => {
  console.log('✅ Redis connected successfully.');
});

redis.on('error', (err) => {
  console.warn('⚠️ Redis connection notice:', err.message);
});
