import { Queue } from 'bullmq';
import Redis from 'ioredis';
import {
  IQueuePort,
  ScheduleClearingJobParams,
  ScheduleNoShowJobParams
} from '../../application/ports/queue.port';

export interface BullMQAdapterConfig {
  connection?: Redis;
  escrowQueue?: Queue;
  noShowQueue?: Queue;
  queueFactory?: (name: string, opts: { connection: Redis }) => Queue;
}

/**
 * ValkeyBullMQAdapter
 * 
 * Manages distributed background delays and security countdowns on Valkey 8:
 * - 72h / 48h / 24h escrow security clearing.
 * - 15m consultation no-show evaluation timer.
 * - Idempotent job cancellation upon dispute creation.
 */
export class ValkeyBullMQAdapter implements IQueuePort {
  private readonly redisConnection: Redis;
  private readonly escrowClearingQueue: Queue;
  private readonly noShowQueue: Queue;

  constructor(config: BullMQAdapterConfig = {}) {
    if (config.connection) {
      this.redisConnection = config.connection;
    } else {
      const host = process.env.VALKEY_HOST || process.env.REDIS_HOST || 'localhost';
      const port = parseInt(process.env.VALKEY_PORT || process.env.REDIS_PORT || '6379', 10);
      this.redisConnection = new Redis({
        host,
        port,
        maxRetriesPerRequest: null,
        lazyConnect: true
      });
    }

    const createQueue =
      config.queueFactory ||
      ((name, opts) => new Queue(name, opts));

    this.escrowClearingQueue =
      config.escrowQueue ||
      createQueue('escrow-clearing-queue', {
        connection: this.redisConnection
      });

    this.noShowQueue =
      config.noShowQueue ||
      createQueue('consultation-no-show-queue', {
        connection: this.redisConnection
      });
  }

  /**
   * Schedules delayed escrow disbursement upon completion of client approval or inactivity
   */
  public async scheduleEscrowClearing(params: ScheduleClearingJobParams): Promise<string> {
    const jobId = `clear-contract-${params.contractId}`;
    const delayMs = params.delayHours * 60 * 60 * 1000;

    await this.escrowClearingQueue.add(
      'process-clearing',
      { contractId: params.contractId },
      {
        jobId,
        delay: delayMs,
        removeOnComplete: true,
        removeOnFail: false
      }
    );

    return jobId;
  }

  /**
   * Cancels a scheduled escrow disbursement job immediately when a dispute is opened
   */
  public async cancelEscrowClearing(contractId: string): Promise<boolean> {
    const jobId = `clear-contract-${contractId}`;
    const job = await this.escrowClearingQueue.getJob(jobId);

    if (job) {
      await job.remove();
      return true;
    }

    return false;
  }

  /**
   * Schedules automated 15-minute verification evaluation following scheduled consultation start
   */
  public async scheduleNoShowCheck(params: ScheduleNoShowJobParams): Promise<string> {
    const jobId = `no-show-check-${params.sessionId}`;
    const delayMs = params.delayMinutes * 60 * 1000;

    await this.noShowQueue.add(
      'evaluate-no-show',
      { sessionId: params.sessionId },
      {
        jobId,
        delay: delayMs,
        removeOnComplete: true
      }
    );

    return jobId;
  }

  public async close(): Promise<void> {
    await this.escrowClearingQueue.close();
    await this.noShowQueue.close();
    await this.redisConnection.quit();
  }
}
