// import axios from 'axios'
// import { io } from '../socket'
// import redis from '../config/redis'

// // ─── Per-test abort ─────────────────────────────────────────────────────────
// const activeTests = new Map<string, { aborted: boolean }>()
// export function stopLoadTest(id: string) { const h = activeTests.get(id); if (h) h.aborted = true }

// // ─── Redis helpers ──────────────────────────────────────────────────────────
// const k   = (id: string, f: string) => `lt:${id}:${f}`
// const TTL = 3600

// export type LoadTestMode = 'spike' | 'ramp' | 'wave'

// // ─── Stub for compat ────────────────────────────────────────────────────────
// export async function initRedis(id: string, total: number) {
//   // Setup handled internally by runLoadTest
// }

// // ─── Read stats ─────────────────────────────────────────────────────────────
// export async function getStats(id: string) {
//   const p = redis.pipeline()
//   p.get(k(id, 'total'))              // 0
//   p.get(k(id, 'completed'))          // 1
//   p.get(k(id, 'successful'))         // 2
//   p.get(k(id, 'failed'))             // 3
//   p.get(k(id, 'total_latency'))      // 4
//   p.get(k(id, 'start_time'))         // 5
//   p.get(k(id, 'active'))             // 6
//   p.get(k(id, 'status:2xx'))         // 7
//   p.get(k(id, 'status:3xx'))         // 8
//   p.get(k(id, 'status:4xx'))         // 9
//   p.get(k(id, 'status:5xx'))         // 10
//   p.get(k(id, 'status:timeout'))     // 11
//   p.get(k(id, 'status:conn_error'))  // 12
//   p.get(k(id, 'speed:fast'))         // 13
//   p.get(k(id, 'speed:ok'))           // 14
//   p.get(k(id, 'speed:slow'))         // 15
//   p.get(k(id, 'speed:very_slow'))    // 16
//   p.get(k(id, 'min_latency'))        // 17
//   p.get(k(id, 'max_latency'))        // 18
//   p.get(k(id, 'verdict'))            // 19
//   p.get(k(id, 'verdict_desc'))       // 20
//   p.get(k(id, 'errors_json'))        // 21
//   p.get(k(id, 'duration_seconds'))   // 22
  
//   const r = await p.exec()
//   const n = (i: number) => parseInt((r?.[i]?.[1] as string) ?? '0') || 0

//   const total = n(0), completed = n(1), successful = n(2), failed = n(3)
//   const totalLat = n(4), startTime = n(5), active = n(6)
//   const minLatency = n(17)
//   const maxLatency = n(18)
//   const verdict = (r?.[19]?.[1] as string) || 'Excellent'
//   const verdictDesc = (r?.[20]?.[1] as string) || ''
//   const errors = JSON.parse((r?.[21]?.[1] as string) || '{}')

//   const elapsed       = startTime > 0 ? (Date.now() - startTime) / 1000 : 0
//   const durationSecs  = parseInt((r?.[22]?.[1] as string) ?? '30') || 30
//   const avgLatency    = completed > 0 ? Math.round(totalLat / (successful || 1)) : 0
//   const rps           = elapsed   > 0 ? Math.round(completed / elapsed) : 0

//   return {
//     total, completed, successful, failed,
//     avgLatency, minLatency, maxLatency, rps, active,
//     elapsed: Math.round(elapsed * 10) / 10,
//     successRate: completed > 0 ? Math.round((successful / completed) * 100) : 0,
//     // Progress = how far through the TEST DURATION we are, not completed/VUs
//     progress: Math.min(100, Math.round((elapsed / durationSecs) * 100)),
//     statusCodes: { s2xx: n(7), s3xx: n(8), s4xx: n(9), s5xx: n(10), sTimeout: n(11), sConnErr: n(12) },
//     speed: { fast: n(13), ok: n(14), slow: n(15), verySlow: n(16) },
//     verdict,
//     verdictDesc,
//     errors,
//   }
// }

// // ─── Main Simulation Runner ──────────────────────────────────────────────────
// export async function runLoadTest(params: {
//   loadTestId: string
//   userId: string
//   targetUrl: string
//   method: string
//   headers: Record<string, string>
//   body?: string
//   mode: LoadTestMode
//   totalUsers: number
//   durationSeconds: number
//   serverCores?: number
//   dbPoolLimit?: number
//   maxQueueBacklog?: number
//   serverMemoryGB?: number
//   networkBandwidthMbps?: number
// }): Promise<void> {
//   const {
//     loadTestId, userId, targetUrl, method, headers, body, mode, totalUsers, durationSeconds,
//     serverCores = 16,
//     dbPoolLimit = 200,
//     maxQueueBacklog = 50000,
//     serverMemoryGB = 16,
//     networkBandwidthMbps = 10000
//   } = params

//   const handle = { aborted: false }
//   activeTests.set(loadTestId, handle)

//   const logs: string[] = []
//   const pushLog = (level: 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL', msg: string) => {
//     const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
//     logs.push(`[${time}] [${level}] ${msg}`)
//     if (logs.length > 50) logs.shift()
//   }

//   pushLog('INFO', `Starting system diagnostics for target: ${method} ${targetUrl}`)
  
//   // 1. Baseline profile phase
//   let baseLatency = 15 // ms
//   let baseOk = true
//   let baseStatus = 200
//   let serverHeader = 'Nginx/1.22.1'

//   try {
//     const t0 = Date.now()
//     const parsedBody = body ? JSON.parse(body) : undefined
//     const res = await axios({
//       method: method.toLowerCase() as any,
//       url: targetUrl,
//       headers,
//       data: parsedBody,
//       timeout: 5000,
//       validateStatus: () => true
//     })
//     baseLatency = Math.max(5, Date.now() - t0)
//     baseStatus = res.status
//     baseOk = res.status >= 200 && res.status < 400
//     serverHeader = res.headers['server'] || res.headers['x-powered-by'] || 'Express/NodeJS'
//     pushLog('INFO', `Diagnostics OK. Baseline status: ${baseStatus}, latency: ${baseLatency}ms, remote server: ${serverHeader}`)
//   } catch (err: any) {
//     baseOk = false
//     baseLatency = 180
//     pushLog('ERROR', `Baseline connection failed: ${err.message}. Simulating disconnected state.`)
//   }

//   // 2. Initialize Redis Keys
//   const startTimeStamp = Date.now()
//   const p = redis.pipeline()
//   p.set(k(loadTestId, 'total'), totalUsers)
//   p.set(k(loadTestId, 'completed'), 0)
//   p.set(k(loadTestId, 'successful'), 0)
//   p.set(k(loadTestId, 'failed'), 0)
//   p.set(k(loadTestId, 'total_latency'), 0)
//   p.set(k(loadTestId, 'start_time'), startTimeStamp)
//   p.set(k(loadTestId, 'duration_seconds'), durationSeconds)
//   p.set(k(loadTestId, 'active'), 0)
//   p.set(k(loadTestId, 'status:2xx'), 0)
//   p.set(k(loadTestId, 'status:3xx'), 0)
//   p.set(k(loadTestId, 'status:4xx'), 0)
//   p.set(k(loadTestId, 'status:5xx'), 0)
//   p.set(k(loadTestId, 'status:timeout'), 0)
//   p.set(k(loadTestId, 'status:conn_error'), 0)
//   p.set(k(loadTestId, 'speed:fast'), 0)
//   p.set(k(loadTestId, 'speed:ok'), 0)
//   p.set(k(loadTestId, 'speed:slow'), 0)
//   p.set(k(loadTestId, 'speed:very_slow'), 0)
//   p.set(k(loadTestId, 'min_latency'), baseLatency)
//   p.set(k(loadTestId, 'max_latency'), baseLatency)
//   p.set(k(loadTestId, 'verdict'), '')
//   p.set(k(loadTestId, 'verdict_desc'), '')
//   p.set(k(loadTestId, 'errors_json'), '{}')
//   await p.exec()

//   const keysToExpire = [
//     'total', 'completed', 'successful', 'failed', 'total_latency', 'start_time', 'duration_seconds', 'active',
//     'status:2xx', 'status:3xx', 'status:4xx', 'status:5xx', 'status:timeout', 'status:conn_error',
//     'speed:fast', 'speed:ok', 'speed:slow', 'speed:very_slow', 'min_latency', 'max_latency',
//     'verdict', 'verdict_desc', 'errors_json'
//   ]
//   const expireAll = async () => {
//     const pipeline = redis.pipeline()
//     for (const f of keysToExpire) pipeline.expire(k(loadTestId, f), TTL)
//     await pipeline.exec()
//   }
//   await expireAll()

//   // 3. Setup Simulation Ticker
//   const dt = 0.2 // tick interval (seconds)
//   const baseMemory = 140
//   let elapsed = 0
//   let queueDepth = 0
//   let completed = 0
//   let successful = 0
//   let failed = 0
//   let totalLatencySum = 0
//   let minLat = baseLatency
//   let maxLat = baseLatency

//   const statusCounts = { s2xx: 0, s3xx: 0, s4xx: 0, s5xx: 0, sTimeout: 0, sConnErr: 0 }
//   const speedCounts = { fast: 0, ok: 0, slow: 0, verySlow: 0 }
//   const errorMap: Record<string, number> = {}

//   const incrementError = (errName: string, count = 1) => {
//     errorMap[errName] = (errorMap[errName] || 0) + count
//   }

//   const rpsTimeline: number[] = []
//   const latencyTimeline: number[] = []
//   const usersTimeline: number[] = []
//   const queueTimeline: number[] = []

//   let isOom = false

//   const iv = setInterval(async () => {
//     if (handle.aborted || elapsed >= durationSeconds || isOom) {
//       clearInterval(iv)
//       await finishSimulation()
//       return
//     }

//     elapsed += dt

//     // A. Target Virtual Users (VUs) based on load pattern
//     let targetUsers = 0
//     if (mode === 'spike') {
//       targetUsers = totalUsers
//     } else if (mode === 'ramp') {
//       targetUsers = Math.round(totalUsers * Math.min(1, elapsed / durationSeconds))
//     } else if (mode === 'wave') {
//       targetUsers = Math.round(totalUsers * (0.3 + 0.7 * Math.pow(Math.sin(Math.PI * elapsed / durationSeconds), 2)))
//     }

//     // B. Calculate request arrival rate (lambda)
//     // Closed-loop model mimicking k6 VUs: users fire, wait for response, think 50ms, fire again.
//     const currentLatency = latencyTimeline.length > 0 ? latencyTimeline[latencyTimeline.length - 1] : baseLatency
//     // Realistic think time: users don't fire 20 req/s per VU — model inter-request delay realistically
//     const thinkTime = 0.5 // 500ms think time between requests (realistic k6 default)
//     const arrivalRate = targetUsers / ((Math.max(baseLatency, currentLatency) / 1000) + thinkTime)

//     // C. Model Server Saturation Parameters
//     const tCpu = 3.5 // CPU time per request in ms
//     const tDb = 15 // DB query time per request in ms
//     const dbFraction = 0.75 // 75% of requests hit DB

//     const cpuMaxRps = serverCores * (1000 / tCpu)
//     const dbMaxRps = (dbPoolLimit * (1000 / tDb)) / dbFraction
//     const responseKB = 25
//     const netMaxRps = (networkBandwidthMbps * 1024) / (responseKB * 8)

//     const serverMaxCapacity = Math.min(cpuMaxRps, dbMaxRps, netMaxRps)

//     // Resource Utilizations
//     const cpuUtil = Math.min(100, Math.round((arrivalRate / cpuMaxRps) * 100))
//     const dbActiveConns = Math.min(dbPoolLimit, Math.round(arrivalRate * dbFraction * (tDb / 1000)))
//     const dbUtil = Math.round((dbActiveConns / dbPoolLimit) * 100)
//     const netUtil = Math.min(100, Math.round((arrivalRate / netMaxRps) * 100))

//     const memUsed = baseMemory + queueDepth * 0.012 // 12KB per request in memory
//     const memUtil = Math.min(100, Math.round((memUsed / (serverMemoryGB * 1024)) * 100))

//     // D. Latency Overhead Additions
//     let cpuDelay = 0
//     if (cpuUtil > 80) {
//       cpuDelay = baseLatency * 0.3 * (cpuUtil / (101 - cpuUtil))
//     }

//     let dbDelay = 0
//     if (dbUtil >= 95) {
//       dbDelay = tDb * 0.75 * ((arrivalRate * dbFraction * (tDb / 1000)) / dbPoolLimit)
//     }

//     const requestProcessTime = baseLatency + cpuDelay + dbDelay

//     // E. Queue backpressure (OS / Gateway Queueing)
//     const deltaQueue = (arrivalRate - serverMaxCapacity) * dt
//     queueDepth = Math.max(0, queueDepth + deltaQueue)

//     let queueDelay = 0
//     if (queueDepth > 0) {
//       queueDelay = (queueDepth / serverMaxCapacity) * 1000
//     }

//     let totalRequestLatency = requestProcessTime + queueDelay
//     if (totalRequestLatency < 5) totalRequestLatency = baseLatency

//     // F. OOM Crash Condition
//     if (memUtil >= 100) {
//       isOom = true
//       pushLog('CRITICAL', `FATAL: NodeJS server heap out of memory! RAM limit of ${serverMemoryGB}GB exceeded.`)
//       return
//     }

//     // G. Request Status Resolution
//     const totalRequestsTick = Math.round(arrivalRate * dt)
//     let dropped503s = 0
//     let timeoutCount = 0
//     let successCount = 0

//     // Queue backlog overflow check
//     if (queueDepth > maxQueueBacklog) {
//       const excess = queueDepth - maxQueueBacklog
//       dropped503s = Math.min(totalRequestsTick, Math.round(excess))
//       queueDepth = maxQueueBacklog
//     }

//     // Gateway Timeout check (> 60s — more realistic gateway default)
//     if (totalRequestLatency >= 60000) {
//       timeoutCount = totalRequestsTick - dropped503s
//     } else {
//       successCount = totalRequestsTick - dropped503s - timeoutCount
//     }

//     successCount = Math.max(0, successCount)

//     completed += totalRequestsTick
//     failed += dropped503s + timeoutCount
//     successful += successCount

//     if (successCount > 0) {
//       totalLatencySum += successCount * totalRequestLatency
//       minLat = Math.min(minLat, totalRequestLatency)
//       maxLat = Math.max(maxLat, totalRequestLatency)
//     }

//     // Register Status Codes
//     if (baseOk) {
//       statusCounts.s2xx += successCount
//     } else {
//       statusCounts.sConnErr += successCount
//       failed += successCount
//       successful -= successCount
//     }

//     statusCounts.s5xx += dropped503s
//     statusCounts.sTimeout += timeoutCount

//     if (dropped503s > 0) incrementError('HTTP_503_Service_Unavailable', dropped503s)
//     if (timeoutCount > 0) incrementError('HTTP_504_Gateway_Timeout', timeoutCount)
//     if (!baseOk && successCount > 0) {
//       incrementError('Connection_Refused', successCount)
//     }

//     // Classify latency speed
//     const classifySpeed = (ms: number, count: number) => {
//       if (ms < 500) speedCounts.fast += count
//       else if (ms < 2000) speedCounts.ok += count
//       else if (ms < 10000) speedCounts.slow += count
//       else speedCounts.verySlow += count
//     }
//     if (successCount > 0) {
//       classifySpeed(totalRequestLatency, successCount)
//     }

//     // Record timeline values
//     const currentRps = Math.round(successCount / dt)
//     rpsTimeline.push(currentRps)
//     latencyTimeline.push(Math.round(totalRequestLatency))
//     usersTimeline.push(targetUsers)
//     queueTimeline.push(Math.round(queueDepth))

//     // Write alert logs based on thresholds
//     if (cpuUtil > 90) {
//       pushLog('WARN', `CPU load high (${cpuUtil}%). Thread context switching adding +${Math.round(cpuDelay)}ms delay.`)
//     }
//     if (dbUtil > 95) {
//       pushLog('WARN', `Database connection pool saturated (${dbActiveConns}/${dbPoolLimit} conns). DB Queries wait queue growing.`)
//     }
//     if (queueDepth > maxQueueBacklog * 0.6 && dropped503s === 0) {
//       pushLog('WARN', `Gateway queue backlog filling up: ${Math.round(queueDepth)} / ${maxQueueBacklog} buffered.`)
//     }
//     if (dropped503s > 0) {
//       pushLog('ERROR', `Gateway overflow. Queue backlog full. Dropping ${dropped503s} connections with HTTP 503.`)
//     }
//     if (timeoutCount > 0) {
//       pushLog('ERROR', `Gateway timeout (504). ${timeoutCount} requests exceeded 30s connection timeout limit.`)
//     }

//     // Write to Redis
//     const pipeline = redis.pipeline()
//     pipeline.set(k(loadTestId, 'completed'), completed)
//     pipeline.set(k(loadTestId, 'successful'), successful)
//     pipeline.set(k(loadTestId, 'failed'), failed)
//     pipeline.set(k(loadTestId, 'total_latency'), totalLatencySum)
//     pipeline.set(k(loadTestId, 'active'), Math.round(queueDepth))
//     pipeline.set(k(loadTestId, 'status:2xx'), statusCounts.s2xx)
//     pipeline.set(k(loadTestId, 'status:3xx'), statusCounts.s3xx)
//     pipeline.set(k(loadTestId, 'status:4xx'), statusCounts.s4xx)
//     pipeline.set(k(loadTestId, 'status:5xx'), statusCounts.s5xx)
//     pipeline.set(k(loadTestId, 'status:timeout'), statusCounts.sTimeout)
//     pipeline.set(k(loadTestId, 'status:conn_error'), statusCounts.sConnErr)
//     pipeline.set(k(loadTestId, 'speed:fast'), speedCounts.fast)
//     pipeline.set(k(loadTestId, 'speed:ok'), speedCounts.ok)
//     pipeline.set(k(loadTestId, 'speed:slow'), speedCounts.slow)
//     pipeline.set(k(loadTestId, 'speed:very_slow'), speedCounts.verySlow)
//     pipeline.set(k(loadTestId, 'min_latency'), Math.round(minLat))
//     pipeline.set(k(loadTestId, 'max_latency'), Math.round(maxLat))
//     pipeline.set(k(loadTestId, 'errors_json'), JSON.stringify(errorMap))
//     await pipeline.exec()

//     await expireAll()

//     // Emit live stats update
//     const currentStats = await getStats(loadTestId)
//     io.to(`loadtest:${userId}`).emit('loadtest_update', {
//       loadTestId,
//       ...currentStats,
//       instantRps: currentRps,
//       rpsTimeline: rpsTimeline.slice(-120),
//       latencyTimeline: latencyTimeline.slice(-120),
//       usersTimeline: usersTimeline.slice(-120),
//       queueTimeline: queueTimeline.slice(-120),
//       telemetry: {
//         cpu: cpuUtil,
//         memory: memUtil,
//         dbPool: dbUtil,
//         network: netUtil,
//         activeUsers: targetUsers,
//         queueDepth: Math.round(queueDepth)
//       },
//       logs: logs.slice(-20)
//     })
//   }, 200)

//   async function finishSimulation() {
//     let finalVerdict = 'Excellent'
//     let explanation = 'Your API performed perfectly under the simulated load. Latency is low and errors are zero.'
    
//     const hasOom = isOom
//     const totalFailed = failed
//     const finalStats = await getStats(loadTestId)
//     const avgLat = finalStats.avgLatency

//     const failRate = (finalStats.total > 0) ? (totalFailed / finalStats.total) : 0
//     const dbBottleneck = statusCounts.s5xx > 0 &&
//       finalStats.speed.slow + finalStats.speed.verySlow > finalStats.speed.fast + finalStats.speed.ok &&
//       statusCounts.s5xx < statusCounts.sTimeout * 3

//     if (hasOom) {
//       finalVerdict = 'Out Of Memory'
//       explanation = `The API crashed because the server memory exceeded the allocated limit of ${serverMemoryGB}GB. Buffered request backlogs overloaded the server heap. Consider increasing RAM.`
//     } else if (statusCounts.sTimeout > 0 && failRate > 0.5) {
//       // Majority of requests timed out — event loop blocked
//       finalVerdict = 'Request Timeout'
//       explanation = `API requests exceeded the 60-second gateway threshold. The server event loop was fully saturated at this concurrency level, delaying all queued requests.`
//     } else if (statusCounts.s5xx > 0 && failRate > 0.3 && dbBottleneck) {
//       // Many 503 drops AND latency is high — DB pool bottleneck
//       finalVerdict = 'Database Pool Starvation'
//       explanation = `The DB connection pool (${dbPoolLimit} conns) saturated under this load. Queries waited for a free connection, creating backpressure and triggering HTTP 503 drops.`
//     } else if (statusCounts.s5xx > 0 && failRate > 0.1) {
//       // Some 503 drops — CPU exhaustion driving queue overflow
//       finalVerdict = 'CPU Saturated'
//       explanation = `Server CPU (${serverCores} cores) reached saturation at this concurrency level. Request queue overflowed, dropping connections with HTTP 503.`
//     } else if (avgLat > 3000) {
//       finalVerdict = 'CPU Saturated'
//       explanation = `Server CPU cores (${serverCores}) were saturated at 100%. Processing queues and scheduler context-switching delayed API responses significantly.`
//     } else if (avgLat > 500) {
//       finalVerdict = 'Degraded Performance'
//       explanation = `Response times climbed under load (avg ${avgLat}ms). The server is coping but latency is elevated. Optimize SQL indexes and implement caching.`
//     }

//     const pipeline = redis.pipeline()
//     pipeline.set(k(loadTestId, 'verdict'), finalVerdict)
//     pipeline.set(k(loadTestId, 'verdict_desc'), explanation)
//     await pipeline.exec()

//     await expireAll()

//     const finalResult = await getStats(loadTestId)
//     io.to(`loadtest:${userId}`).emit('loadtest_complete', {
//       loadTestId,
//       ...finalResult,
//       instantRps: 0,
//       rpsTimeline,
//       latencyTimeline,
//       usersTimeline,
//       queueTimeline,
//       telemetry: {
//         cpu: 0,
//         memory: Math.round(baseMemory / (serverMemoryGB * 10.24)),
//         dbPool: 0,
//         network: 0,
//         activeUsers: 0,
//         queueDepth: 0
//       },
//       verdict: finalVerdict,
//       verdictDesc: explanation,
//       errors: errorMap,
//       logs: logs.slice(-20)
//     })

//     activeTests.delete(loadTestId)
//   }
// }




import axios from 'axios'
import dns from 'dns/promises'
import net from 'net'
import { io } from '../socket'
import redis from '../config/redis'

// ─── Per-test abort ─────────────────────────────────────────────────────────
const activeTests = new Map<string, { aborted: boolean }>()
export function stopLoadTest(id: string) {
  const h = activeTests.get(id)
  if (h) h.aborted = true
}

// ─── Redis helpers ──────────────────────────────────────────────────────────
const k = (id: string, f: string) => `lt:${id}:${f}`
const TTL = 3600

export type LoadTestMode = 'spike' | 'ramp' | 'wave'

// ─── Stub kept for compat with existing controller calls ───────────────────
export async function initRedis(_id: string, _total: number) {
  // no-op, setup happens inside runLoadTest
}

// ─── SSRF guard — blocks internal/private targets since users supply any URL ─
const BLOCKED_HOST_RANGES = [
  /^127\./, /^10\./, /^192\.168\./, /^169\.254\./,
  /^172\.(1[6-9]|2\d|3[01])\./, /^0\.0\.0\.0$/,
]
async function assertTargetAllowed(targetUrl: string): Promise<void> {
  let host: string
  try {
    host = new URL(targetUrl).hostname
  } catch {
    throw new Error('Invalid target URL')
  }
  if (host === 'localhost' || host === '::1') {
    throw new Error('Targeting localhost is not allowed')
  }
  if (net.isIP(host)) {
    if (BLOCKED_HOST_RANGES.some((r) => r.test(host))) {
      throw new Error('Target resolves to a blocked internal address')
    }
    return
  }
  try {
    const addrs = await dns.lookup(host, { all: true })
    for (const a of addrs) {
      if (BLOCKED_HOST_RANGES.some((r) => r.test(a.address))) {
        throw new Error(`Target resolves to a blocked internal address (${a.address})`)
      }
    }
  } catch (e: any) {
    if (e.message?.includes('blocked internal')) throw e
    throw new Error('Could not resolve target host')
  }
}

// ─── Read stats (used by any polling/history routes) ────────────────────────
export async function getStats(id: string) {
  const p = redis.pipeline()
  p.get(k(id, 'total'))
  p.get(k(id, 'completed'))
  p.get(k(id, 'successful'))
  p.get(k(id, 'failed'))
  p.get(k(id, 'total_latency'))
  p.get(k(id, 'start_time'))
  p.get(k(id, 'status:2xx'))
  p.get(k(id, 'status:3xx'))
  p.get(k(id, 'status:4xx'))
  p.get(k(id, 'status:5xx'))
  p.get(k(id, 'status:timeout'))
  p.get(k(id, 'status:conn_error'))
  p.get(k(id, 'min_latency'))
  p.get(k(id, 'max_latency'))
  p.get(k(id, 'p50'))
  p.get(k(id, 'p95'))
  p.get(k(id, 'p99'))
  p.get(k(id, 'verdict'))
  p.get(k(id, 'verdict_desc'))
  p.get(k(id, 'errors_json'))
  p.get(k(id, 'duration_seconds'))

  const r = await p.exec()
  const n = (i: number) => parseInt((r?.[i]?.[1] as string) ?? '0') || 0

  const total = n(0), completed = n(1), successful = n(2), failed = n(3)
  const totalLat = n(4), startTime = n(5)
  const durationSecs = n(19) || 30
  const verdict = (r?.[17]?.[1] as string) || ''
  const verdictDesc = (r?.[18]?.[1] as string) || ''
  const errors = JSON.parse((r?.[20]?.[1] as string) || '{}')
  const elapsed = startTime > 0 ? (Date.now() - startTime) / 1000 : 0

  return {
    total, completed, successful, failed,
    avgLatency: successful > 0 ? Math.round(totalLat / successful) : 0,
    minLatency: n(12), maxLatency: n(13),
    p50: n(14), p95: n(15), p99: n(16),
    rps: elapsed > 0 ? Math.round(completed / elapsed) : 0,
    elapsed: Math.round(elapsed * 10) / 10,
    successRate: completed > 0 ? Math.round((successful / completed) * 100) : 0,
    progress: Math.min(100, Math.round((elapsed / durationSecs) * 100)),
    statusCodes: {
      s2xx: n(6), s3xx: n(7), s4xx: n(8), s5xx: n(9),
      sTimeout: n(10), sConnErr: n(11),
    },
    verdict,
    verdictDesc,
    errors,
  }
}

function percentile(sorted: number[], p: number): number {
  if (!sorted.length) return 0
  const idx = Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length))
  return sorted[idx]
}

// ─── Main real load test runner ──────────────────────────────────────────────
export async function runLoadTest(params: {
  loadTestId: string
  userId: string
  targetUrl: string
  method: string
  headers: Record<string, string>
  body?: string
  mode: LoadTestMode
  totalUsers: number
  durationSeconds: number
}): Promise<void> {
  const {
    loadTestId, userId, targetUrl, method, headers, body, mode,
    durationSeconds,
  } = params

  // Hard cap — a single Node process cannot realistically sustain more
  // than a few thousand real concurrent virtual users.
  const totalUsers = Math.min(params.totalUsers, 3000)

  await assertTargetAllowed(targetUrl)

  const handle = { aborted: false }
  activeTests.set(loadTestId, handle)

  const parsedBody = body
    ? (() => { try { return JSON.parse(body) } catch { return body } })()
    : undefined

  const startTime = Date.now()
  const endTime = startTime + durationSeconds * 1000

  // ── Real counters — every value here comes from an actual HTTP response ──
  let completed = 0
  let successful = 0
  let failed = 0
  let totalLatencySum = 0
  let minLat = Infinity
  let maxLat = 0
  const statusCounts = { s2xx: 0, s3xx: 0, s4xx: 0, s5xx: 0, sTimeout: 0, sConnErr: 0 }
  const errorMap: Record<string, number> = {}
  const allLatencies: number[] = []

  // Rolling bucket, reset every emit tick, for windowed rps
  let bucketCompleted = 0

  const bumpErr = (key: string) => { errorMap[key] = (errorMap[key] || 0) + 1 }

  // Init redis keys
  const initP = redis.pipeline()
  initP.set(k(loadTestId, 'total'), totalUsers)
  initP.set(k(loadTestId, 'start_time'), startTime)
  initP.set(k(loadTestId, 'duration_seconds'), durationSeconds)
  initP.set(k(loadTestId, 'verdict'), '')
  initP.set(k(loadTestId, 'verdict_desc'), '')
  initP.set(k(loadTestId, 'errors_json'), '{}')
  await initP.exec()

  async function persistStats() {
    const sorted = [...allLatencies].sort((a, b) => a - b)
    const p = redis.pipeline()
    p.set(k(loadTestId, 'completed'), completed)
    p.set(k(loadTestId, 'successful'), successful)
    p.set(k(loadTestId, 'failed'), failed)
    p.set(k(loadTestId, 'total_latency'), totalLatencySum)
    p.set(k(loadTestId, 'status:2xx'), statusCounts.s2xx)
    p.set(k(loadTestId, 'status:3xx'), statusCounts.s3xx)
    p.set(k(loadTestId, 'status:4xx'), statusCounts.s4xx)
    p.set(k(loadTestId, 'status:5xx'), statusCounts.s5xx)
    p.set(k(loadTestId, 'status:timeout'), statusCounts.sTimeout)
    p.set(k(loadTestId, 'status:conn_error'), statusCounts.sConnErr)
    p.set(k(loadTestId, 'min_latency'), minLat === Infinity ? 0 : Math.round(minLat))
    p.set(k(loadTestId, 'max_latency'), Math.round(maxLat))
    p.set(k(loadTestId, 'p50'), percentile(sorted, 50))
    p.set(k(loadTestId, 'p95'), percentile(sorted, 95))
    p.set(k(loadTestId, 'p99'), percentile(sorted, 99))
    p.set(k(loadTestId, 'errors_json'), JSON.stringify(errorMap))
    p.expire(k(loadTestId, 'total'), TTL)
    p.expire(k(loadTestId, 'completed'), TTL)
    p.expire(k(loadTestId, 'successful'), TTL)
    p.expire(k(loadTestId, 'failed'), TTL)
    await p.exec()
  }

  // ── One real request ────────────────────────────────────────────────────
  async function fireOnce() {
    const t0 = Date.now()
    try {
      const res = await axios({
        method: method.toLowerCase() as any,
        url: targetUrl,
        headers,
        data: parsedBody,
        timeout: 15000,
        validateStatus: () => true,
      })
      const latency = Date.now() - t0
      completed++; bucketCompleted++
      allLatencies.push(latency)
      totalLatencySum += latency
      minLat = Math.min(minLat, latency)
      maxLat = Math.max(maxLat, latency)

      if (res.status < 400) {
        successful++
        if (res.status < 300) statusCounts.s2xx++
        else statusCounts.s3xx++
      } else {
        failed++
        if (res.status < 500) statusCounts.s4xx++
        else statusCounts.s5xx++
        bumpErr(`HTTP_${res.status}`)
      }
    } catch (err: any) {
      const latency = Date.now() - t0
      completed++; bucketCompleted++; failed++
      allLatencies.push(latency)
      totalLatencySum += latency
      minLat = Math.min(minLat, latency)
      maxLat = Math.max(maxLat, latency)

      if (err.code === 'ECONNABORTED') {
        statusCounts.sTimeout++
        bumpErr('Timeout')
      } else {
        statusCounts.sConnErr++
        bumpErr(err.code || 'Connection_Error')
      }
    }
  }

  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

  function isVuActiveNow(vuIndex: number): boolean {
    const elapsedMs = Date.now() - startTime
    const frac = Math.min(1, elapsedMs / (durationSeconds * 1000))
    let activeCount = totalUsers
    if (mode === 'ramp') activeCount = Math.round(totalUsers * frac)
    if (mode === 'wave') {
      activeCount = Math.round(totalUsers * (0.3 + 0.7 * Math.sin(Math.PI * frac) ** 2))
    }
    return vuIndex < activeCount
  }

  // ── Real concurrent virtual user loop ───────────────────────────────────
  async function vuLoop(vuIndex: number) {
    while (!handle.aborted && Date.now() < endTime) {
      if (!isVuActiveNow(vuIndex)) {
        await sleep(100)
        continue
      }
      await fireOnce()
      await sleep(200) // think time between requests per VU
    }
  }

  const vuPromises = Array.from({ length: totalUsers }, (_, i) => vuLoop(i))

  // ── Emit aggregated real stats every 500ms — fixes "too much data" ───────
  const emitIv = setInterval(async () => {
    await persistStats()
    const stats = await getStats(loadTestId)
    io.to(`loadtest:${userId}`).emit('loadtest_update', {
      loadTestId,
      ...stats,
      instantRps: Math.round(bucketCompleted / 0.5),
    })
    bucketCompleted = 0

    if (handle.aborted || Date.now() >= endTime) {
      clearInterval(emitIv)
    }
  }, 500)

  await Promise.all(vuPromises)
  clearInterval(emitIv)
  await persistStats()

  // ── Verdict derived from real observed numbers ───────────────────────────
  const failRate = completed > 0 ? failed / completed : 0
  const sorted = [...allLatencies].sort((a, b) => a - b)
  const p95 = percentile(sorted, 95)

  let verdict = 'Excellent'
  let explanation = 'The API handled the real load well — low error rate and stable latency.'

  if (failRate > 0.5) {
    verdict = 'Failing Under Load'
    explanation = `${Math.round(failRate * 100)}% of real requests failed or errored at this concurrency level.`
  } else if (failRate > 0.1) {
    verdict = 'Degraded'
    explanation = `Elevated error rate (${Math.round(failRate * 100)}%) observed under real load.`
  } else if (p95 > 3000) {
    verdict = 'Slow Under Load'
    explanation = `95th percentile latency reached ${p95}ms under load — responses are slowing significantly as concurrency increases.`
  } else if (p95 > 800) {
    verdict = 'Degraded Performance'
    explanation = `Response times climbed under load (p95 ${p95}ms). Consider caching or query optimization.`
  }

  const finalP = redis.pipeline()
  finalP.set(k(loadTestId, 'verdict'), verdict)
  finalP.set(k(loadTestId, 'verdict_desc'), explanation)
  await finalP.exec()

  const finalStats = await getStats(loadTestId)
  io.to(`loadtest:${userId}`).emit('loadtest_complete', {
    loadTestId,
    ...finalStats,
    instantRps: 0,
    verdict,
    verdictDesc: explanation,
    errors: errorMap,
  })

  activeTests.delete(loadTestId)
}