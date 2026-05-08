import redis from '../config/redis'

const WINDOW_SECONDS = 60 * 60  // 1 hour
const MAX_EXECUTIONS = 100

export async function getRateLimitStatus(userId: string): Promise<{
  limit: number
  remaining: number
  resetIn: number
}> {
  const key = `ratelimit:executions:${userId}`
  const pipeline = redis.pipeline()
  pipeline.get(key)
  pipeline.ttl(key)
  const results = await pipeline.exec()

  const count = Number(results?.[0]?.[1] ?? 0)
  const ttl = Number(results?.[1]?.[1] ?? -2)

  return {
    limit: MAX_EXECUTIONS,
    remaining: Math.max(0, MAX_EXECUTIONS - count),
    resetIn: ttl > 0 ? ttl : WINDOW_SECONDS,
  }
}

export async function checkRateLimit(userId: string): Promise<{
  allowed: boolean
  remaining: number
  resetIn: number
}> {
  const key = `ratelimit:executions:${userId}`

  // Sliding window — increment and set expiry atomically
  const pipeline = redis.pipeline()
  pipeline.incr(key)
  pipeline.ttl(key)
  const results = await pipeline.exec()

  const count = results?.[0]?.[1] as number
  const ttl = results?.[1]?.[1] as number

  // First request in window — set expiry
  if (ttl === -1) {
    await redis.expire(key, WINDOW_SECONDS)
  }

  const remaining = Math.max(0, MAX_EXECUTIONS - count)
  const resetIn = ttl === -1 ? WINDOW_SECONDS : ttl

  return {
    allowed: count <= MAX_EXECUTIONS,
    remaining,
    resetIn,
  }
}
