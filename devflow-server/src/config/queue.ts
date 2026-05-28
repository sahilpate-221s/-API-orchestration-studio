import { Queue, QueueEvents } from 'bullmq'
import IORedis from 'ioredis'

const connection = new IORedis(process.env.REDIS_URL!, {
  maxRetriesPerRequest: null
})

export const workflowQueue = new Queue('workflow-execution', {
  connection: connection as any,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
    removeOnComplete: 100,
    removeOnFail: 200,
  },
})

export const workflowQueueEvents = new QueueEvents('workflow-execution', {
  connection: connection as any
})

export { connection }