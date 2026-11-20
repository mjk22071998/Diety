import { DomainException } from '../../../shared/domain/exceptions/domain.exception';

export enum ConsultationStatus {
  SCHEDULED = 'SCHEDULED',
  IN_PROGRESS = 'IN_PROGRESS',
  VERIFIED = 'VERIFIED',
  CLIENT_NO_SHOW = 'CLIENT_NO_SHOW',
  DIETITIAN_NO_SHOW = 'DIETITIAN_NO_SHOW',
  CANCELLED = 'CANCELLED'
}

export interface CreateConsultationSessionProps {
  id: string;
  contractId: string;
  dietitianId: string;
  clientId: string;
  scheduledAt: Date;
  durationMinutes: number;
}

const VERIFICATION_THRESHOLD_SECONDS = 15 * 60; // 15 minutes = 900 seconds
const NO_SHOW_GRACE_SECONDS = 5 * 60; // 5 minutes = 300 seconds

/**
 * ConsultationSession Aggregate Root
 * 
 * Enforces server-verified attendance tracking for peer-to-peer WebRTC video consultations:
 * - Minimum 15 minutes of verified mutual presence required to disburse escrow.
 * - Strict anti-fraud invariants for claiming Client/Dietitian No-Show.
 */
export class ConsultationSession {
  public readonly id: string;
  public readonly contractId: string;
  public readonly dietitianId: string;
  public readonly clientId: string;
  public readonly scheduledAt: Date;
  public readonly durationMinutes: number;

  private _status: ConsultationStatus;
  private _dietitianPresenceSeconds = 0;
  private _clientPresenceSeconds = 0;

  private constructor(props: CreateConsultationSessionProps) {
    if (!props.id || !props.contractId || !props.dietitianId || !props.clientId) {
      throw new DomainException('Missing required consultation session properties', 'INVALID_SESSION_PROPS');
    }
    if (props.durationMinutes <= 0) {
      throw new DomainException('Duration minutes must be positive', 'INVALID_DURATION');
    }

    this.id = props.id;
    this.contractId = props.contractId;
    this.dietitianId = props.dietitianId;
    this.clientId = props.clientId;
    this.scheduledAt = props.scheduledAt;
    this.durationMinutes = props.durationMinutes;
    this._status = ConsultationStatus.SCHEDULED;
  }

  public static create(props: CreateConsultationSessionProps): ConsultationSession {
    return new ConsultationSession(props);
  }

  public get status(): ConsultationStatus {
    return this._status;
  }

  public get dietitianPresenceSeconds(): number {
    return this._dietitianPresenceSeconds;
  }

  public get clientPresenceSeconds(): number {
    return this._clientPresenceSeconds;
  }

  public get mutualAttendanceMinutes(): number {
    const mutualSeconds = Math.min(this._dietitianPresenceSeconds, this._clientPresenceSeconds);
    return Math.floor(mutualSeconds / 60);
  }

  public isVerified(): boolean {
    return this._status === ConsultationStatus.VERIFIED;
  }

  /**
   * Accumulates verified participant attendance from signaling server heartbeats
   */
  public recordPresence(participantId: string, additionalSeconds: number): void {
    if (this._status === ConsultationStatus.CANCELLED) {
      throw new DomainException('Cannot record presence for cancelled consultation', 'SESSION_CANCELLED');
    }
    if (additionalSeconds <= 0) {
      throw new DomainException('Presence seconds must be positive', 'INVALID_PRESENCE_SECONDS');
    }

    if (this._status === ConsultationStatus.SCHEDULED) {
      this._status = ConsultationStatus.IN_PROGRESS;
    }

    if (participantId === this.dietitianId) {
      this._dietitianPresenceSeconds += additionalSeconds;
    } else if (participantId === this.clientId) {
      this._clientPresenceSeconds += additionalSeconds;
    } else {
      throw new DomainException(`Participant ${participantId} is not a member of this session`, 'UNKNOWN_PARTICIPANT');
    }
  }

  /**
   * Evaluates if mutual attendance threshold (>= 15 mins) has been reached
   */
  public evaluateAttendance(): void {
    const mutualSeconds = Math.min(this._dietitianPresenceSeconds, this._clientPresenceSeconds);
    if (mutualSeconds >= VERIFICATION_THRESHOLD_SECONDS) {
      this._status = ConsultationStatus.VERIFIED;
    }
  }

  /**
   * Claims Client No-Show:
   * Invariant: Dietitian MUST have waited >= 15 minutes and client presence < 5 minutes
   */
  public claimClientNoShow(): void {
    if (this._status === ConsultationStatus.VERIFIED) {
      throw new DomainException('Cannot claim no-show on an already verified session', 'SESSION_ALREADY_VERIFIED');
    }
    if (this._dietitianPresenceSeconds < VERIFICATION_THRESHOLD_SECONDS) {
      throw new DomainException(
        `Dietitian attendance invariant failed: only waited ${Math.floor(this._dietitianPresenceSeconds / 60)}/15 minutes`,
        'INSUFFICIENT_WAIT_TIME'
      );
    }
    if (this._clientPresenceSeconds >= NO_SHOW_GRACE_SECONDS) {
      throw new DomainException('Client was present for more than grace period', 'CLIENT_WAS_PRESENT');
    }

    this._status = ConsultationStatus.CLIENT_NO_SHOW;
  }

  /**
   * Claims Dietitian No-Show:
   * Invariant: Client waited >= 15 minutes and dietitian presence < 5 minutes
   */
  public claimDietitianNoShow(): void {
    if (this._status === ConsultationStatus.VERIFIED) {
      throw new DomainException('Cannot claim no-show on an already verified session', 'SESSION_ALREADY_VERIFIED');
    }
    if (this._clientPresenceSeconds < VERIFICATION_THRESHOLD_SECONDS) {
      throw new DomainException(
        `Client attendance invariant failed: only waited ${Math.floor(this._clientPresenceSeconds / 60)}/15 minutes`,
        'INSUFFICIENT_WAIT_TIME'
      );
    }
    if (this._dietitianPresenceSeconds >= NO_SHOW_GRACE_SECONDS) {
      throw new DomainException('Dietitian was present for more than grace period', 'DIETITIAN_WAS_PRESENT');
    }

    this._status = ConsultationStatus.DIETITIAN_NO_SHOW;
  }
}
