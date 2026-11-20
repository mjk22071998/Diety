import { IMarketplaceRepositoryPort } from '../ports/marketplace-repository.port';
import { ProposalLimit, DietitianLevelTier } from '../../domain/value-objects/proposal-limit.vo';
import { DomainException } from '../../../shared/domain/exceptions/domain.exception';

export interface SubmitProposalCommand {
  proposalId: string;
  requirementId: string;
  dietitianId: string;
  dietitianTier: DietitianLevelTier;
  bidAmountCents: number;
  coverLetter: string;
}

export interface SubmitProposalResult {
  proposalId: string;
  requirementId: string;
  status: string;
}

/**
 * SubmitProposalUseCase
 * 
 * Enforces dynamic bid capacity ceilings and marketplace single-hire locks:
 * 1. Verifies that the client requirement is currently open and not locked.
 * 2. Enforces tier-based active proposal ceilings (25/35/50/75 bids).
 * 3. Atomically persists submitted proposals.
 */
export class SubmitProposalUseCase {
  constructor(private readonly marketplaceRepo: IMarketplaceRepositoryPort) {}

  public async execute(command: SubmitProposalCommand): Promise<SubmitProposalResult> {
    if (!command.proposalId || !command.requirementId || !command.dietitianId) {
      throw new DomainException('Missing required proposal submission parameters', 'INVALID_PARAMS');
    }
    if (command.bidAmountCents <= 0) {
      throw new DomainException('Bid amount must be a positive integer', 'INVALID_BID_AMOUNT');
    }

    const requirement = await this.marketplaceRepo.findRequirementById(command.requirementId);
    if (!requirement) {
      throw new DomainException(`Requirement '${command.requirementId}' not found`, 'REQUIREMENT_NOT_FOUND');
    }

    if (requirement.isLocked || requirement.status !== 'OPEN') {
      throw new DomainException(
        `Requirement '${command.requirementId}' is locked and no longer accepting bids`,
        'REQUIREMENT_LOCKED'
      );
    }

    const proposalLimit = ProposalLimit.forLevel(command.dietitianTier);
    const currentActiveBids = await this.marketplaceRepo.countActiveProposalsByDietitian(command.dietitianId);

    if (!proposalLimit.canSubmitProposal(currentActiveBids)) {
      throw new DomainException(
        `Dietitian tier '${command.dietitianTier}' has reached active bid capacity limit (${proposalLimit.maxActiveProposals} proposals)`,
        'TIER_BID_CAPACITY_EXCEEDED'
      );
    }

    await this.marketplaceRepo.createProposal({
      id: command.proposalId,
      requirementId: command.requirementId,
      dietitianId: command.dietitianId,
      bidAmountCents: command.bidAmountCents,
      coverLetter: command.coverLetter
    });

    return {
      proposalId: command.proposalId,
      requirementId: command.requirementId,
      status: 'SUBMITTED'
    };
  }
}
