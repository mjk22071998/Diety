import { Money } from '../../../shared/domain/value-objects/money.vo';
import { DomainException } from '../../../shared/domain/exceptions/domain.exception';

export enum EscrowTransactionType {
  ESCROW_HOLD = 'ESCROW_HOLD',
  SECURITY_CLEARING = 'SECURITY_CLEARING',
  DISBURSEMENT_PAYOUT = 'DISBURSEMENT_PAYOUT',
  PLATFORM_FEE_COLLECTION = 'PLATFORM_FEE_COLLECTION',
  CLIENT_REFUND = 'CLIENT_REFUND'
}

export interface EscrowTransactionProps {
  id: string;
  contractId: string;
  type: EscrowTransactionType;
  amount: Money;
  referenceId: string;
  createdAt?: Date;
}

/**
 * EscrowTransaction Domain Entity
 * 
 * Immutable transaction entry forming the double-entry escrow ledger.
 */
export class EscrowTransaction {
  public readonly id: string;
  public readonly contractId: string;
  public readonly type: EscrowTransactionType;
  public readonly amount: Money;
  public readonly referenceId: string;
  public readonly createdAt: Date;

  constructor(props: EscrowTransactionProps) {
    if (!props.id || !props.contractId || !props.referenceId) {
      throw new DomainException('Transaction fields id, contractId, and referenceId are required', 'INVALID_TRANSACTION_PROPS');
    }
    this.id = props.id;
    this.contractId = props.contractId;
    this.type = props.type;
    this.amount = props.amount;
    this.referenceId = props.referenceId;
    this.createdAt = props.createdAt ?? new Date();
  }

  public static create(
    contractId: string,
    type: EscrowTransactionType,
    amount: Money,
    referenceId: string
  ): EscrowTransaction {
    const id = `tx-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    return new EscrowTransaction({
      id,
      contractId,
      type,
      amount,
      referenceId,
      createdAt: new Date()
    });
  }
}
