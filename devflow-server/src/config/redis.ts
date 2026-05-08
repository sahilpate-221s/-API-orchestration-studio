import Redis from 'ioredis'

const redisOptions = {
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: Number(process.env.REDIS_PORT) || 6379,
  retryStrategy(times: number) {
    return Math.min(times * 50, 2000);
  },
}

const redis = process.env.REDIS_URL 
  ? new Redis(process.env.REDIS_URL, redisOptions) 
  : new Redis(redisOptions)

redis.on('connect', () => console.log('✅ Redis connected successfully'))
redis.on('error', (err) => console.error('❌ Redis connection error:', err))

export default redis
