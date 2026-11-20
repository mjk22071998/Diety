import { describe, it, expect } from 'vitest';
import {
  DisputeTicket,
  DisputeStatus,
  RulingOutcome
} from '../../../src/bounded-contexts/tribunal/domain/entities/dispute-ticket.entity';
import { DomainException } from '../../../src/bounded-contexts/shared/domain/exceptions/domain.exception';

describe('Task 2.6: Disciplinary Tribunal & Dispute Aggregate (Pure TDD)', () => {
  const createBaseDispute = () =>
    DisputeTicket.create({
      id: 'dispute-101',
      contractId: 'contract-101',
      initiatorId: 'client-1',
      respondentId: 'dietitian-1',
      reason: 'Dietitian missed 2 scheduled consultations and did not deliver week 3 meal plan'
    });

  describe('Dispute Creation & Evidence Attachment', () => {
    it('should initialize dispute ticket in OPEN status', () => {
      const ticket = createBaseDispute();
      expect(ticket.id).toBe('dispute-101');
      expect(ticket.status).toBe(DisputeStatus.OPEN);
      expect(ticket.evidenceList).toHaveLength(0);
      expect(ticket.ruling).toBeUndefined();
    });

    it('should reject creation if initiator and respondent are the same user', () => {
      expect(() =>
        DisputeTicket.create({
          id: 'dispute-inv',
          contractId: 'contract-101',
          initiatorId: 'user-1',
          respondentId: 'user-1',
          reason: 'Self-dispute invalid'
        })
      ).toThrow(DomainException);
    });

    it('should allow attaching verified documentary evidence before arbitration closes', () => {
      const ticket = createBaseDispute();
      ticket.attachEvidence({
        id: 'ev-1',
        uploaderId: 'client-1',
        documentUrl: 'https://minio.local/evidence/chat-screenshot.png',
        description: 'Screenshot showing no response for 5 consecutive days'
      });

      expect(ticket.evidenceList).toHaveLength(1);
      expect(ticket.evidenceList[0]?.id).toBe('ev-1');
    });
    it('should throw DomainException if required fields are missing on creation', () => {
      expect(() =>
        DisputeTicket.create({
          id: '',
          contractId: 'c-1',
          initiatorId: 'u-1',
          respondentId: 'u-2',
          reason: 'Reason'
        })
      ).toThrow(DomainException);
    });

    it('should throw DomainException if attaching evidence to a finalized dispute', () => {
      const ticket = createBaseDispute();
      ticket.beginArbitration('arb-1');
      ticket.resolveDispute({
        outcome: RulingOutcome.SPLIT_50_50,
        justification: 'Settled',
        assignStrikeToRespondent: false
      });

      expect(() =>
        ticket.attachEvidence({
          id: 'late-ev',
          uploaderId: 'client-1',
          documentUrl: 'http://test',
          description: 'Late evidence'
        })
      ).toThrow(DomainException);
    });

    it('should throw DomainException if arbitratorId is missing or starting arbitration from invalid status', () => {
      const ticket = createBaseDispute();
      expect(() => ticket.beginArbitration('')).toThrow(DomainException);

      ticket.beginArbitration('arb-1');
      // Already UNDER_ARBITRATION
      expect(() => ticket.beginArbitration('arb-2')).toThrow(DomainException);
    });

    it('should throw DomainException if written justification is missing on resolution', () => {
      const ticket = createBaseDispute();
      ticket.beginArbitration('arb-1');

      expect(() =>
        ticket.resolveDispute({
          outcome: RulingOutcome.SPLIT_50_50,
          justification: '   ', // Empty whitespace
          assignStrikeToRespondent: false
        })
      ).toThrow(DomainException);
    });
  });

  describe('Tribunal Arbitration Rulings & Sanctions', () => {
    it('should transition to UNDER_ARBITRATION when staff arbitrator opens the case', () => {
      const ticket = createBaseDispute();
      ticket.beginArbitration('staff-arbitrator-1');
      expect(ticket.status).toBe(DisputeStatus.UNDER_ARBITRATION);
      expect(ticket.arbitratorId).toBe('staff-arbitrator-1');
    });

    it('should rule in favor of client with full refund and assign strike to dietitian for clinical negligence', () => {
      const ticket = createBaseDispute();
      ticket.beginArbitration('staff-arbitrator-1');

      const ruling = ticket.resolveDispute({
        outcome: RulingOutcome.REFUND_CLIENT_FULL,
        justification: 'Dietitian breached contract deliverables and unexcused no-show',
        assignStrikeToRespondent: true
      });

      expect(ticket.status).toBe(DisputeStatus.RESOLVED);
      expect(ticket.resolvedAt).toBeInstanceOf(Date);
      expect(ruling.outcome).toBe(RulingOutcome.REFUND_CLIENT_FULL);
      expect(ruling.assignStrikeToRespondent).toBe(true);
    });

    it('should rule 50/50 split settlement with zero strikes applied', () => {
      const ticket = createBaseDispute();
      ticket.beginArbitration('staff-arbitrator-1');

      const ruling = ticket.resolveDispute({
        outcome: RulingOutcome.SPLIT_50_50,
        justification: 'Mutual partial failure: client delayed responses, dietitian delivered incomplete plan',
        assignStrikeToRespondent: false
      });

      expect(ticket.status).toBe(DisputeStatus.RESOLVED);
      expect(ruling.outcome).toBe(RulingOutcome.SPLIT_50_50);
      expect(ruling.assignStrikeToRespondent).toBe(false);
    });

    it('should dismiss dispute when claim is unfounded, releasing funds to dietitian', () => {
      const ticket = createBaseDispute();
      ticket.beginArbitration('staff-arbitrator-1');

      const ruling = ticket.resolveDispute({
        outcome: RulingOutcome.DISBURSE_DIETITIAN_FULL,
        justification: 'Client claim unfounded: all deliverables were provided and consultations logged',
        assignStrikeToRespondent: false
      });

      expect(ticket.status).toBe(DisputeStatus.RESOLVED);
      expect(ruling.outcome).toBe(RulingOutcome.DISBURSE_DIETITIAN_FULL);
    });

    it('should reject resolving a dispute that is already resolved or not under arbitration', () => {
      const ticket = createBaseDispute();
      // Still OPEN, not under arbitration
      expect(() =>
        ticket.resolveDispute({
          outcome: RulingOutcome.SPLIT_50_50,
          justification: 'Too early',
          assignStrikeToRespondent: false
        })
      ).toThrow(DomainException);
    });
  });
});
