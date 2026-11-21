import { test, expect } from '@playwright/test';
import { Money } from '../../apps/api/src/bounded-contexts/shared/domain/value-objects/money.vo';
import { ProposalLimit } from '../../apps/api/src/bounded-contexts/marketplace/domain/value-objects/proposal-limit.vo';
import { Contract, ContractStatus } from '../../apps/api/src/bounded-contexts/escrow/domain/entities/contract.entity';
import { DietitianLevelProfile, DietitianTier } from '../../apps/api/src/bounded-contexts/reputation/domain/entities/dietitian-level.entity';
import { DietitianVerification, VerificationPathway, VerificationStatus } from '../../apps/api/src/bounded-contexts/identity/domain/entities/dietitian-verification.entity';
import { ConsultationSession, ConsultationStatus } from '../../apps/api/src/bounded-contexts/clinical/domain/entities/consultation-session.entity';
import { DisputeTicket, DisputeStatus, RulingOutcome } from '../../apps/api/src/bounded-contexts/tribunal/domain/entities/dispute-ticket.entity';

test.describe('Phase 8: End-to-End Multi-Role Lifecycle & Integration Flow Suite', () => {

  test('Flow A: Dietitian Onboarding -> AI Simulation Exam -> Practitioner Level Assignment', async () => {
    // 1. Candidate initiates Pathway B verification (Degree + AI Simulation)
    const verification = DietitianVerification.createPathwayB({
      dietitianId: 'dietitian-e2e-001',
      degreeTitle: 'Bachelor of Science in Human Nutrition & Dietetics',
      institution: 'Johns Hopkins University',
      graduationYear: 2024,
      degreeDocumentId: 'doc-degree-001'
    });

    expect(verification.status).toBe(VerificationStatus.UNDER_REVIEW);
    expect(verification.pathway).toBe(VerificationPathway.PATHWAY_B_DEGREE_EXAM);

    // 2. Candidate completes AI clinical examination simulation (minimum 5 turns required)
    const examScore = 88;
    const allergenViolations = 0;
    verification.recordAiSimulationExamResult({
      completedTurns: 10,
      clinicalScorePercent: examScore,
      allergenViolationsCount: allergenViolations,
      evaluatorNotes: 'Demonstrated superior diagnostic acumen and zero allergen contraindications.'
    });

    // Invariant: Pass mark >= 75% and zero allergen violations leads to approval
    expect(verification.status).toBe(VerificationStatus.APPROVED);
    expect(verification.examScore).toBe(88);

    // 3. Practitioner receives initial New Dietitian tier level profile
    const profile = DietitianLevelProfile.create({
      dietitianId: 'dietitian-e2e-001',
      tier: DietitianTier.NEW
    });
    expect(profile.tier).toBe(DietitianTier.NEW);
    expect(profile.maxActiveProposals).toBe(25);
  });

  test('Flow B: Client Requirement -> Dietitian Bidding -> Escrow Funding Invariant', async () => {
    const proposalCap = ProposalLimit.forLevel('NEW');
    expect(proposalCap.maxActiveProposals).toBe(25);

    // Create contract with financial double-entry invariant: Total = Fee + Net
    const totalAmount = Money.fromDollars(500, 'USD'); // $500.00
    const startedAt = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
    const targetDeliveryDate = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000); // 5 days ago (strictly after startedAt)

    const contract = Contract.create({
      id: 'contract-e2e-001',
      proposalId: 'proposal-e2e-001',
      dietitianId: 'dietitian-e2e-001',
      clientId: 'client-e2e-001',
      totalAmount,
      platformFeePercent: 15,
      requiredConsultations: 2,
      startedAt,
      targetDeliveryDate
    });

    expect(contract.status).toBe(ContractStatus.DRAFT);
    expect(contract.totalAmount.cents).toBe(50000);
    expect(contract.platformFee.cents).toBe(7500); // 15% of $500 = $75.00
    expect(contract.netEarnings.cents).toBe(42500); // 85% of $500 = $425.00
    // Financial Balance Invariant
    expect(contract.totalAmount.cents).toBe(contract.platformFee.cents + contract.netEarnings.cents);

    // Escrow is locked
    contract.lockEscrow('stripe_ch_test_123456');
    expect(contract.status).toBe(ContractStatus.ACTIVE);
  });

  test('Flow C: WebRTC Consultation Attendance Verification -> Meal Plan Delivery -> Escrow Disbursement', async () => {
    // 1. Consultation session established
    const session = ConsultationSession.create({
      id: 'session-e2e-001',
      contractId: 'contract-e2e-001',
      dietitianId: 'dietitian-e2e-001',
      clientId: 'client-e2e-001',
      scheduledAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      durationMinutes: 30
    });

    // 2. Both parties join room and accumulate presence (960s = 16 minutes > 15m threshold of 900s)
    session.recordPresence('dietitian-e2e-001', 960);
    session.recordPresence('client-e2e-001', 960);

    session.evaluateAttendance();
    expect(session.status).toBe(ConsultationStatus.VERIFIED);
    expect(session.isVerified()).toBe(true);

    // 3. Contract Triple-Check Verification Gate
    const contract = Contract.create({
      id: 'contract-e2e-001',
      proposalId: 'proposal-e2e-001',
      dietitianId: 'dietitian-e2e-001',
      clientId: 'client-e2e-001',
      totalAmount: Money.fromDollars(300, 'USD'),
      platformFeePercent: 15,
      requiredConsultations: 1,
      startedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
      targetDeliveryDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
    });
    contract.lockEscrow('ch_fund_987');

    const isEligible = contract.isEligibleForDisbursement({
      currentTime: new Date(),
      mealPlanDelivered: true,
      verifiedConsultationsCount: 1
    });

    expect(isEligible).toBe(true);

    // 4. Security Clearing & Disbursement Pipeline
    contract.startSecurityClearing();
    expect(contract.status).toBe(ContractStatus.CLEARING);

    contract.completeDisbursement();
    expect(contract.status).toBe(ContractStatus.COMPLETED);
  });

  test('Flow D: Disciplinary Tribunal Dispute -> Escrow Freezing -> Split Ruling -> Disciplinary Demotion', async () => {
    // 1. Contract with locked funds
    const contract = Contract.create({
      id: 'contract-e2e-002',
      proposalId: 'proposal-e2e-002',
      dietitianId: 'dietitian-e2e-002',
      clientId: 'client-e2e-002',
      totalAmount: Money.fromDollars(600, 'USD'),
      platformFeePercent: 15,
      requiredConsultations: 2,
      startedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      targetDeliveryDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000)
    });
    contract.lockEscrow('ch_fund_disputed');

    // 2. Client files dispute ticket
    const dispute = DisputeTicket.create({
      id: 'dispute-e2e-001',
      contractId: contract.id,
      initiatorId: 'client-e2e-002',
      respondentId: 'dietitian-e2e-002',
      reason: 'Dietitian missed second consultation and failed to deliver updated meal plan.'
    });

    // Escrow is immediately frozen on dispute
    contract.freezeForDispute();
    expect(contract.status).toBe(ContractStatus.DISPUTED);
    expect(dispute.status).toBe(DisputeStatus.OPEN);

    // 3. Evidence is docketed
    dispute.attachEvidence({
      id: 'ev-001',
      uploaderId: 'client-e2e-002',
      documentUrl: 'https://minio.local/evidence/call-log.pdf',
      description: 'Attendance log showing dietitian absence.'
    });
    expect(dispute.evidenceList.length).toBe(1);

    // 4. Arbitrator assumes jurisdiction
    dispute.beginArbitration('arbitrator-001');
    expect(dispute.status).toBe(DisputeStatus.UNDER_ARBITRATION);

    // 5. Arbitrator issues split ruling (50/50 refund) and assesses disciplinary strike
    const ruling = dispute.resolveDispute({
      outcome: RulingOutcome.SPLIT_50_50,
      justification: 'Dietitian delivered partial week 1 plan but missed week 2 clinical consultation without notice.',
      assignStrikeToRespondent: true
    });

    expect(dispute.status).toBe(DisputeStatus.RESOLVED);
    expect(ruling.assignStrikeToRespondent).toBe(true);

    // 6. Disciplinary Three-Strike Invariant: Strike 2 triggers immediate demotion
    const dietitianProfile = DietitianLevelProfile.create({
      dietitianId: 'dietitian-e2e-002',
      tier: DietitianTier.SILVER,
      completedContracts: 15
    });
    expect(dietitianProfile.tier).toBe(DietitianTier.SILVER);
    expect(dietitianProfile.maxActiveProposals).toBe(35);

    // Apply Strike 1 (Warning)
    dietitianProfile.applyStrike('First warning for tardiness');
    expect(dietitianProfile.strikesCount).toBe(1);
    expect(dietitianProfile.tier).toBe(DietitianTier.SILVER);

    // Apply Strike 2 (Tribunal ruling sanction) -> Immediate transactional demotion to NEW tier
    dietitianProfile.applyStrike(ruling.justification);
    expect(dietitianProfile.strikesCount).toBe(2);
    expect(dietitianProfile.tier).toBe(DietitianTier.NEW);
    expect(dietitianProfile.maxActiveProposals).toBe(25);
  });
});
