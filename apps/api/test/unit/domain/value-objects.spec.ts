import { describe, it, expect } from 'vitest';
import { Money } from '../../../src/bounded-contexts/shared/domain/value-objects/money.vo';
import { RatingScore } from '../../../src/bounded-contexts/shared/domain/value-objects/rating-score.vo';
import { ProposalLimit } from '../../../src/bounded-contexts/marketplace/domain/value-objects/proposal-limit.vo';
import { DomainException } from '../../../src/bounded-contexts/shared/domain/exceptions/domain.exception';

describe('Task 2.1: Domain Value Objects (Pure TDD)', () => {
  describe('Money Value Object', () => {
    it('should create Money from integer cents', () => {
      const money = Money.fromCents(15000, 'USD');
      expect(money.cents).toBe(15000);
      expect(money.currency).toBe('USD');
      expect(money.dollars).toBe(150.0);
    });

    it('should create Money from dollar amounts and convert to integer cents', () => {
      const money = Money.fromDollars(99.99, 'USD');
      expect(money.cents).toBe(9999);
      expect(money.dollars).toBe(99.99);
    });

    it('should throw DomainException if cents is not an integer', () => {
      expect(() => Money.fromCents(100.45)).toThrow(DomainException);
    });

    it('should throw DomainException if amount is negative by default', () => {
      expect(() => Money.fromCents(-500)).toThrow(DomainException);
    });

    it('should format money to standard human-readable currency string', () => {
      const money = Money.fromCents(25000, 'USD');
      expect(money.format()).toBe('$250.00');
    });

    it('should accurately add two Money instances of the same currency', () => {
      const m1 = Money.fromCents(10000, 'USD');
      const m2 = Money.fromCents(5000, 'USD');
      const sum = m1.add(m2);
      expect(sum.cents).toBe(15000);
    });

    it('should reject addition of different currencies', () => {
      const m1 = Money.fromCents(10000, 'USD');
      const m2 = Money.fromCents(5000, 'EUR');
      expect(() => m1.add(m2)).toThrow(DomainException);
    });

    it('should accurately subtract Money instances', () => {
      const m1 = Money.fromCents(10000, 'USD');
      const m2 = Money.fromCents(3000, 'USD');
      const diff = m1.subtract(m2);
      expect(diff.cents).toBe(7000);
    });

    it('should throw DomainException if subtraction produces a negative result', () => {
      const m1 = Money.fromCents(5000, 'USD');
      const m2 = Money.fromCents(10000, 'USD');
      expect(() => m1.subtract(m2)).toThrow(DomainException);
    });

    it('should compute exact platform fee percentage with integer rounding', () => {
      // 10% fee on $200.00 (20000 cents) = $20.00 (2000 cents)
      const total = Money.fromCents(20000, 'USD');
      const fee = total.percentage(10);
      expect(fee.cents).toBe(2000);

      // 8% Top-Rated fee on $199.99 (19999 cents) = Math.round(19999 * 0.08) = 1600 cents ($16.00)
      const discountedFee = Money.fromCents(19999, 'USD').percentage(8);
      expect(discountedFee.cents).toBe(1600);
    });

    it('should split money without losing a single cent (Remainder Distribution)', () => {
      // $100.00 split 3 ways: 10000 cents / 3 = 3334, 3333, 3333 = 10000 cents
      const money = Money.fromCents(10000, 'USD');
      const splits = money.split(3);
      expect(splits).toHaveLength(3);
      expect(splits[0]?.cents).toBe(3334);
      expect(splits[1]?.cents).toBe(3333);
      expect(splits[2]?.cents).toBe(3333);
      const total = splits.reduce((acc, m) => acc.add(m), Money.zero('USD'));
      expect(total.cents).toBe(10000);
    });

    it('should throw DomainException if multiplying by a negative factor', () => {
      const money = Money.fromCents(1000, 'USD');
      expect(() => money.multiply(-2)).toThrow(DomainException);
    });

    it('should throw DomainException if percentage is invalid', () => {
      const money = Money.fromCents(1000, 'USD');
      expect(() => money.percentage(-5)).toThrow(DomainException);
      expect(() => money.percentage(105)).toThrow(DomainException);
    });

    it('should throw DomainException if splitting by invalid parts', () => {
      const money = Money.fromCents(1000, 'USD');
      expect(() => money.split(0)).toThrow(DomainException);
      expect(() => money.split(-2)).toThrow(DomainException);
      expect(() => money.split(1.5)).toThrow(DomainException);
    });

    it('should correctly evaluate isZero', () => {
      expect(Money.zero('USD').isZero()).toBe(true);
      expect(Money.fromCents(100, 'USD').isZero()).toBe(false);
    });

    it('should multiply money by a positive factor', () => {
      const money = Money.fromCents(1000, 'USD');
      expect(money.multiply(2.5).cents).toBe(2500);
    });

    it('should properly compare values with equals, isGreaterThan, and isLessThan', () => {
      const a = Money.fromCents(5000, 'USD');
      const b = Money.fromCents(5000, 'USD');
      const c = Money.fromCents(6000, 'USD');

      expect(a.equals(b)).toBe(true);
      expect(a.equals(c)).toBe(false);
      expect(c.isGreaterThan(a)).toBe(true);
      expect(a.isLessThan(c)).toBe(true);
    });
  });

  describe('RatingScore Value Object', () => {
    it('should instantiate valid rating between 1.0 and 5.0 rounded to 1 decimal', () => {
      const rating = RatingScore.create(4.85);
      expect(rating.value).toBe(4.9);
      expect(rating.isTopRated()).toBe(true);
    });

    it('should accept edge values 1.0 and 5.0', () => {
      expect(RatingScore.create(1.0).value).toBe(1.0);
      expect(RatingScore.create(5.0).value).toBe(5.0);
    });

    it('should compare rating scores for equality', () => {
      const r1 = RatingScore.create(4.5);
      const r2 = RatingScore.create(4.5);
      const r3 = RatingScore.create(4.6);
      expect(r1.equals(r2)).toBe(true);
      expect(r1.equals(r3)).toBe(false);
    });

    it('should reject ratings below 1.0', () => {
      expect(() => RatingScore.create(0.9)).toThrow(DomainException);
    });

    it('should reject ratings above 5.0', () => {
      expect(() => RatingScore.create(5.1)).toThrow(DomainException);
    });

    it('should identify non-top-rated scores', () => {
      const rating = RatingScore.create(4.7);
      expect(rating.isTopRated()).toBe(false);
    });
  });

  describe('ProposalLimit Value Object', () => {
    it('should return correct default limits per tier name', () => {
      const newLimit = ProposalLimit.forLevel('NEW');
      expect(newLimit.maxActiveProposals).toBe(25);
      expect(newLimit.tier).toBe('NEW');
      expect(ProposalLimit.forLevel('SILVER').maxActiveProposals).toBe(35);
      expect(ProposalLimit.forLevel('GOLD').maxActiveProposals).toBe(50);
      expect(ProposalLimit.forLevel('PLATINUM').maxActiveProposals).toBe(75);
    });

    it('should throw DomainException for unknown tier', () => {
      expect(() => ProposalLimit.forLevel('DIAMOND' as any)).toThrow(DomainException);
    });

    it('should throw DomainException if instantiated directly with invalid limits', () => {
      expect(() => (ProposalLimit as any).forLevel('NEW').canSubmitProposal(1.5)).toThrow(DomainException);
    });

    it('should allow active proposal count within the tier limit', () => {
      const limit = ProposalLimit.forLevel('NEW');
      expect(limit.canSubmitProposal(24)).toBe(true);
      expect(limit.canSubmitProposal(25)).toBe(false); // At capacity
    });

    it('should throw DomainException if active bids count is negative or not integer', () => {
      const limit = ProposalLimit.forLevel('NEW');
      expect(() => limit.canSubmitProposal(-1)).toThrow(DomainException);
      expect(() => limit.canSubmitProposal(3.14)).toThrow(DomainException);
    });
  });
});
