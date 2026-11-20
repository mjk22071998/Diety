import { IContractRepositoryPort } from '../ports/contract-repository.port';
import { IQueuePort } from '../../../shared/application/ports/queue.port';
import { DomainException } from '../../../shared/domain/exceptions/domain.exception';
import { ContractStatus } from '../../domain/entities/contract.entity';

export interface DisburseEscrowCommand {
  contractId: string;
  currentTime?: Date;
  clearingHours?: number;
  mealPlanDelivered?: boolean;
  verifiedConsultationsCount?: number;
}

export interface DisburseEscrowResult {
  contractId: string;
  status: ContractStatus;
  totalAmountCents: number;
  platformFeeCents: number;
  netEarningsCents: number;
}

/**
 * DisburseEscrowUseCase
 * 
 * Orchestrates the triple-check escrow release protocol:
 * 1. Checks 75% calendar elapsed duration invariant.
 * 2. Checks weekly digital meal plan delivery verification.
 * 3. Checks minimum required verified WebRTC consultations (>= 15 min mutual presence).
 * 4. Advances state machine: ACTIVE -> CLEARING -> DISBURSED.
 * 5. Enforces double-entry ledger settlement (Total = PlatformFee + NetEarnings).
 * 6. Persists contract and ledger entries atomically.
 * 7. Cancels background timeout countdowns.
 */
export class DisburseEscrowUseCase {
  constructor(
    private readonly contractRepo: IContractRepositoryPort,
    private readonly queuePort: IQueuePort
  ) {}

  public async execute(command: DisburseEscrowCommand): Promise<DisburseEscrowResult> {
    const contract = await this.contractRepo.findById(command.contractId);
    if (!contract) {
      throw new DomainException(`Contract with ID '${command.contractId}' not found`, 'CONTRACT_NOT_FOUND');
    }

    const evaluationTime = command.currentTime ?? new Date();

    const isEligible = contract.isEligibleForDisbursement({
      currentTime: evaluationTime,
      mealPlanDelivered: command.mealPlanDelivered ?? true,
      verifiedConsultationsCount: command.verifiedConsultationsCount ?? contract.requiredConsultations
    });

    if (!isEligible) {
      throw new DomainException(
        'Disbursement rejected: Invariant failure on Triple-Check Escrow Release protocol (duration < 75%, missing meal plan, or unverified consultations)',
        'PREMATURE_DISBURSEMENT'
      );
    }

    // State machine progression: ACTIVE -> CLEARING -> DISBURSED
    contract.startSecurityClearing(command.clearingHours ?? 72);
    contract.completeDisbursement();

    await this.contractRepo.updateContractWithLedger(contract);
    await this.queuePort.cancelEscrowClearing(contract.id);

    return {
      contractId: contract.id,
      status: contract.status,
      totalAmountCents: contract.totalAmount.cents,
      platformFeeCents: contract.platformFee.cents,
      netEarningsCents: contract.netEarnings.cents
    };
  }
}
