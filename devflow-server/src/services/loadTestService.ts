import axios from 'axios'
import http from 'http'
import https from 'https'
import { Job } from 'bullmq'
import { io } from '../socket'
import { LoadTestJobData } from '../types/jobs'
import redis from '../config/redis'

// ─── Custom HTTP agents: remove the default 5-socket limit ───────────────────
const httpAgent = new http.Agent({
  keepAlive: true,
  maxSockets: Infinity,
  maxFreeSockets: 512,
  timeout: 30000,
})
const httpsAgent = new https.Agent({
  keepAlive: true,
  maxSockets: Infinity,
  maxFreeSockets: 512,
  rejectUnauthorized: false, // allow self-signed certs in test environments
  timeout: 30000,
})

const loadTestAxios = axios.create({
  httpAgent,
  httpsAgent,
  timeout: 30000,
  validateStatus: () => true, // don't throw on 4xx/5xx — we handle them ourselves
})

// Redis keys for atomic counters
const key = (loadTestId: string, field: string) =>
  `loadtest:${loadTestId}:${field}`

// ─── Init ─────────────────────────────────────────────────────────────────────
export async function initLoadTest(
  loadTestId: string,
  totalUsers: number
): Promise<void> {
  const pipeline = redis.pipeline()
  const fields = [
    'total', 'completed', 'successful', 'failed',
    'total_latency', 'start_time', 'active',
    'status:2xx', 'status:3xx', 'status:4xx', 'status:5xx',
    'status:timeout', 'status:conn_error',
  ]
  pipeline.set(key(loadTestId, 'total'), totalUsers)
  pipeline.set(key(loadTestId, 'start_time'), Date.now())
  for (const f of fields.slice(1)) {
    if (f !== 'start_time') pipeline.set(key(loadTestId, f), 0)
  }
  for (const f of fields) {
    pipeline.expire(key(loadTestId, f), 3600)
  }
  pipeline.del(key(loadTestId, 'latencies'))
  await pipeline.exec()
}

// ─── Stats ────────────────────────────────────────────────────────────────────
export async function getLoadTestStats(loadTestId: string) {
  const pipeline = redis.pipeline()
  pipeline.get(key(loadTestId, 'total'))
  pipeline.get(key(loadTestId, 'completed'))
  pipeline.get(key(loadTestId, 'successful'))
  pipeline.get(key(loadTestId, 'failed'))
  pipeline.get(key(loadTestId, 'total_latency'))
  pipeline.get(key(loadTestId, 'start_time'))
  pipeline.get(key(loadTestId, 'active'))
  pipeline.zcard(key(loadTestId, 'latencies'))
  // Status code buckets
  pipeline.get(key(loadTestId, 'status:2xx'))
  pipeline.get(key(loadTestId, 'status:3xx'))
  pipeline.get(key(loadTestId, 'status:4xx'))
  pipeline.get(key(loadTestId, 'status:5xx'))
  pipeline.get(key(loadTestId, 'status:timeout'))
  pipeline.get(key(loadTestId, 'status:conn_error'))
  const results = await pipeline.exec()

  const total      = parseInt(results?.[0]?.[1] as string ?? '0')
  const completed  = parseInt(results?.[1]?.[1] as string ?? '0')
  const successful = parseInt(results?.[2]?.[1] as string ?? '0')
  const failed     = parseInt(results?.[3]?.[1] as string ?? '0')
  const totalLatency = parseInt(results?.[4]?.[1] as string ?? '0')
  const startTime  = parseInt(results?.[5]?.[1] as string ?? '0')
  const active     = parseInt(results?.[6]?.[1] as string ?? '0')
  const latencyCount = parseInt(results?.[7]?.[1] as string ?? '0')
  const s2xx       = parseInt(results?.[8]?.[1]  as string ?? '0')
  const s3xx       = parseInt(results?.[9]?.[1]  as string ?? '0')
  const s4xx       = parseInt(results?.[10]?.[1] as string ?? '0')
  const s5xx       = parseInt(results?.[11]?.[1] as string ?? '0')
  const sTimeout   = parseInt(results?.[12]?.[1] as string ?? '0')
  const sConnErr   = parseInt(results?.[13]?.[1] as string ?? '0')

  const elapsed    = (Date.now() - startTime) / 1000
  const rps        = elapsed > 0 ? Math.round(completed / elapsed) : 0
  const avgLatency = completed > 0 ? Math.round(totalLatency / completed) : 0

  // Percentiles + min/max from sorted set
  let p50 = 0, p95 = 0, p99 = 0, minLatency = 0, maxLatency = 0

  if (latencyCount > 0) {
    const p50Index = Math.floor(latencyCount * 0.50)
    const p95Index = Math.floor(latencyCount * 0.95)
    const p99Index = Math.floor(latencyCount * 0.99)

    const [p50Res, p95Res, p99Res, minRes, maxRes] = await Promise.all([
      redis.zrange(key(loadTestId, 'latencies'), p50Index, p50Index),
      redis.zrange(key(loadTestId, 'latencies'), p95Index, p95Index),
      redis.zrange(key(loadTestId, 'latencies'), p99Index, p99Index),
      redis.zrange(key(loadTestId, 'latencies'), 0, 0),          // min
      redis.zrange(key(loadTestId, 'latencies'), -1, -1),        // max
    ])

    p50 = p50Res.length > 0 ? parseInt(p50Res[0]) : 0
    p95 = p95Res.length > 0 ? parseInt(p95Res[0]) : 0
    p99 = p99Res.length > 0 ? parseInt(p99Res[0]) : 0
    minLatency = minRes.length > 0 ? parseInt(minRes[0]) : 0
    maxLatency = maxRes.length > 0 ? parseInt(maxRes[0]) : 0
  }

  return {
    total,
    completed,
    successful,
    failed,
    avgLatency,
    minLatency,
    maxLatency,
    p50,
    p95,
    p99,
    rps,
    active,
    elapsed: Math.round(elapsed),
    successRate: completed > 0 ? Math.round((successful / completed) * 100) : 0,
    progress: total > 0 ? Math.round((completed / total) * 100) : 0,
    statusCodes: { s2xx, s3xx, s4xx, s5xx, sTimeout, sConnErr },
  }
}

// ─── Execute a single batch ───────────────────────────────────────────────────
export async function executeLoadTestBatch(
  job: Job<LoadTestJobData>
): Promise<void> {
  const {
    loadTestId,
    targetUrl,
    method,
    headers,
    body,
    batchIndex,
    batchSize,
    rampUpSeconds,
    totalUsers,
  } = job.data

  // Ramp-up delay — skip entirely when rampUpSeconds is 0 (spike mode)
  if (rampUpSeconds > 0) {
    const totalBatches = Math.ceil(totalUsers / batchSize)
    const delayPerBatch = (rampUpSeconds * 1000) / totalBatches
    const myDelay = batchIndex * delayPerBatch
    if (myDelay > 0) {
      await new Promise((r) => setTimeout(r, myDelay))
    }
  }

  // Increment active users
  await redis.incrby(key(loadTestId, 'active'), batchSize)

  let parsedBody: unknown
  try {
    parsedBody = body ? JSON.parse(body) : undefined
  } catch {
    parsedBody = body
  }

  // Fire ALL requests in this batch concurrently
  const promises = Array.from({ length: batchSize }, async () => {
    const start = Date.now()
    try {
      const response = await loadTestAxios({
        method: method.toLowerCase() as any,
        url: targetUrl,
        headers,
        data: parsedBody,
      })

      const latency = Date.now() - start
      const status  = response.status
      const bucket  = status >= 500 ? 'status:5xx'
                    : status >= 400 ? 'status:4xx'
                    : status >= 300 ? 'status:3xx'
                    : 'status:2xx'

      // Treat 4xx/5xx as failures
      const isSuccess = status >= 200 && status < 400

      const pipeline = redis.pipeline()
      pipeline.incr(key(loadTestId, 'completed'))
      pipeline.incr(key(loadTestId, isSuccess ? 'successful' : 'failed'))
      pipeline.incrby(key(loadTestId, 'total_latency'), latency)
      pipeline.incr(key(loadTestId, bucket))
      pipeline.zadd(key(loadTestId, 'latencies'), latency, `${start}-${Math.random()}`)
      pipeline.expire(key(loadTestId, 'latencies'), 3600)
      pipeline.expire(key(loadTestId, bucket), 3600)
      if (!isSuccess) {
        // Track individual HTTP status code errors
        pipeline.incr(key(loadTestId, `error:http_${status}`))
        pipeline.expire(key(loadTestId, `error:http_${status}`), 3600)
      }
      await pipeline.exec()

    } catch (err) {
      const latency = Date.now() - start
      let errorType = 'unknown'
      let bucket    = 'status:conn_error'

      if (axios.isAxiosError(err)) {
        if (err.code === 'ECONNABORTED' || err.code === 'ETIMEDOUT') {
          errorType = 'timeout'
          bucket    = 'status:timeout'
        } else if (err.code === 'ECONNREFUSED') {
          errorType = 'connection_refused'
        } else if (err.code === 'ENOTFOUND') {
          errorType = 'dns_error'
        } else if (err.code === 'ECONNRESET') {
          errorType = 'connection_reset'
        } else if (err.response?.status) {
          errorType = `http_${err.response.status}`
          const s = err.response.status
          bucket = s >= 500 ? 'status:5xx' : s >= 400 ? 'status:4xx' : 'status:3xx'
        } else {
          errorType = 'connection_error'
        }
      }

      const pipeline = redis.pipeline()
      pipeline.incr(key(loadTestId, 'completed'))
      pipeline.incr(key(loadTestId, 'failed'))
      pipeline.incrby(key(loadTestId, 'total_latency'), latency)
      pipeline.incr(key(loadTestId, bucket))
      pipeline.expire(key(loadTestId, bucket), 3600)
      pipeline.incr(key(loadTestId, `error:${errorType}`))
      pipeline.expire(key(loadTestId, `error:${errorType}`), 3600)
      pipeline.zadd(key(loadTestId, 'latencies'), latency, `${start}-${Math.random()}`)
      pipeline.expire(key(loadTestId, 'latencies'), 3600)
      await pipeline.exec()
    }
  })

  await Promise.all(promises)

  // Decrement active users
  await redis.decrby(key(loadTestId, 'active'), batchSize)
}

// ─── Stream stats to frontend every second ────────────────────────────────────
export async function streamLoadTestStats(
  loadTestId: string,
  userId: string,
  totalUsers: number,
  intervalMs: number = 1000
): Promise<void> {
  const maxDuration = 600000 // 10 minute max
  const startTime   = Date.now()

  const interval = setInterval(async () => {
    try {
      const stats = await getLoadTestStats(loadTestId)

      io.to(`loadtest:${userId}`).emit('loadtest_update', {
        loadTestId,
        ...stats,
      })

      // Stop streaming when complete or timed out
      if (stats.completed >= totalUsers || Date.now() - startTime > maxDuration) {
        clearInterval(interval)

        // Collect detailed error breakdown
        const errorKeys = await redis.keys(key(loadTestId, 'error:*'))
        const errors: Record<string, number> = {}
        for (const errorKey of errorKeys) {
          const errorType = errorKey.split('error:')[1]
          const count = await redis.get(errorKey)
          if (count) errors[errorType] = parseInt(count)
        }

        const finalStats = await getLoadTestStats(loadTestId)

        io.to(`loadtest:${userId}`).emit('loadtest_complete', {
          loadTestId,
          ...finalStats,
          errors,
        })
      }
    } catch (err) {
      console.error('Error streaming load test stats:', err)
      clearInterval(interval)
    }
  }, intervalMs)
}