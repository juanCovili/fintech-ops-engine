import { Queue } from 'bullmq';
import { CONFIG } from '../config';

export const RECONCILIATION_QUEUE_NAME = 'sii-reconciliation-queue';

export const reconciliationQueue = new Queue(RECONCILIATION_QUEUE_NAME, {
  connection: {
    host: CONFIG.REDIS.host,
    port: CONFIG.REDIS.port,
  },
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: true,
    removeOnFail: false,
  },
});
