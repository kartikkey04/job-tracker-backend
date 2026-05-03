import { Request, Response, NextFunction } from 'express';
import { redisClient } from '../config/redis';

interface RateLimitOptions {
  windowSeconds: number;
  max: number;
  keyPrefix: string;
}

export const rateLimiter = (options: RateLimitOptions) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = req.user?.userId ?? req.ip;
    const key = `rate:${options.keyPrefix}:${userId}`;

    try {
      const current = await redisClient.incr(key);

      if (current === 1) {
        await redisClient.expire(key, options.windowSeconds);
      }

      res.setHeader('X-RateLimit-Limit', options.max);
      res.setHeader('X-RateLimit-Remaining', Math.max(0, options.max - current));

      if (current > options.max) {
        const ttl = await redisClient.ttl(key);
        res.setHeader('Retry-After', ttl);
        res.status(429).json({
          success: false,
          error: `Too many requests. Try again in ${ttl} seconds.`,
        });
        return;
      }

      next();
    } catch {
      // If Redis is down, let the request through
      next();
    }
  };
};
