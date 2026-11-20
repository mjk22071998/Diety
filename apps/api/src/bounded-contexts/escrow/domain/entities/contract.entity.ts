import { Money } from '../../../shared/domain/value-objects/money.vo';
import { DomainException } from '../../../shared/domain/exceptions/domain.exception';
import { EscrowTransaction, EscrowTransactionType } from './escrow-transaction.entity';

export enum ContractStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  SUBMITTED_FOR_APPROVAL = 'SUBMITTED_FOR_APPROVAL',
  CLEARING = 'CLEARING',
  COMPLETED = 'COMPLETED',
  DISPUTED = 'DISPUTED',
  REFUNDED = 'REFUNDED',
  CANCELLED = 'CANCELLED'
}

export interface CreateContractProps {
  id: string;
  clientId: string;
  dietitianId: string;
  proposalId: string;
  totalAmount: Money;
  platformFeePercent: number; // e.g., 10 or 8
  requiredConsultations: number;
  startedAt: Date;
  targetDeliveryDate: Date;
}

export interface EligibilityCheckParams {
  currentTime: Date;
  mealPlanDelivered: boolean;
  verifiedConsultationsCount: number;
}

/**
 * Contract Aggregate Root
 * 
 * Enforces the double-entry escrow ledger invariant:
 *   Total === PlatformFee + NetEarnings (exact to the integer cent)
 * Enforces the Triple-Check Escrow Release Protocol & dispute freezing.
 */
export class Contract {
  public readonly id: string;
  public readonly clientId: string;
  public readonly dietitianId: string;
  public readonly proposalId: string;
  public readonly totalAmount: Money;
  public readonly platformFee: Money;
  public readonly netEarnings: Money;
  public readonly platformFeePercent: number;
  public readonly requiredConsultations: number;
  public readonly startedAt: Date;
  public readonly targetDeliveryDate: Date;

  private _status: ContractStatus;
  private _clearingPeriodHours: number | null = null;
  private _disputeId: string | null = null;
  private readonly _transactions: EscrowTransaction[] = [];

  private constructor(props: CreateContractProps) {
    if (props.targetDeliveryDate.getTime() <= props.startedAt.getTime()) {
      throw new DomainException(
        'Target delivery date must be strictly after contract startedAt date',
        'INVALID_CONTRACT_TIMELINE'
      );
    }
    if (props.platformFeePercent < 0 || props.platformFeePercent > 100) {
      throw new DomainException('Platform fee percent must be between 0 and 100', 'INVALID_FEE_PERCENT');
    }

    this.id = props.id;
    this.clientId = props.clientId;
    this.dietitianId = props.dietitianId;
    this.proposalId = props.proposalId;
    this.totalAmount = props.totalAmount;
    this.platformFeePercent = props.platformFeePercent;
    this.requiredConsultations = props.requiredConsultations;
    this.startedAt = props.startedAt;
    this.targetDeliveryDate = props.targetDeliveryDate;
    this._status = ContractStatus.DRAFT;

    // Double-entry ledger calculation
    this.platformFee = this.totalAmount.percentage(props.platformFeePercent);
    this.netEarnings = this.totalAmount.subtract(this.platformFee);

    // Verify mathematical double-entry equality
    if (!this.platformFee.add(this.netEarnings).equals(this.totalAmount)) {
      throw new DomainException('Double-entry ledger invariant violation', 'LEDGER_INVARIANT_VIOLATION');
    }
  }

  public static create(props: CreateContractProps): Contract {
    return new Contract(props);
  }

  public get status(): ContractStatus {
    return this._status;
  }

  public get clearingPeriodHours(): number | null {
    return this._clearingPeriodHours;
  }

  public get disputeId(): string | null {
    return this._disputeId;
  }

  public get transactions(): readonly EscrowTransaction[] {
    return Object.freeze([...this._transactions]);
  }

  /**
   * Locks client funds into escrow, transitioning contract from DRAFT -> ACTIVE
   */
  public lockEscrow(paymentReference: string): EscrowTransaction {
    if (this._status !== ContractStatus.DRAFT) {
      throw new DomainException(
        `Cannot lock escrow for contract in status ${this._status}`,
        'INVALID_STATUS_TRANSITION'
      );
    }

    this._status = ContractStatus.ACTIVE;
    const tx = EscrowTransaction.create(
      this.id,
      EscrowTransactionType.ESCROW_HOLD,
      this.totalAmount,
      paymentReference
    );
    this._transactions.push(tx);
    return tx;
  }

  /**
   * Dietitian submits deliverables for approval
   */
  public submitForApproval(): void {
    if (this._status !== ContractStatus.ACTIVE) {
      throw new DomainException(
        `Cannot submit for approval from status ${this._status}`,
        'INVALID_STATUS_TRANSITION'
      );
    }
    this._status = ContractStatus.SUBMITTED_FOR_APPROVAL;
  }

  /**
   * Initiates security clearing countdown (72h default, 48h/24h for higher tiers)
   */
  public startSecurityClearing(clearingPeriodHours = 72): EscrowTransaction {
    if (
      this._status !== ContractStatus.ACTIVE &&
      this._status !== ContractStatus.SUBMITTED_FOR_APPROVAL
    ) {
      throw new DomainException(
        `Cannot enter security clearing from status ${this._status}`,
        'INVALID_STATUS_TRANSITION'
      );
    }

    this._status = ContractStatus.CLEARING;
    this._clearingPeriodHours = clearingPeriodHours;
    const tx = EscrowTransaction.create(
      this.id,
      EscrowTransactionType.SECURITY_CLEARING,
      this.totalAmount,
      `clearing-${clearingPeriodHours}h`
    );
    this._transactions.push(tx);
    return tx;
  }

  /**
   * Completes escrow disbursement to dietitian wallet after clearing timer expires
   */
  public completeDisbursement(): EscrowTransaction[] {
    if (this._status !== ContractStatus.CLEARING) {
      throw new DomainException(
        `Cannot complete disbursement from status ${this._status}`,
        'INVALID_STATUS_TRANSITION'
      );
    }

    this._status = ContractStatus.COMPLETED;

    // 1. Payout net earnings to dietitian
    const payoutTx = EscrowTransaction.create(
      this.id,
      EscrowTransactionType.DISBURSEMENT_PAYOUT,
      this.netEarnings,
      `payout-dietitian-${this.dietitianId}`
    );

    // 2. Platform fee collection
    const feeTx = EscrowTransaction.create(
      this.id,
      EscrowTransactionType.PLATFORM_FEE_COLLECTION,
      this.platformFee,
      'platform-commission'
    );

    this._transactions.push(payoutTx, feeTx);
    return [payoutTx, feeTx];
  }

  /**
   * Freezes escrow and halts clearing countdown when a dispute is opened
   */
  public freezeForDispute(disputeId: string): void {
    if (this._status === ContractStatus.COMPLETED || this._status === ContractStatus.REFUNDED) {
      throw new DomainException(
        `Cannot freeze completed or refunded contract: status is ${this._status}`,
        'CANNOT_DISPUTE_FINALIZED_CONTRACT'
      );
    }

    this._status = ContractStatus.DISPUTED;
    this._disputeId = disputeId;
  }

  /**
   * Refunds 100% of escrowed principal to client upon arbitrator ruling
   */
  public refundClient(resolutionReference: string): EscrowTransaction {
    if (this._status !== ContractStatus.DISPUTED) {
      throw new DomainException(
        `Cannot execute client refund: contract must be in DISPUTED status, currently ${this._status}`,
        'INVALID_REFUND_STATE'
      );
    }

    this._status = ContractStatus.REFUNDED;
    const refundTx = EscrowTransaction.create(
      this.id,
      EscrowTransactionType.CLIENT_REFUND,
      this.totalAmount,
      resolutionReference
    );
    this._transactions.push(refundTx);
    return refundTx;
  }

  /**
   * Validates the Triple-Check Escrow Release Protocol:
   * 1. Calendar elapsed >= 75%
   * 2. Digital meal plan delivered === true
   * 3. Verified mutual consultations >= requiredConsultations
   */
  public isEligibleForDisbursement(params: EligibilityCheckParams): boolean {
    const totalDuration = this.targetDeliveryDate.getTime() - this.startedAt.getTime();
    const elapsed = params.currentTime.getTime() - this.startedAt.getTime();

    // Check calendar duration
    if (totalDuration <= 0 || elapsed / totalDuration < 0.75) {
      return false;
    }

    // Check meal plan delivery
    if (!params.mealPlanDelivered) {
      return false;
    }

    // Check consultations verified
    if (params.verifiedConsultationsCount < this.requiredConsultations) {
      return false;
    }

    return true;
  }
}
