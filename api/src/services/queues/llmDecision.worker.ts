import { Job } from 'bullmq';
import BaseService from '../baseService.service';
import JobQueue from './queue.job';
import config from '@config';
import LlmService from '@services/llm.service';

/**
 * LLMDecisionWorker class is responsible for managing the LLM decision jobs queue.
 * It extends the BaseService class and uses BullMQ for job queue management.
 */
class LLMDecisionWorker extends BaseService {
  public static instance: LLMDecisionWorker;

  public llmDecisionQueue: JobQueue;
  public llmService: LlmService | null = null;

  /**
   * Constructor to implement Singleton pattern.
   */
  constructor() {
    super();
    this.llmDecisionQueue = new JobQueue(
      `${config.app.env}_decision-queues`,
      async (job: Job) => {
        if (job?.data?.action) {
          console.log('Running actions');
          // Dynamically call the method based on action specified in job data
          return await this.llmDecisionQueue[job.data.action](job?.data?.data);
        } else {
          console.warn('No action for this job');
          return await this.llmService.makeDecision();
        }
      },
      {
        onFailed: (job: Job, error: Error) => {
          console.log(`Job ${job?.id} failed: ${error?.message}`);
          // Perform any actions needed on job failure, e.g., logging, notification, etc.
        },
      },
    );
  }

  /**
   * Get the singleton instance of LLMDecisionWorker.
   * @returns {LLMDecisionWorker} Instance of LLMDecisionWorker.
   */
  public static getInstance(): LLMDecisionWorker {
    if (!LLMDecisionWorker.instance) {
      LLMDecisionWorker.instance = new LLMDecisionWorker();
    }
    return LLMDecisionWorker.instance;
  }

  /**
   * Handle job failure.
   * @param {Object} data - Contains jobId and failedReason.
   * @param {string} data.jobId - The ID of the failed job.
   * @param {string} data.failedReason - Reason for job failure.
   * @returns {Promise<boolean>} - Returns true upon handling the failure.
   */
  public async onFailure(data: { jobId: string; failedReason: string }): Promise<boolean> {
    console.log(`Job ${data.jobId} failed: ${data.failedReason}`);
    // Perform any actions needed on job failure
    return true;
  }
}

export default LLMDecisionWorker;
