import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ResolveDisputeUseCase } from '../../../src/bounded-contexts/tribunal/application/use-cases/resolve-dispute.use-case';
import { IDisputeTicketRepositoryPort } from '../../../src/bounded-contexts/tribunal/application/ports/dispute-ticket-repository.port';
import { IDietitianLevelRepositoryPort } from '../../../src/bounded-contexts/reputation/application/ports/dietitian-level-repository.port';
import { DisputeTicket, RulingOutcome, DisputeStatus } from '../../../src/bounded-contexts/tribunal/domain/entities/dispute-ticket.entity';
import { DietitianLevelProfile, DietitianTier } from '../../../src/bounded-contexts/reputation/domain/entities/dietitian-level.entity';
import { RatingScore } from '../../../src/bounded-contexts/shared/domain/value-objects/rating-score.vo';
import { Money } from '../../../src/bounded-contexts/shared/domain/value-objects/money.vo';
import { DomainException } from '../../../src/bounded-contexts/shared/domain/exceptions/domain.exception';

describe('Task 4.4: Disciplinary Tribunal & Dispute Resolution API (Pure TDD)', () => {
  let mockDisputeRepo: IDisputeTicketRepositoryPort;
  let mockReputationRepo: IDietitianLevelRepositoryPort;
  let useCase: ResolveDisputeUseCase;

  const createBaseDispute = (): DisputeTicket => {
    return DisputeTicket.create({
      id: 'dispute-999',
      contractId: 'contract-123',
      initiatorId: 'client-1',
      respondentId: 'dietitian-1',
      reason: 'Dietitian missed scheduled clinical calls and provided no meal plan'
    });
  };

  const createBaseDietitianProfile = (tier = DietitianTier.GOLD): DietitianLevelProfile => {
    return DietitianLevelProfile.create({
      dietitianId: 'dietitian-1',
      tier,
      completedContracts: 20,
      rating: RatingScore.create(4.8),
      onTimeDeliveryRate: 95.0,
      totalEarnings: Money.fromCents(500000, 'USD')
    });
  };

  beforeEach(() => {
    mockDisputeRepo = {
      findById: vi.fn(),
      save: vi.fn().mockResolvedValue(undefined)
    };
    mockReputationRepo = {
      findByDietitianId: vi.fn(),
      save: vi.fn().mockResolvedValue(undefined)
    };
    useCase = new ResolveDisputeUseCase(mockDisputeRepo, mockReputationRepo);
  });

  it('should rule in favor of client with full refund and apply Strike 1 without demoting tier', async () => {
    const dispute = createBaseDispute();
    const profile = createBaseDietitianProfile(DietitianTier.GOLD);

    (mockDisputeRepo.findById as any).mockResolvedValue(dispute);
    (mockReputationRepo.findByDietitianId as any).mockResolvedValue(profile);

    const result = await useCase.execute({
      disputeId: 'dispute-999',
      arbitratorId: 'arbitrator-staff-1',
      outcome: RulingOutcome.REFUND_CLIENT_FULL,
      justification: 'Confirmed complete practitioner no-show without valid emergency documentation',
      assignStrikeToRespondent: true
    });

    expect(result.disputeId).toBe('dispute-999');
    expect(result.outcome).toBe(RulingOutcome.REFUND_CLIENT_FULL);
    expect(result.strikeAssigned).toBe(true);
    expect(result.demotedToNewTier).toBe(false);
    expect(result.biddingSuspended).toBe(false);

    expect(profile.strikesCount).toBe(1);
    expect(profile.tier).toBe(DietitianTier.GOLD);
    expect(mockDisputeRepo.save).toHaveBeenCalledWith(dispute);
    expect(mockReputationRepo.save).toHaveBeenCalledWith(profile);
  });

  it('should apply Strike 2 and immediately demote dietitian to NEW tier', async () => {
    const dispute = createBaseDispute();
    const profile = createBaseDietitianProfile(DietitianTier.GOLD);
    // Pre-apply Strike 1
    profile.applyStrike('First strike');

    (mockDisputeRepo.findById as any).mockResolvedValue(dispute);
    (mockReputationRepo.findByDietitianId as any).mockResolvedValue(profile);

    const result = await useCase.execute({
      disputeId: 'dispute-999',
      arbitratorId: 'arbitrator-staff-1',
      outcome: RulingOutcome.REFUND_CLIENT_FULL,
      justification: 'Second severe contract violation',
      assignStrikeToRespondent: true
    });

    expect(result.strikeAssigned).toBe(true);
    expect(result.demotedToNewTier).toBe(true);
    expect(profile.strikesCount).toBe(2);
    expect(profile.tier).toBe(DietitianTier.NEW);
  });

  it('should apply Strike 3 and permanently suspend dietitian bidding permissions', async () => {
    const dispute = createBaseDispute();
    const profile = createBaseDietitianProfile(DietitianTier.SILVER);
    // Pre-apply Strike 1 and Strike 2
    profile.applyStrike('First strike');
    profile.applyStrike('Second strike');

    (mockDisputeRepo.findById as any).mockResolvedValue(dispute);
    (mockReputationRepo.findByDietitianId as any).mockResolvedValue(profile);

    const result = await useCase.execute({
      disputeId: 'dispute-999',
      arbitratorId: 'arbitrator-staff-1',
      outcome: RulingOutcome.REFUND_CLIENT_FULL,
      justification: 'Third repeated strike - permanent ban',
      assignStrikeToRespondent: true
    });

    expect(result.biddingSuspended).toBe(true);
    expect(profile.strikesCount).toBe(3);
    expect(profile.isBiddingSuspended).toBe(true);
  });

  it('should rule 50/50 split settlement with zero strikes applied to dietitian', async () => {
    const dispute = createBaseDispute();
    const profile = createBaseDietitianProfile(DietitianTier.GOLD);

    (mockDisputeRepo.findById as any).mockResolvedValue(dispute);
    (mockReputationRepo.findByDietitianId as any).mockResolvedValue(profile);

    const result = await useCase.execute({
      disputeId: 'dispute-999',
      arbitratorId: 'arbitrator-staff-1',
      outcome: RulingOutcome.SPLIT_50_50,
      justification: 'Mutual partial delivery: meal plan delivered but 1 call missed by mutual agreement',
      assignStrikeToRespondent: false
    });

    expect(result.outcome).toBe(RulingOutcome.SPLIT_50_50);
    expect(result.strikeAssigned).toBe(false);
    expect(profile.strikesCount).toBe(0);
    expect(mockReputationRepo.save).not.toHaveBeenCalled();
  });

  it('should throw DomainException if dispute ticket is not found', async () => {
    (mockDisputeRepo.findById as any).mockResolvedValue(null);

    await expect(
      useCase.execute({
        disputeId: 'non-existent-dispute',
        arbitratorId: 'arb-1',
        outcome: RulingOutcome.DISMISS_DISPUTE_RELEASE_TO_DIETITIAN,
        justification: 'Case dismissed',
        assignStrikeToRespondent: false
      })
    ).rejects.toThrow(DomainException);
  });

  it('should throw DomainException if ruling justification is empty', async () => {
    const dispute = createBaseDispute();
    (mockDisputeRepo.findById as any).mockResolvedValue(dispute);

    await expect(
      useCase.execute({
        disputeId: 'dispute-999',
        arbitratorId: 'arb-1',
        outcome: RulingOutcome.REFUND_CLIENT_FULL,
        justification: '   ',
        assignStrikeToRespondent: false
      })
    ).rejects.toThrow(DomainException);
  });
});
