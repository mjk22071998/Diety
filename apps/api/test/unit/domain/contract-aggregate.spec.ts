import { describe, it, expect } from 'vitest';
import { Contract, ContractStatus } from '../../../src/bounded-contexts/escrow/domain/entities/contract.entity';
import { EscrowTransaction, EscrowTransactionType } from '../../../src/bounded-contexts/escrow/domain/entities/escrow-transaction.entity';
import { Money } from '../../../src/bounded-contexts/shared/domain/value-objects/money.vo';
import { DomainException } from '../../../src/bounded-contexts/shared/domain/exceptions/domain.exception';

describe('Task 2.2: Escrow & Contract Aggregate Root (Pure TDD)', () => {
  const createBaseContract = (platformFeePercent = 10) => {
    const startedAt = new Date('2026-11-01T00:00:00Z');
    const targetDeliveryDate = new Date('2026-11-29T00:00:00Z'); // 28 days contract
    return Contract.create({
      id: 'contract-101',
      clientId: 'client-1',
      dietitianId: 'dietitian-1',
      proposalId: 'prop-1',
      totalAmount: Money.fromCents(20000, 'USD'), // $200.00
      platformFeePercent,
      requiredConsultations: 4,
      startedAt,
      targetDeliveryDate
    });
  };

  describe('Contract Creation & Double-Entry Fee Invariant', () => {
    it('should create contract and enforce Total === PlatformFee + NetEarnings at 10% standard rate', () => {
      const contract = createBaseContract(10);
      expect(contract.id).toBe('contract-101');
      expect(contract.status).toBe(ContractStatus.DRAFT);
      expect(contract.totalAmount.cents).toBe(20000);
      expect(contract.platformFee.cents).toBe(2000); // 10% of 20000
      expect(contract.netEarnings.cents).toBe(18000);

      // Invariant: Total === Fee + Net
      expect(contract.platformFee.add(contract.netEarnings).equals(contract.totalAmount)).toBe(true);
    });

    it('should compute discounted 8% fee for Top-Rated dietitians and preserve exact double-entry equality', () => {
      const contract = createBaseContract(8);
      expect(contract.platformFee.cents).toBe(1600); // 8% of 20000
      expect(contract.netEarnings.cents).toBe(18400);
      expect(contract.platformFee.add(contract.netEarnings).equals(contract.totalAmount)).toBe(true);
    });

    it('should preserve exact penny equality even with odd total amounts (e.g. $199.99)', () => {
      const contract = Contract.create({
        id: 'contract-odd',
        clientId: 'client-1',
        dietitianId: 'dietitian-1',
        proposalId: 'prop-1',
        totalAmount: Money.fromCents(19999, 'USD'),
        platformFeePercent: 10,
        requiredConsultations: 2,
        startedAt: new Date(),
        targetDeliveryDate: new Date(Date.now() + 86400000)
      });

      // Fee = round(19999 * 0.10) = 2000 cents
      // Net = 19999 - 2000 = 17999 cents
      expect(contract.platformFee.cents).toBe(2000);
      expect(contract.netEarnings.cents).toBe(17999);
      expect(contract.platformFee.add(contract.netEarnings).cents).toBe(19999);
    });

    it('should reject invalid dates where target delivery date is before startedAt', () => {
      expect(() =>
        Contract.create({
          id: 'contract-inv',
          clientId: 'client-1',
          dietitianId: 'dietitian-1',
          proposalId: 'prop-1',
          totalAmount: Money.fromCents(10000, 'USD'),
          platformFeePercent: 10,
          requiredConsultations: 1,
          startedAt: new Date('2026-11-10T00:00:00Z'),
          targetDeliveryDate: new Date('2026-11-09T00:00:00Z') // Before startedAt
        })
      ).toThrow(DomainException);
    });
  });

  describe('Lifecycle State Machine Transitions', () => {
    it('should transition DRAFT -> ACTIVE when escrow deposit is locked', () => {
      const contract = createBaseContract();
      const tx = contract.lockEscrow('payment-intent-1');

      expect(contract.status).toBe(ContractStatus.ACTIVE);
      expect(tx.type).toBe(EscrowTransactionType.ESCROW_HOLD);
      expect(tx.amount.equals(contract.totalAmount)).toBe(true);
      expect(contract.transactions).toHaveLength(1);
    });

    it('should not allow locking escrow if already active', () => {
      const contract = createBaseContract();
      contract.lockEscrow('tx-1');
      expect(() => contract.lockEscrow('tx-2')).toThrow(DomainException);
    });

    it('should transition ACTIVE -> SUBMITTED_FOR_APPROVAL when dietitian delivers', () => {
      const contract = createBaseContract();
      contract.lockEscrow('tx-1');
      contract.submitForApproval();
      expect(contract.status).toBe(ContractStatus.SUBMITTED_FOR_APPROVAL);
    });

    it('should transition to CLEARING when approval conditions are met', () => {
      const contract = createBaseContract();
      contract.lockEscrow('tx-1');
      contract.submitForApproval();
      const clearingTx = contract.startSecurityClearing(72);

      expect(contract.status).toBe(ContractStatus.CLEARING);
      expect(contract.clearingPeriodHours).toBe(72);
      expect(clearingTx.type).toBe(EscrowTransactionType.SECURITY_CLEARING);
    });

    it('should transition CLEARING -> COMPLETED upon clearing timer expiry and generate disbursement transactions', () => {
      const contract = createBaseContract();
      contract.lockEscrow('tx-1');
      contract.submitForApproval();
      contract.startSecurityClearing(72);

      const disbursements = contract.completeDisbursement();
      expect(contract.status).toBe(ContractStatus.COMPLETED);
      expect(disbursements).toHaveLength(2);

      // Payout to dietitian
      const payoutTx = disbursements.find((t) => t.type === EscrowTransactionType.DISBURSEMENT_PAYOUT);
      expect(payoutTx?.amount.equals(contract.netEarnings)).toBe(true);

      // Fee collection to platform
      const feeTx = disbursements.find((t) => t.type === EscrowTransactionType.PLATFORM_FEE_COLLECTION);
      expect(feeTx?.amount.equals(contract.platformFee)).toBe(true);
    });

    it('should freeze escrow and transition to DISPUTED if dispute is opened during ACTIVE or CLEARING', () => {
      const contract = createBaseContract();
      contract.lockEscrow('tx-1');
      contract.freezeForDispute('dispute-ticket-1');

      expect(contract.status).toBe(ContractStatus.DISPUTED);
      expect(contract.disputeId).toBe('dispute-ticket-1');

      // Cannot disburse while disputed
      expect(() => contract.completeDisbursement()).toThrow(DomainException);
    });

    it('should refund client 100% of deposit upon dispute resolution in client favor', () => {
      const contract = createBaseContract();
      contract.lockEscrow('tx-1');
      contract.freezeForDispute('dispute-ticket-1');

      const refundTx = contract.refundClient('arbitrator-decision-1');
      expect(contract.status).toBe(ContractStatus.REFUNDED);
      expect(refundTx.type).toBe(EscrowTransactionType.CLIENT_REFUND);
      expect(refundTx.amount.equals(contract.totalAmount)).toBe(true);
    });
    it('should throw DomainException when submitting for approval from invalid state', () => {
      const contract = createBaseContract();
      // Still in DRAFT
      expect(() => contract.submitForApproval()).toThrow(DomainException);
    });

    it('should throw DomainException when starting security clearing from invalid state', () => {
      const contract = createBaseContract();
      // Still in DRAFT
      expect(() => contract.startSecurityClearing(72)).toThrow(DomainException);
    });

    it('should throw DomainException when freezing already finalized or refunded contract', () => {
      const contract = createBaseContract();
      contract.lockEscrow('tx-1');
      contract.submitForApproval();
      contract.startSecurityClearing(72);
      contract.completeDisbursement();

      // Now COMPLETED
      expect(() => contract.freezeForDispute('late-dispute')).toThrow(DomainException);
    });

    it('should throw DomainException when attempting to refund a contract not in DISPUTED status', () => {
      const contract = createBaseContract();
      contract.lockEscrow('tx-1');
      expect(() => contract.refundClient('premature-refund')).toThrow(DomainException);
    });

    it('should throw DomainException for invalid fee percent', () => {
      expect(() =>
        Contract.create({
          id: 'contract-inv-fee',
          clientId: 'client-1',
          dietitianId: 'dietitian-1',
          proposalId: 'prop-1',
          totalAmount: Money.fromCents(10000, 'USD'),
          platformFeePercent: 150, // Invalid!
          requiredConsultations: 1,
          startedAt: new Date('2026-11-01T00:00:00Z'),
          targetDeliveryDate: new Date('2026-11-10T00:00:00Z')
        })
      ).toThrow(DomainException);
    });

    it('should throw DomainException for invalid transaction props', () => {
      expect(
        () =>
          new EscrowTransaction({
            id: '',
            contractId: 'c-1',
            type: EscrowTransactionType.ESCROW_HOLD,
            amount: Money.fromCents(100, 'USD'),
            referenceId: 'ref-1'
          })
      ).toThrow(DomainException);
    });
  });

  describe('Triple-Check Escrow Release Prerequisite Invariants', () => {
    it('should reject disbursement if calendar time elapsed is less than 75%', () => {
      const contract = createBaseContract();
      contract.lockEscrow('tx-1');
      contract.submitForApproval();

      // Started: Nov 1, End: Nov 29 (28 days). 75% = 21 days = Nov 22.
      // Current date: Nov 15 (only 14 days, 50% elapsed)
      const currentEarlyDate = new Date('2026-11-15T00:00:00Z');
      const isEligible = contract.isEligibleForDisbursement({
        currentTime: currentEarlyDate,
        mealPlanDelivered: true,
        verifiedConsultationsCount: 4
      });

      expect(isEligible).toBe(false);
    });

    it('should reject disbursement if meal plan was not delivered', () => {
      const contract = createBaseContract();
      contract.lockEscrow('tx-1');
      contract.submitForApproval();

      // Date is past 75% (Nov 25)
      const validDate = new Date('2026-11-25T00:00:00Z');
      const isEligible = contract.isEligibleForDisbursement({
        currentTime: validDate,
        mealPlanDelivered: false, // Incomplete deliverable!
        verifiedConsultationsCount: 4
      });

      expect(isEligible).toBe(false);
    });

    it('should reject disbursement if verified consultations count is less than required', () => {
      const contract = createBaseContract();
      contract.lockEscrow('tx-1');
      contract.submitForApproval();

      const validDate = new Date('2026-11-25T00:00:00Z');
      const isEligible = contract.isEligibleForDisbursement({
        currentTime: validDate,
        mealPlanDelivered: true,
        verifiedConsultationsCount: 3 // Only 3 of 4 completed
      });

      expect(isEligible).toBe(false);
    });

    it('should approve disbursement when all 4 conditions are fully satisfied', () => {
      const contract = createBaseContract();
      contract.lockEscrow('tx-1');
      contract.submitForApproval();

      const validDate = new Date('2026-11-25T00:00:00Z');
      const isEligible = contract.isEligibleForDisbursement({
        currentTime: validDate,
        mealPlanDelivered: true,
        verifiedConsultationsCount: 4
      });

      expect(isEligible).toBe(true);
    });
  });
});
