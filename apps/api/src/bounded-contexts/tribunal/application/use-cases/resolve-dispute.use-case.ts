import { IDisputeTicketRepositoryPort } from '../ports/dispute-ticket-repository.port';
import { IDietitianLevelRepositoryPort } from '../../../reputation/application/ports/dietitian-level-repository.port';
import { RulingOutcome, DisputeStatus } from '../../domain/entities/dispute-ticket.entity';
import { DomainException } from '../../../shared/domain/exceptions/domain.exception';
import { DietitianTier } from '../../../reputation/domain/entities/dietitian-level.entity';

export interface ResolveDisputeCommand {
  disputeId: string;
  arbitratorId: string;
  outcome: RulingOutcome;
  justification: string;
  assignStrikeToRespondent: boolean;
}

export interface ResolveDisputeResult {
  disputeId: string;
  contractId: string;
  outcome: RulingOutcome;
  strikeAssigned: boolean;
  demotedToNewTier: boolean;
  biddingSuspended: boolean;
}

/**
 * ResolveDisputeUseCase
 * 
 * Orchestrates binding tribunal dispute arbitration rulings:
 * 1. Validates dispute state and arbitrator credentials.
 * 2. Issues legally binding ruling (refund client, split pro-rata, release to dietitian).
 * 3. Enforces three-strike disciplinary protocol: applies strikes and triggers tier demotions.
 * 4. Persists ruling docket and updated disciplinary profile.
 */
export class ResolveDisputeUseCase {
  constructor(
    private readonly disputeRepo: IDisputeTicketRepositoryPort,
    private readonly reputationRepo: IDietitianLevelRepositoryPort
  ) {}

  public async execute(command: ResolveDisputeCommand): Promise<ResolveDisputeResult> {
    const ticket = await this.disputeRepo.findById(command.disputeId);
    if (!ticket) {
      throw new DomainException(`Dispute ticket '${command.disputeId}' not found`, 'DISPUTE_NOT_FOUND');
    }

    if (ticket.status !== DisputeStatus.UNDER_ARBITRATION) {
      ticket.beginArbitration(command.arbitratorId);
    }

    const ruling = ticket.resolveDispute({
      outcome: command.outcome,
      justification: command.justification,
      assignStrikeToRespondent: command.assignStrikeToRespondent
    });

    let demotedToNewTier = false;
    let biddingSuspended = false;

    if (ruling.assignStrikeToRespondent) {
      const profile = await this.reputationRepo.findByDietitianId(ticket.respondentId);
      if (profile) {
        profile.applyStrike(command.justification);
        profile.evaluateTier();
        await this.reputationRepo.save(profile);

        demotedToNewTier = profile.tier === DietitianTier.NEW;
        biddingSuspended = profile.isBiddingSuspended;
      }
    }

    await this.disputeRepo.save(ticket);

    return {
      disputeId: ticket.id,
      contractId: ticket.contractId,
      outcome: ruling.outcome,
      strikeAssigned: ruling.assignStrikeToRespondent,
      demotedToNewTier,
      biddingSuspended
    };
  }
}
