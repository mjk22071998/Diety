import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ValkeyBullMQAdapter } from '../../../src/bounded-contexts/shared/infrastructure/queue/bullmq.adapter';
import { EscrowClearingWorker } from '../../../src/bounded-contexts/escrow/infrastructure/workers/escrow-clearing.worker';
import { Queue, Worker, Job } from 'bullmq';
import Redis from 'ioredis';

describe('Task 3.3: Valkey BullMQ Queue Adapter & Worker (Pure TDD)', () => {
  let mockRedis: Redis;
  let mockEscrowQueue: Queue;
  let mockNoShowQueue: Queue;

  beforeEach(() => {
    mockRedis = {
      quit: vi.fn().mockResolvedValue('OK')
    } as unknown as Redis;

    mockEscrowQueue = {
      add: vi.fn().mockResolvedValue({ id: 'job-123' }),
      getJob: vi.fn(),
      close: vi.fn().mockResolvedValue(undefined)
    } as unknown as Queue;

    mockNoShowQueue = {
      add: vi.fn().mockResolvedValue({ id: 'job-456' }),
      close: vi.fn().mockResolvedValue(undefined)
    } as unknown as Queue;
  });

  describe('ValkeyBullMQAdapter', () => {
    it('should schedule escrow clearing with correct 72h delay and jobId', async () => {
      const adapter = new ValkeyBullMQAdapter({
        connection: mockRedis,
        escrowQueue: mockEscrowQueue,
        noShowQueue: mockNoShowQueue
      });

      const jobId = await adapter.scheduleEscrowClearing({
        contractId: 'contract-abc-123',
        delayHours: 72
      });

      expect(jobId).toBe('clear-contract-contract-abc-123');
      expect(mockEscrowQueue.add).toHaveBeenCalledWith(
        'process-clearing',
        { contractId: 'contract-abc-123' },
        {
          jobId: 'clear-contract-contract-abc-123',
          delay: 72 * 60 * 60 * 1000,
          removeOnComplete: true,
          removeOnFail: false
        }
      );
    });

    it('should schedule escrow clearing with shortened tier delay (e.g., 24h for Top Rated)', async () => {
      const adapter = new ValkeyBullMQAdapter({
        connection: mockRedis,
        escrowQueue: mockEscrowQueue,
        noShowQueue: mockNoShowQueue
      });

      const jobId = await adapter.scheduleEscrowClearing({
        contractId: 'contract-top-tier',
        delayHours: 24
      });

      expect(jobId).toBe('clear-contract-contract-top-tier');
      expect(mockEscrowQueue.add).toHaveBeenCalledWith(
        'process-clearing',
        { contractId: 'contract-top-tier' },
        {
          jobId: 'clear-contract-contract-top-tier',
          delay: 24 * 60 * 60 * 1000,
          removeOnComplete: true,
          removeOnFail: false
        }
      );
    });

    it('should cancel escrow clearing job when dispute is opened and job exists', async () => {
      const mockRemove = vi.fn().mockResolvedValue(undefined);
      (mockEscrowQueue.getJob as any).mockResolvedValue({
        remove: mockRemove
      });

      const adapter = new ValkeyBullMQAdapter({
        connection: mockRedis,
        escrowQueue: mockEscrowQueue,
        noShowQueue: mockNoShowQueue
      });

      const canceled = await adapter.cancelEscrowClearing('contract-disputed-999');

      expect(canceled).toBe(true);
      expect(mockEscrowQueue.getJob).toHaveBeenCalledWith('clear-contract-contract-disputed-999');
      expect(mockRemove).toHaveBeenCalled();
    });

    it('should return false when cancelling escrow clearing job that does not exist', async () => {
      (mockEscrowQueue.getJob as any).mockResolvedValue(null);

      const adapter = new ValkeyBullMQAdapter({
        connection: mockRedis,
        escrowQueue: mockEscrowQueue,
        noShowQueue: mockNoShowQueue
      });

      const canceled = await adapter.cancelEscrowClearing('contract-non-existent');

      expect(canceled).toBe(false);
      expect(mockEscrowQueue.getJob).toHaveBeenCalledWith('clear-contract-contract-non-existent');
    });

    it('should schedule 15m consultation no-show evaluation check', async () => {
      const adapter = new ValkeyBullMQAdapter({
        connection: mockRedis,
        escrowQueue: mockEscrowQueue,
        noShowQueue: mockNoShowQueue
      });

      const jobId = await adapter.scheduleNoShowCheck({
        sessionId: 'session-webrtc-888',
        delayMinutes: 15
      });

      expect(jobId).toBe('no-show-check-session-webrtc-888');
      expect(mockNoShowQueue.add).toHaveBeenCalledWith(
        'evaluate-no-show',
        { sessionId: 'session-webrtc-888' },
        {
          jobId: 'no-show-check-session-webrtc-888',
          delay: 15 * 60 * 1000,
          removeOnComplete: true
        }
      );
    });

    it('should gracefully close queues and redis connection', async () => {
      const adapter = new ValkeyBullMQAdapter({
        connection: mockRedis,
        escrowQueue: mockEscrowQueue,
        noShowQueue: mockNoShowQueue
      });

      await adapter.close();

      expect(mockEscrowQueue.close).toHaveBeenCalled();
      expect(mockNoShowQueue.close).toHaveBeenCalled();
      expect(mockRedis.quit).toHaveBeenCalled();
    });
  });

  describe('EscrowClearingWorker', () => {
    it('should process job execution and trigger onClearContract callback', async () => {
      let registeredProcessor!: (job: Job<{ contractId: string }>) => Promise<void>;
      const mockWorkerInstance = {
        close: vi.fn().mockResolvedValue(undefined)
      } as unknown as Worker;

      const mockWorkerFactory = vi.fn().mockImplementation((name, processor, opts) => {
        registeredProcessor = processor;
        return mockWorkerInstance;
      });

      const onClearContract = vi.fn().mockResolvedValue(undefined);

      const worker = new EscrowClearingWorker({
        connection: mockRedis,
        workerFactory: mockWorkerFactory,
        onClearContract
      });

      expect(mockWorkerFactory).toHaveBeenCalledWith(
        'escrow-clearing-queue',
        expect.any(Function),
        expect.objectContaining({ concurrency: 5 })
      );

      // Simulate BullMQ dispatching a job after delay expiration
      await registeredProcessor({
        data: { contractId: 'contract-cleared-777' }
      } as Job<{ contractId: string }>);

      expect(onClearContract).toHaveBeenCalledWith('contract-cleared-777');

      await worker.close();
      expect(mockWorkerInstance.close).toHaveBeenCalled();
    });
  });
});
