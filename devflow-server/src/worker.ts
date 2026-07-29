import 'dotenv/config'
import { Worker, Job } from 'bullmq'
import { connection } from './config/queue'
import { executeWorkflowJob } from './services/executionService'
import { WorkflowJobData } from './types/jobs'
import { connectDB } from './config/database'

export async function startWorker() {
  await connectDB()

  // Workflow execution worker — handles API workflow runs from the canvas
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

  workflowWorker.on('completed', (job) => {
    console.log(`[Worker] ✓ Job ${job.id} completed`)
  })

  workflowWorker.on('failed', (job, err) => {
    console.error(`[Worker] ✗ Job ${job?.id} failed:`, err.message)
  })

  workflowWorker.on('stalled', (jobId) => {
    console.warn(`[Worker] ⚠ Job ${jobId} stalled`)
  })

  console.log('[Worker] Ready — waiting for workflow jobs...')
  // NOTE: Load tests no longer go through BullMQ — they run directly in-process.
  // See services/loadTestService.ts → runLoadTest()
}

// Only run automatically if executed directly (e.g. via `npm run worker`)
if (require.main === module) {
  startWorker().catch(console.error)
}