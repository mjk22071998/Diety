import { Worker, Job } from 'bullmq';
import Redis from 'ioredis';

export interface EscrowClearingWorkerConfig {
  connection?: Redis;
  workerFactory?: (
    name: string,
    processor: (job: Job<{ contractId: string }>) => Promise<void>,
    opts: { connection: Redis; concurrency: number }
  ) => Worker;
  onClearContract: (contractId: string) => Promise<void>;
}

/**
 * EscrowClearingWorker
 * 
 * Worker processing jobs when the 72h / 48h / 24h security clearing countdown expires.
 */
export class EscrowClearingWorker {
  private readonly worker: Worker;

  constructor(config: EscrowClearingWorkerConfig) {
    const host = process.env.VALKEY_HOST || process.env.REDIS_HOST || 'localhost';
    const port = parseInt(process.env.VALKEY_PORT || process.env.REDIS_PORT || '6379', 10);
    const connection =
      config.connection ||
      new Redis({
        host,
        port,
        maxRetriesPerRequest: null,
        lazyConnect: true
      });

    const factory =
      config.workerFactory ||
      ((name, processor, opts) => new Worker(name, processor, opts));

    this.worker = factory(
      'escrow-clearing-queue',
      async (job: Job<{ contractId: string }>) => {
        const { contractId } = job.data;
        await config.onClearContract(contractId);
      },
      { connection, concurrency: 5 }
    );
  }

  public async close(): Promise<void> {
    await this.worker.close();
  }
}
