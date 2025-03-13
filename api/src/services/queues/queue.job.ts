import { Queue, QueueEvents, Worker } from 'bullmq';
import config from '../../config';

class JobQueue {
  queue: Queue;
  queueWorker: Worker;
  queueEvents: QueueEvents;
  worker: any;

  constructor(
    queueName = `${config.app.env}_default-queue`,
    worker: any,
    opts: any = {
      queue: {},
      worker: {},
      onFailed: null,
      onCompleted: null,
    },
  ) {
    this.queue = new Queue(queueName, { ...opts?.queue, connection: config.redis });
    this.queueEvents = new QueueEvents(queueName, { ...opts?.queue, connection: config.redis });
    this.worker = worker;
    this.queueWorker = new Worker(
      queueName,
      async job => {
        if (typeof this.worker === 'function') {
          return this.worker(job);
        } else {
          console.error('[JOB] Worker not set or is not a function!');
          return job;
        }
      },
      { ...opts?.worker, connection: config.redis },
    );

    this.queueEvents.on('completed', job => {
      console.log(`[JOB] Job ${job?.jobId} completed successfully.`);
      if (opts?.onCompleted) {
        opts.onCompleted(job);
      }
    });

    this.queueEvents.on('failed', async ({ jobId, failedReason }: { jobId: string; failedReason: string }) => {
      if (opts?.onFailed) {
        opts.onFailed({ jobId, failedReason });
      }
      console.error(`[JOB] Job ${jobId} failed: ${failedReason}`);
    });
  }

  addQueue(name, data, options = {}) {
    this.queue.add(name, data, options).then(result => {
      console.log(`[JOB] Task '${name}' added to the queue successfully. Job ID: ${result?.id}`);
      return true;
    });
  }

  public removeAllRepeatable = async (): Promise<void> => {
    const queue = this.queue;
    const repeatableJobs = await queue.getRepeatableJobs();
    console.log(`[JOB] Total repeatable jobs for ${queue?.name} to be removed: ${repeatableJobs.length}`);

    for (const repeatableJob of repeatableJobs) {
      await queue.removeRepeatableByKey(repeatableJob.key);
      console.log(`[JOB] Removed repeatable job with key: ${repeatableJob.key}`);
    }
  };
}

export default JobQueue;
