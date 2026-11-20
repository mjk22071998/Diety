/**
 * Diety Platform - Queue & Timers Port (Hexagonal Architecture)
 * 
 * Defines the contract for distributed background job scheduling and countdown timers
 * powered by Valkey / BullMQ.
 */

export interface ScheduleClearingJobParams {
  contractId: string;
  delayHours: number; // 72h default, 48h/24h for higher tiers
}

export interface ScheduleNoShowJobParams {
  sessionId: string;
  delayMinutes: number; // 15m wait threshold
}

export interface IQueuePort {
  scheduleEscrowClearing(params: ScheduleClearingJobParams): Promise<string>;
  cancelEscrowClearing(contractId: string): Promise<boolean>;
  scheduleNoShowCheck(params: ScheduleNoShowJobParams): Promise<string>;
}
