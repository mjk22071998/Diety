import { describe, it, expect } from 'vitest';
import { DietitianLevelProfile, DietitianTier } from '../../../src/bounded-contexts/reputation/domain/entities/dietitian-level.entity';
import { RatingScore } from '../../../src/bounded-contexts/shared/domain/value-objects/rating-score.vo';
import { Money } from '../../../src/bounded-contexts/shared/domain/value-objects/money.vo';
import { DomainException } from '../../../src/bounded-contexts/shared/domain/exceptions/domain.exception';

describe('Task 2.3: Reputation & Level Ranking Aggregate (Pure TDD)', () => {
  const createNewProfile = () =>
    DietitianLevelProfile.create({
      dietitianId: 'dietitian-1',
      tier: DietitianTier.NEW,
      completedContracts: 0,
      rating: RatingScore.create(5.0),
      onTimeDeliveryRate: 100.0,
      totalEarnings: Money.zero('USD')
    });

  describe('Tier Evaluation & Upgrades', () => {
    it('should initialize with NEW tier and default properties', () => {
      const profile = createNewProfile();
      expect(profile.tier).toBe(DietitianTier.NEW);
      expect(profile.commissionPercent).toBe(10);
      expect(profile.maxActiveProposals).toBe(25);
      expect(profile.strikesCount).toBe(0);
      expect(profile.isBiddingSuspended).toBe(false);
    });

    it('should promote to SILVER when qualifying metrics are met (5 contracts, 4.5+ rating, 90%+ on-time)', () => {
      const profile = DietitianLevelProfile.create({
        dietitianId: 'dietitian-1',
        tier: DietitianTier.NEW,
        completedContracts: 5,
        rating: RatingScore.create(4.6),
        onTimeDeliveryRate: 92.0,
        totalEarnings: Money.fromCents(50000, 'USD')
      });

      profile.evaluateTier();
      expect(profile.tier).toBe(DietitianTier.SILVER);
      expect(profile.commissionPercent).toBe(10);
      expect(profile.maxActiveProposals).toBe(35);
    });

    it('should promote to GOLD (Top-Rated) when qualifying metrics are met (20 contracts, 4.8+ rating, $2000+ earnings)', () => {
      const profile = DietitianLevelProfile.create({
        dietitianId: 'dietitian-1',
        tier: DietitianTier.SILVER,
        completedContracts: 22,
        rating: RatingScore.create(4.85),
        onTimeDeliveryRate: 96.0,
        totalEarnings: Money.fromCents(250000, 'USD') // $2,500.00
      });

      profile.evaluateTier();
      expect(profile.tier).toBe(DietitianTier.GOLD);
      expect(profile.commissionPercent).toBe(8); // Top-Rated discount
      expect(profile.maxActiveProposals).toBe(50);
    });

    it('should promote to PLATINUM when qualifying metrics are met (50 contracts, 4.9+ rating, $10,000+ earnings)', () => {
      const profile = DietitianLevelProfile.create({
        dietitianId: 'dietitian-1',
        tier: DietitianTier.GOLD,
        completedContracts: 55,
        rating: RatingScore.create(4.95),
        onTimeDeliveryRate: 99.0,
        totalEarnings: Money.fromCents(1200000, 'USD') // $12,000.00
      });

      profile.evaluateTier();
      expect(profile.tier).toBe(DietitianTier.PLATINUM);
      expect(profile.commissionPercent).toBe(8);
      expect(profile.maxActiveProposals).toBe(75);
    });
    it('should throw DomainException if dietitianId is empty', () => {
      expect(() =>
        DietitianLevelProfile.create({
          dietitianId: ''
        })
      ).toThrow(DomainException);
    });

    it('should expose metric getters correctly', () => {
      const rating = RatingScore.create(4.8);
      const earnings = Money.fromCents(10000, 'USD');
      const profile = DietitianLevelProfile.create({
        dietitianId: 'dietitian-1',
        completedContracts: 12,
        rating,
        onTimeDeliveryRate: 97.5,
        totalEarnings: earnings
      });

      expect(profile.completedContracts).toBe(12);
      expect(profile.rating.value).toBe(4.8);
      expect(profile.onTimeDeliveryRate).toBe(97.5);
      expect(profile.totalEarnings.cents).toBe(10000);
    });

    it('should prevent promotion if dietitian has an active strike', () => {
      const profile = DietitianLevelProfile.create({
        dietitianId: 'dietitian-1',
        tier: DietitianTier.NEW,
        completedContracts: 30,
        rating: RatingScore.create(4.9),
        onTimeDeliveryRate: 98.0,
        totalEarnings: Money.fromCents(500000, 'USD')
      });

      profile.applyStrike('Warning');
      profile.evaluateTier();
      expect(profile.tier).toBe(DietitianTier.NEW);
    });

    it('should keep tier as NEW if evaluated with 2 strikes', () => {
      const profile = DietitianLevelProfile.create({
        dietitianId: 'dietitian-1',
        tier: DietitianTier.SILVER,
        completedContracts: 30,
        rating: RatingScore.create(4.9),
        onTimeDeliveryRate: 98.0,
        totalEarnings: Money.fromCents(500000, 'USD')
      });

      profile.applyStrike('Strike 1');
      profile.applyStrike('Strike 2');
      profile.evaluateTier();
      expect(profile.tier).toBe(DietitianTier.NEW);
    });
  });

  describe('Three-Strike Disciplinary Protocol', () => {
    it('Strike 1: records official warning, does NOT demote tier, keeps bidding active', () => {
      const profile = DietitianLevelProfile.create({
        dietitianId: 'dietitian-1',
        tier: DietitianTier.GOLD,
        completedContracts: 25,
        rating: RatingScore.create(4.9),
        onTimeDeliveryRate: 98.0,
        totalEarnings: Money.fromCents(300000, 'USD')
      });

      profile.applyStrike('First warning for unexcused consultation delay');
      expect(profile.strikesCount).toBe(1);
      expect(profile.strikeReasons).toContain('First warning for unexcused consultation delay');
      expect(profile.tier).toBe(DietitianTier.GOLD);
      expect(profile.isBiddingSuspended).toBe(false);
    });

    it('Strike 2: immediately demotes to NEW tier and restricts proposals ceiling to 25', () => {
      const profile = DietitianLevelProfile.create({
        dietitianId: 'dietitian-1',
        tier: DietitianTier.PLATINUM,
        completedContracts: 60,
        rating: RatingScore.create(4.95),
        onTimeDeliveryRate: 99.0,
        totalEarnings: Money.fromCents(1500000, 'USD')
      });

      profile.applyStrike('First strike');
      profile.applyStrike('Second strike: severe dispute ruling');

      expect(profile.strikesCount).toBe(2);
      expect(profile.tier).toBe(DietitianTier.NEW); // Immediate demotion
      expect(profile.maxActiveProposals).toBe(25);
      expect(profile.commissionPercent).toBe(10);
      expect(profile.isBiddingSuspended).toBe(false);
    });

    it('Strike 3: suspends account bidding and revokes proposal capacity', () => {
      const profile = createNewProfile();
      profile.applyStrike('Strike 1');
      profile.applyStrike('Strike 2');
      profile.applyStrike('Strike 3: repeated no-show violation');

      expect(profile.strikesCount).toBe(3);
      expect(profile.tier).toBe(DietitianTier.NEW);
      expect(profile.isBiddingSuspended).toBe(true);
      expect(profile.maxActiveProposals).toBe(0); // Bidding completely blocked
    });

    it('should throw DomainException if trying to apply strikes past maximum', () => {
      const profile = createNewProfile();
      profile.applyStrike('1');
      profile.applyStrike('2');
      profile.applyStrike('3');
      expect(() => profile.applyStrike('4')).toThrow(DomainException);
    });
  });

  describe('Grace Period Invariant', () => {
    it('should enter 14-day grace period when rating dips below tier threshold before demoting', () => {
      const profile = DietitianLevelProfile.create({
        dietitianId: 'dietitian-1',
        tier: DietitianTier.GOLD,
        completedContracts: 25,
        rating: RatingScore.create(4.6), // Dips below 4.8
        onTimeDeliveryRate: 96.0,
        totalEarnings: Money.fromCents(300000, 'USD')
      });

      profile.evaluateTier(new Date('2026-11-21T00:00:00Z'));
      // In grace period: tier is maintained
      expect(profile.isInGracePeriod).toBe(true);
      expect(profile.tier).toBe(DietitianTier.GOLD);

      // Past 14-day grace period (day 15): demoted to SILVER
      profile.evaluateTier(new Date('2026-12-07T00:00:00Z'));
      expect(profile.isInGracePeriod).toBe(false);
      expect(profile.tier).toBe(DietitianTier.SILVER);
    });
  });
});
