import { DomainException } from '../../../shared/domain/exceptions/domain.exception';

export type DietitianLevelTier = 'NEW' | 'SILVER' | 'GOLD' | 'PLATINUM';

const TIER_LIMITS: Record<DietitianLevelTier, number> = {
  NEW: 25,
  SILVER: 35,
  GOLD: 50,
  PLATINUM: 75
};

/**
 * ProposalLimit Value Object
 * 
 * Enforces dynamic bid capacity ceilings based on Dietitian level tiers.
 * Prevents proposal flooding and maintains marketplace balance.
 */
export class ProposalLimit {
  private readonly _tier: DietitianLevelTier;
  private readonly _maxActiveProposals: number;

  private constructor(tier: DietitianLevelTier, maxActiveProposals: number) {
    if (maxActiveProposals <= 0 || !Number.isInteger(maxActiveProposals)) {
      throw new DomainException(
        `Proposal limit must be a positive integer: received ${maxActiveProposals}`,
        'INVALID_PROPOSAL_LIMIT'
      );
    }
    this._tier = tier;
    this._maxActiveProposals = maxActiveProposals;
  }

  public static forLevel(tier: DietitianLevelTier): ProposalLimit {
    const limit = TIER_LIMITS[tier];
    if (!limit) {
      throw new DomainException(`Unknown dietitian level tier: ${tier}`, 'UNKNOWN_TIER');
    }
    return new ProposalLimit(tier, limit);
  }

  public get tier(): DietitianLevelTier {
    return this._tier;
  }

  public get maxActiveProposals(): number {
    return this._maxActiveProposals;
  }

  public canSubmitProposal(currentActiveBidsCount: number): boolean {
    if (!Number.isInteger(currentActiveBidsCount) || currentActiveBidsCount < 0) {
      throw new DomainException(
        `Current active bids count must be a non-negative integer: received ${currentActiveBidsCount}`,
        'INVALID_ACTIVE_BIDS_COUNT'
      );
    }
    return currentActiveBidsCount < this._maxActiveProposals;
  }
}
