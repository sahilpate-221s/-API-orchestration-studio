import { Request, Response, NextFunction } from 'express'
import redis from '../config/redis'

// Generic sliding window rate limiter factory
function createRateLimiter(options: {
  keyPrefix: string
  windowSeconds: number
  maxRequests: number
  message: string
}) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const identifier =
      req.ip ??
      req.headers['x-forwarded-for'] ??
      'unknown'

    const key = `${options.keyPrefix}:${identifier}`

    const pipeline = redis.pipeline()
    pipeline.incr(key)
    pipeline.ttl(key)
    const results = await pipeline.exec()

    const count = results?.[0]?.[1] as number
    const ttl = results?.[1]?.[1] as number

    if (ttl === -1) {
      await redis.expire(key, options.windowSeconds)
    }

    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', options.maxRequests)
    res.setHeader('X-RateLimit-Remaining', Math.max(0, options.maxRequests - count))
    res.setHeader('X-RateLimit-Reset', ttl === -1 ? options.windowSeconds : ttl)

    if (count > options.maxRequests) {
      res.status(429).json({
        message: options.message,
        retryAfter: ttl === -1 ? options.windowSeconds : ttl,
      })
      return
    }

    next()
  }
}

// Auth routes — 10 attempts per 15 minutes per IP
export const authRateLimit = createRateLimiter({
  keyPrefix: 'ratelimit:auth',
  windowSeconds: 15 * 60,
  maxRequests: 10,
  message: 'Too many login attempts. Try again in 15 minutes.',
})

// Execution routes — 100 per hour per IP
export const executionRateLimit = createRateLimiter({
  keyPrefix: 'ratelimit:execution',
  windowSeconds: 60 * 60,
  maxRequests: 100,
  message: 'Execution limit reached. Try again in 1 hour.',
})

// AI generation — 20 per hour per IP
export const aiRateLimit = createRateLimiter({
  keyPrefix: 'ratelimit:ai',
  windowSeconds: 60 * 60,
  maxRequests: 20,
  message: 'AI generation limit reached. Try again in 1 hour.',
})

// General API — 300 per minute per IP
export const apiRateLimit = createRateLimiter({
  keyPrefix: 'ratelimit:api',
  windowSeconds: 60,
  maxRequests: 300,
  message: 'Too many requests. Slow down.',
})