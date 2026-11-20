import { DomainException } from '../../../shared/domain/exceptions/domain.exception';

export enum DisputeStatus {
  OPEN = 'OPEN',
  UNDER_ARBITRATION = 'UNDER_ARBITRATION',
  RESOLVED = 'RESOLVED',
  DISMISSED = 'DISMISSED'
}

export enum RulingOutcome {
  REFUND_CLIENT_FULL = 'REFUND_CLIENT_FULL',
  SPLIT_50_50 = 'SPLIT_50_50',
  DISBURSE_DIETITIAN_FULL = 'DISBURSE_DIETITIAN_FULL',
  DISMISS_UNFOUNDED = 'DISMISS_UNFOUNDED'
}

export interface DisputeEvidence {
  id: string;
  uploaderId: string;
  documentUrl: string;
  description: string;
  uploadedAt?: Date;
}

export interface TribunalRuling {
  outcome: RulingOutcome;
  justification: string;
  assignStrikeToRespondent: boolean;
  decidedAt?: Date;
}

export interface CreateDisputeTicketProps {
  id: string;
  contractId: string;
  initiatorId: string;
  respondentId: string;
  reason: string;
}

/**
 * DisputeTicket Aggregate Root
 * 
 * Manages the Three-Strike Disciplinary Tribunal arbitration process:
 * - Freezes contract escrow immediately upon initiation.
 * - Collects immutable documentary evidence from both parties.
 * - Issues formal tribunal rulings with client refunds and dietitian disciplinary strikes.
 */
export class DisputeTicket {
  public readonly id: string;
  public readonly contractId: string;
  public readonly initiatorId: string;
  public readonly respondentId: string;
  public readonly reason: string;
  public readonly createdAt: Date;

  private _status: DisputeStatus;
  private _arbitratorId?: string;
  private readonly _evidenceList: DisputeEvidence[] = [];
  private _ruling?: TribunalRuling;
  private _resolvedAt?: Date;

  private constructor(props: CreateDisputeTicketProps) {
    if (!props.id || !props.contractId || !props.initiatorId || !props.respondentId || !props.reason) {
      throw new DomainException('Missing required dispute ticket fields', 'INVALID_DISPUTE_PROPS');
    }
    if (props.initiatorId === props.respondentId) {
      throw new DomainException('Initiator and respondent cannot be the same user', 'SELF_DISPUTE_PROHIBITED');
    }

    this.id = props.id;
    this.contractId = props.contractId;
    this.initiatorId = props.initiatorId;
    this.respondentId = props.respondentId;
    this.reason = props.reason;
    this._status = DisputeStatus.OPEN;
    this.createdAt = new Date();
  }

  public static create(props: CreateDisputeTicketProps): DisputeTicket {
    return new DisputeTicket(props);
  }

  public get status(): DisputeStatus {
    return this._status;
  }

  public get arbitratorId(): string | undefined {
    return this._arbitratorId;
  }

  public get evidenceList(): readonly DisputeEvidence[] {
    return Object.freeze([...this._evidenceList]);
  }

  public get ruling(): TribunalRuling | undefined {
    return this._ruling;
  }

  public get resolvedAt(): Date | undefined {
    return this._resolvedAt;
  }

  /**
   * Attaches cryptographic evidence (documents, screenshots) to the dispute docket
   */
  public attachEvidence(evidence: DisputeEvidence): void {
    if (this._status === DisputeStatus.RESOLVED || this._status === DisputeStatus.DISMISSED) {
      throw new DomainException('Cannot attach evidence to a finalized dispute', 'DISPUTE_FINALIZED');
    }

    this._evidenceList.push({
      ...evidence,
      uploadedAt: evidence.uploadedAt ?? new Date()
    });
  }

  /**
   * Tribunal staff member assumes jurisdiction over the dispute docket
   */
  public beginArbitration(arbitratorId: string): void {
    if (!arbitratorId) {
      throw new DomainException('Arbitrator ID is required to begin arbitration', 'INVALID_ARBITRATOR_ID');
    }
    if (this._status !== DisputeStatus.OPEN) {
      throw new DomainException(`Cannot begin arbitration from status ${this._status}`, 'INVALID_DISPUTE_STATE');
    }

    this._status = DisputeStatus.UNDER_ARBITRATION;
    this._arbitratorId = arbitratorId;
  }

  /**
   * Issues binding tribunal ruling and assesses disciplinary strike sanctions
   */
  public resolveDispute(ruling: TribunalRuling): TribunalRuling {
    if (this._status !== DisputeStatus.UNDER_ARBITRATION) {
      throw new DomainException(
        `Dispute must be UNDER_ARBITRATION to be resolved, currently ${this._status}`,
        'NOT_UNDER_ARBITRATION'
      );
    }
    if (!ruling.justification || ruling.justification.trim().length === 0) {
      throw new DomainException('Formal written justification is mandatory for tribunal rulings', 'MISSING_JUSTIFICATION');
    }

    this._status = ruling.outcome === RulingOutcome.DISMISS_UNFOUNDED ? DisputeStatus.DISMISSED : DisputeStatus.RESOLVED;
    this._ruling = {
      ...ruling,
      decidedAt: new Date()
    };
    this._resolvedAt = new Date();

    return this._ruling;
  }
}
