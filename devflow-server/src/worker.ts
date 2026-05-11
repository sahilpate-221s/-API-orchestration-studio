import 'dotenv/config'
import { Worker, Job } from 'bullmq'
import { connection } from './config/queue'
import { executeWorkflowJob } from './services/executionService'
import { WorkflowJobData } from './types/jobs'
import { connectDB } from './config/database'

async function startWorker() {
  await connectDB()

  const worker = new Worker<WorkflowJobData>(
    'workflow-execution',
    async (job: Job<WorkflowJobData>) => {
      console.log(`[Worker] Processing job ${job.id} for workflow ${job.data.workflowId}`)
      await executeWorkflowJob(job)
      console.log(`[Worker] Completed job ${job.id}`)
    },
    {
      connection,
      concurrency: 5,
    }
  )

  worker.on('completed', (job) => {
    console.log(`[Worker] ✓ Job ${job.id} completed`)
  })

  worker.on('failed', (job, err) => {
    console.error(`[Worker] ✗ Job ${job?.id} failed:`, err.message)
  })

  worker.on('stalled', (jobId) => {
    console.warn(`[Worker] ⚠ Job ${jobId} stalled`)
  })

  console.log('[Worker] Ready — waiting for jobs...')
}

startWorker()