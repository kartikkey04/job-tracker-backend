import { createClient } from 'redis';
import { env } from './env';

export const redisClient = createClient({ url: env.REDIS_URL });

redisClient.on('error', (err) => console.error('Redis error:', err));

export const connectRedis = async (): Promise<void> => {
  try {
    await redisClient.connect();
    console.log('Redis connected successfully');
  } catch (error) {
    console.error('Redis connection failed:', error);
    process.exit(1);
  }
};

// Helper: get or set cache
export const getOrSetCache = async <T>(
  key: string,
  ttlSeconds: number,
  fetchFn: () => Promise<T>
): Promise<T> => {
  const cached = await redisClient.get(key);
  if (cached) return JSON.parse(cached) as T;

  const fresh = await fetchFn();
  await redisClient.setEx(key, ttlSeconds, JSON.stringify(fresh));
  return fresh;
};
