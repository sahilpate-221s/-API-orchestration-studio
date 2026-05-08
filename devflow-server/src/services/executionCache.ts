import redis from '../config/redis'
import crypto from 'crypto'

const CACHE_TTL = 60 * 5  // 5 minutes

function hashNode(node: {
  url: string
  method: string
  headers?: Record<string, string>
  body?: string
}): string {
  const content = JSON.stringify({
    url: node.url,
    method: node.method,
    headers: node.headers ?? {},
    body: node.body ?? '',
  })
  return crypto.createHash('sha256').update(content).digest('hex')
}

export async function getCachedResult(nodeHash: string): Promise<unknown | null> {
  const key = `cache:node:${nodeHash}`
  const cached = await redis.get(key)
  return cached ? JSON.parse(cached) : null
}

export async function setCachedResult(
  nodeHash: string,
  result: unknown
): Promise<void> {
  const key = `cache:node:${nodeHash}`
  await redis.setex(key, CACHE_TTL, JSON.stringify(result))
}

export { hashNode }