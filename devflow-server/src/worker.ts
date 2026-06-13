import 'dotenv/config'
import { Worker, Job } from 'bullmq'
import { connection } from './config/queue'
import { executeWorkflowJob } from './services/executionService'
import { executeLoadTestBatch } from './services/loadTestService'
import { WorkflowJobData } from './types/jobs'
import { LoadTestJobData } from './types/jobs'
import { connectDB } from './config/database'

export async function startWorker() {
  await connectDB()

  // Workflow execution worker — unchanged
  const workflowWorker = new Worker<WorkflowJobData>(
    'workflow-execution',
    async (job: Job<WorkflowJobData>) => {
      console.log(`[Worker] Processing job ${job.id} for workflow ${job.data.workflowId}`)
      await executeWorkflowJob(job)
      console.log(`[Worker] Completed job ${job.id}`)
    },
    {
      connection: connection as any,
      concurrency: 5,
    }
  )

  // Load test worker — high concurrency to process all batches near-simultaneously
  const loadTestWorker = new Worker<LoadTestJobData>(
    'load-test',
    async (job: Job<LoadTestJobData>) => {
      console.log(`[LoadTest] Batch ${job.data.batchIndex} — ${job.data.batchSize} users`)
      await executeLoadTestBatch(job)
    },
    {
      connection: connection as any,
      concurrency: 200, // Process 200 batches simultaneously
    }
  )

  workflowWorker.on('completed', (job) => {
    console.log(`[Worker] ✓ Job ${job.id} completed`)
  })

  workflowWorker.on('failed', (job, err) => {
    console.error(`[Worker] ✗ Job ${job?.id} failed:`, err.message)
  })

  workflowWorker.on('stalled', (jobId) => {
    console.warn(`[Worker] ⚠ Job ${jobId} stalled`)
  })

  loadTestWorker.on('failed', (job, err) => {
    console.error(`[LoadTest] ✗ Batch ${job?.data?.batchIndex} failed:`, err.message)
  })

  console.log('[Worker] Ready — waiting for jobs...')
  console.log('[LoadTest Worker] Ready — waiting for load test batches...')
}

// Only run automatically if executed directly (e.g. via `npm run worker`)
if (require.main === module) {
  startWorker().catch(console.error)
}