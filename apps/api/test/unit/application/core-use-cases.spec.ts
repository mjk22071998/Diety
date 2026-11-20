import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DisburseEscrowUseCase } from '../../../src/bounded-contexts/escrow/application/use-cases/disburse-escrow.use-case';
import { SubmitProposalUseCase } from '../../../src/bounded-contexts/marketplace/application/use-cases/submit-proposal.use-case';
import { ProcessClinicalSimulationUseCase } from '../../../src/bounded-contexts/identity/application/use-cases/process-clinical-simulation.use-case';
import { IContractRepositoryPort } from '../../../src/bounded-contexts/escrow/application/ports/contract-repository.port';
import { IQueuePort } from '../../../src/bounded-contexts/shared/application/ports/queue.port';
import { IMarketplaceRepositoryPort } from '../../../src/bounded-contexts/marketplace/application/ports/marketplace-repository.port';
import { IDietitianVerificationRepositoryPort } from '../../../src/bounded-contexts/identity/application/ports/dietitian-verification-repository.port';
import { IAISimulatorPort } from '../../../src/bounded-contexts/identity/application/ports/ai-simulator.port';
import { Contract, ContractStatus } from '../../../src/bounded-contexts/escrow/domain/entities/contract.entity';
import { DietitianVerification } from '../../../src/bounded-contexts/identity/domain/entities/dietitian-verification.entity';
import { Money } from '../../../src/bounded-contexts/shared/domain/value-objects/money.vo';
import { DomainException } from '../../../src/bounded-contexts/shared/domain/exceptions/domain.exception';

describe('Task 4.2: Application Core Use Cases & Financial / Verification Workflows (Pure TDD)', () => {
  describe('DisburseEscrowUseCase', () => {
    let mockContractRepo: IContractRepositoryPort;
    let mockQueuePort: IQueuePort;
    let useCase: DisburseEscrowUseCase;

    const startDate = new Date('2026-01-01T00:00:00Z');
    const endDate = new Date('2026-01-31T00:00:00Z'); // 30 days total

    const createBaseContract = (): Contract => {
      const contract = Contract.create({
        id: 'contract-test-1',
        proposalId: 'prop-1',
        dietitianId: 'dietitian-1',
        clientId: 'client-1',
        totalAmount: Money.fromCents(20000, 'USD'),
        platformFeePercent: 10,
        requiredConsultations: 2,
        startedAt: startDate,
        targetDeliveryDate: endDate
      });
      contract.lockEscrow('pay-ref-initial-deposit');
      return contract;
    };

    beforeEach(() => {
      mockContractRepo = {
        findById: vi.fn(),
        save: vi.fn().mockResolvedValue(undefined),
        updateContractWithLedger: vi.fn().mockResolvedValue(undefined)
      };
      mockQueuePort = {
        scheduleEscrowClearing: vi.fn().mockResolvedValue('job-1'),
        cancelEscrowClearing: vi.fn().mockResolvedValue(true),
        scheduleNoShowCheck: vi.fn().mockResolvedValue('job-2')
      };
      useCase = new DisburseEscrowUseCase(mockContractRepo, mockQueuePort);
    });

    it('should disburse funds when 75% elapsed duration has passed and update ledger', async () => {
      const contract = createBaseContract();
      (mockContractRepo.findById as any).mockResolvedValue(contract);

      // 25 days elapsed out of 30 days (~83.3% > 75%)
      const evalDate = new Date('2026-01-26T00:00:00Z');

      const result = await useCase.execute({
        contractId: 'contract-test-1',
        currentTime: evalDate
      });

      expect(result.contractId).toBe('contract-test-1');
      expect(result.status).toBe(ContractStatus.COMPLETED);
      expect(result.totalAmountCents).toBe(20000);
      expect(result.platformFeeCents).toBe(2000);
      expect(result.netEarningsCents).toBe(18000);

      expect(mockContractRepo.updateContractWithLedger).toHaveBeenCalledWith(contract);
      expect(mockQueuePort.cancelEscrowClearing).toHaveBeenCalledWith('contract-test-1');
    });

    it('should throw DomainException if contract is not found', async () => {
      (mockContractRepo.findById as any).mockResolvedValue(null);

      await expect(
        useCase.execute({ contractId: 'non-existent' })
      ).rejects.toThrow(DomainException);
    });

    it('should reject disbursement if less than 75% duration has elapsed', async () => {
      const contract = createBaseContract();
      (mockContractRepo.findById as any).mockResolvedValue(contract);

      // Only 10 days elapsed (~33% < 75%)
      const evalDate = new Date('2026-01-11T00:00:00Z');

      await expect(
        useCase.execute({ contractId: 'contract-test-1', currentTime: evalDate })
      ).rejects.toThrow(DomainException);
    });
  });

  describe('SubmitProposalUseCase', () => {
    let mockMarketplaceRepo: IMarketplaceRepositoryPort;
    let useCase: SubmitProposalUseCase;

    beforeEach(() => {
      mockMarketplaceRepo = {
        findRequirementById: vi.fn(),
        countActiveProposalsByDietitian: vi.fn(),
        createProposal: vi.fn().mockResolvedValue(undefined)
      };
      useCase = new SubmitProposalUseCase(mockMarketplaceRepo);
    });

    it('should submit proposal when active bids are within tier limit', async () => {
      (mockMarketplaceRepo.findRequirementById as any).mockResolvedValue({
        id: 'req-open-1',
        status: 'OPEN',
        isLocked: false
      });
      // NEW tier limit is 25 bids, currently at 10 bids
      (mockMarketplaceRepo.countActiveProposalsByDietitian as any).mockResolvedValue(10);

      const result = await useCase.execute({
        proposalId: 'prop-101',
        requirementId: 'req-open-1',
        dietitianId: 'dietitian-new',
        dietitianTier: 'NEW',
        bidAmountCents: 15000,
        coverLetter: 'Expert clinical nutritionist proposal'
      });

      expect(result.proposalId).toBe('prop-101');
      expect(result.status).toBe('SUBMITTED');
      expect(mockMarketplaceRepo.createProposal).toHaveBeenCalledWith({
        id: 'prop-101',
        requirementId: 'req-open-1',
        dietitianId: 'dietitian-new',
        bidAmountCents: 15000,
        coverLetter: 'Expert clinical nutritionist proposal'
      });
    });

    it('should reject proposal if dietitian has reached tier proposal limit', async () => {
      (mockMarketplaceRepo.findRequirementById as any).mockResolvedValue({
        id: 'req-open-1',
        status: 'OPEN',
        isLocked: false
      });
      // NEW tier limit is 25 bids, currently at 25 bids
      (mockMarketplaceRepo.countActiveProposalsByDietitian as any).mockResolvedValue(25);

      await expect(
        useCase.execute({
          proposalId: 'prop-overlimit',
          requirementId: 'req-open-1',
          dietitianId: 'dietitian-new',
          dietitianTier: 'NEW',
          bidAmountCents: 15000,
          coverLetter: 'Proposal'
        })
      ).rejects.toThrow(DomainException);
    });

    it('should reject proposal if requirement is locked or already hired', async () => {
      (mockMarketplaceRepo.findRequirementById as any).mockResolvedValue({
        id: 'req-locked',
        status: 'IN_CONTRACT',
        isLocked: true
      });

      await expect(
        useCase.execute({
          proposalId: 'prop-1',
          requirementId: 'req-locked',
          dietitianId: 'dietitian-1',
          dietitianTier: 'SILVER',
          bidAmountCents: 10000,
          coverLetter: 'Test'
        })
      ).rejects.toThrow(DomainException);
    });

    it('should reject proposal if requirement does not exist', async () => {
      (mockMarketplaceRepo.findRequirementById as any).mockResolvedValue(null);

      await expect(
        useCase.execute({
          proposalId: 'prop-1',
          requirementId: 'req-missing',
          dietitianId: 'dietitian-1',
          dietitianTier: 'GOLD',
          bidAmountCents: 10000,
          coverLetter: 'Test'
        })
      ).rejects.toThrow(DomainException);
    });

    it('should reject invalid bid amount or missing parameters', async () => {
      await expect(
        useCase.execute({
          proposalId: '',
          requirementId: 'req-1',
          dietitianId: 'd-1',
          dietitianTier: 'NEW',
          bidAmountCents: 1000,
          coverLetter: ''
        })
      ).rejects.toThrow(DomainException);

      await expect(
        useCase.execute({
          proposalId: 'p-1',
          requirementId: 'req-1',
          dietitianId: 'd-1',
          dietitianTier: 'NEW',
          bidAmountCents: -50,
          coverLetter: ''
        })
      ).rejects.toThrow(DomainException);
    });
  });

  describe('ProcessClinicalSimulationUseCase', () => {
    let mockVerificationRepo: IDietitianVerificationRepositoryPort;
    let mockAiSimulator: IAISimulatorPort;
    let useCase: ProcessClinicalSimulationUseCase;

    const createBaseVerification = (): DietitianVerification => {
      return DietitianVerification.createPathwayB({
        dietitianId: 'candidate-rd-1',
        degreeTitle: 'Bachelor of Science in Dietetics',
        institution: 'State University of Clinical Nutrition',
        graduationYear: 2024,
        degreeDocumentId: 'doc-transcript-1'
      });
    };

    beforeEach(() => {
      mockVerificationRepo = {
        findById: vi.fn(),
        save: vi.fn().mockResolvedValue(undefined)
      };
      mockAiSimulator = {
        generatePatientTurn: vi.fn(),
        evaluateClinicalRubric: vi.fn()
      };
      useCase = new ProcessClinicalSimulationUseCase(mockVerificationRepo, mockAiSimulator);
    });

    it('should approve verification when AI evaluation meets passing threshold (>=75%) with 0 allergens', async () => {
      const verification = createBaseVerification();
      (mockVerificationRepo.findById as any).mockResolvedValue(verification);

      (mockAiSimulator.evaluateClinicalRubric as any).mockResolvedValue({
        scorePercent: 85,
        allergenViolationsCount: 0,
        allergenSafe: true,
        passed: true,
        clinicalFeedback: 'Excellent macronutrient distribution and zero allergen conflicts.'
      });

      const result = await useCase.execute({
        verificationId: verification.id,
        scenarioTitle: 'Type 2 Diabetes + Peanut Allergy',
        knownAllergens: ['Peanuts'],
        clinicalGoal: 'Glycemic stabilization',
        transcript: [{ role: 'user', content: 'Hello' }],
        finalDietPlanSubmission: 'Allergen-free meal schedule'
      });

      expect(result.verificationId).toBe(verification.id);
      expect(result.isApprovedForBidding).toBe(true);
      expect(result.scorePercent).toBe(85);
      expect(result.allergenViolationsCount).toBe(0);
      expect(mockVerificationRepo.save).toHaveBeenCalledWith(verification);
    });

    it('should reject verification when AI evaluation encounters allergen violations', async () => {
      const verification = createBaseVerification();
      (mockVerificationRepo.findById as any).mockResolvedValue(verification);

      (mockAiSimulator.evaluateClinicalRubric as any).mockResolvedValue({
        scorePercent: 90,
        allergenViolationsCount: 1, // Severe allergen violation!
        allergenSafe: false,
        passed: false,
        clinicalFeedback: 'Fatal flaw: Recommended peanut butter in meal schedule.'
      });

      const result = await useCase.execute({
        verificationId: verification.id,
        scenarioTitle: 'Type 2 Diabetes + Peanut Allergy',
        knownAllergens: ['Peanuts'],
        clinicalGoal: 'Glycemic stabilization',
        transcript: [],
        finalDietPlanSubmission: 'Peanut plan'
      });

      expect(result.isApprovedForBidding).toBe(false);
      expect(result.allergenViolationsCount).toBe(1);
    });

    it('should throw DomainException if verification record is not found', async () => {
      (mockVerificationRepo.findById as any).mockResolvedValue(null);

      await expect(
        useCase.execute({
          verificationId: 'non-existent',
          scenarioTitle: 'Test',
          knownAllergens: [],
          clinicalGoal: 'Test',
          transcript: [],
          finalDietPlanSubmission: ''
        })
      ).rejects.toThrow(DomainException);
    });
  });
});
