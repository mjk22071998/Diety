import { RatingScore } from '../../../shared/domain/value-objects/rating-score.vo';
import { Money } from '../../../shared/domain/value-objects/money.vo';
import { DomainException } from '../../../shared/domain/exceptions/domain.exception';

export enum DietitianTier {
  NEW = 'NEW',
  SILVER = 'SILVER',
  GOLD = 'GOLD',
  PLATINUM = 'PLATINUM'
}

export interface DietitianLevelProps {
  dietitianId: string;
  tier?: DietitianTier;
  completedContracts?: number;
  rating?: RatingScore;
  onTimeDeliveryRate?: number;
  totalEarnings?: Money;
  strikesCount?: number;
}

const GRACE_PERIOD_MS = 14 * 24 * 60 * 60 * 1000; // 14 days

/**
 * DietitianLevelProfile Aggregate Root
 * 
 * Enforces dynamic marketplace progression, fee tiers, and the Three-Strike Disciplinary Rule.
 */
export class DietitianLevelProfile {
  public readonly dietitianId: string;
  private _tier: DietitianTier;
  private _completedContracts: number;
  private _rating: RatingScore;
  private _onTimeDeliveryRate: number;
  private _totalEarnings: Money;
  private _strikesCount: number;
  private _isBiddingSuspended: boolean;
  private _gracePeriodStartedAt: Date | null = null;

  private constructor(props: DietitianLevelProps) {
    if (!props.dietitianId) {
      throw new DomainException('Dietitian ID is required', 'INVALID_DIETITIAN_ID');
    }

    this.dietitianId = props.dietitianId;
    this._tier = props.tier ?? DietitianTier.NEW;
    this._completedContracts = props.completedContracts ?? 0;
    this._rating = props.rating ?? RatingScore.create(5.0);
    this._onTimeDeliveryRate = props.onTimeDeliveryRate ?? 100.0;
    this._totalEarnings = props.totalEarnings ?? Money.zero('USD');
    this._strikesCount = props.strikesCount ?? 0;
    this._isBiddingSuspended = this._strikesCount >= 3;
  }

  public static create(props: DietitianLevelProps): DietitianLevelProfile {
    return new DietitianLevelProfile(props);
  }

  public get tier(): DietitianTier {
    return this._tier;
  }

  public get completedContracts(): number {
    return this._completedContracts;
  }

  public get rating(): RatingScore {
    return this._rating;
  }

  public get onTimeDeliveryRate(): number {
    return this._onTimeDeliveryRate;
  }

  public get totalEarnings(): Money {
    return this._totalEarnings;
  }

  public get strikesCount(): number {
    return this._strikesCount;
  }

  public get isBiddingSuspended(): boolean {
    return this._isBiddingSuspended;
  }

  public get isInGracePeriod(): boolean {
    return this._gracePeriodStartedAt !== null;
  }

  public get commissionPercent(): number {
    return this._tier === DietitianTier.GOLD || this._tier === DietitianTier.PLATINUM ? 8 : 10;
  }

  public get maxActiveProposals(): number {
    if (this._isBiddingSuspended) return 0;
    switch (this._tier) {
      case DietitianTier.PLATINUM:
        return 75;
      case DietitianTier.GOLD:
        return 50;
      case DietitianTier.SILVER:
        return 35;
      case DietitianTier.NEW:
      default:
        return 25;
    }
  }

  /**
   * Evaluates rolling performance metrics to promote, maintain, or enter grace period
   */
  public evaluateTier(evaluationDate: Date = new Date()): void {
    if (this._strikesCount >= 2) {
      this._tier = DietitianTier.NEW;
      this._gracePeriodStartedAt = null;
      return;
    }

    const calculatedTier = this.calculateQualifyingTier();
    const currentWeight = this.getTierWeight(this._tier);
    const calculatedWeight = this.getTierWeight(calculatedTier);

    if (calculatedWeight >= currentWeight) {
      // Promotion or maintained
      this._tier = calculatedTier;
      this._gracePeriodStartedAt = null;
    } else {
      // Metrics dropped below current tier
      if (!this._gracePeriodStartedAt) {
        // Start 14-day grace period
        this._gracePeriodStartedAt = evaluationDate;
      } else {
        const elapsed = evaluationDate.getTime() - this._gracePeriodStartedAt.getTime();
        if (elapsed >= GRACE_PERIOD_MS) {
          // Grace period expired: apply demotion
          this._tier = calculatedTier;
          this._gracePeriodStartedAt = null;
        }
      }
    }
  }

  /**
   * Applies disciplinary strike (Three-Strike Protocol)
   */
  public applyStrike(reason: string): void {
    if (this._strikesCount >= 3) {
      throw new DomainException('Cannot apply strike: maximum of 3 strikes already reached', 'MAX_STRIKES_EXCEEDED');
    }

    this._strikesCount++;

    if (this._strikesCount === 2) {
      // Strike 2: Demoted immediately to NEW tier
      this._tier = DietitianTier.NEW;
      this._gracePeriodStartedAt = null;
    } else if (this._strikesCount === 3) {
      // Strike 3: Bidding privileges suspended
      this._tier = DietitianTier.NEW;
      this._isBiddingSuspended = true;
      this._gracePeriodStartedAt = null;
    }
  }

  private calculateQualifyingTier(): DietitianTier {
    if (this._strikesCount > 0) {
      return DietitianTier.NEW;
    }

    // Platinum: 50+ contracts, 4.9+ rating, 98%+ on-time, $10,000+ (1,000,000 cents)
    if (
      this._completedContracts >= 50 &&
      this._rating.value >= 4.9 &&
      this._onTimeDeliveryRate >= 98.0 &&
      this._totalEarnings.cents >= 1000000
    ) {
      return DietitianTier.PLATINUM;
    }

    // Gold: 20+ contracts, 4.8+ rating, 95%+ on-time, $2,000+ (200,000 cents)
    if (
      this._completedContracts >= 20 &&
      this._rating.value >= 4.8 &&
      this._onTimeDeliveryRate >= 95.0 &&
      this._totalEarnings.cents >= 200000
    ) {
      return DietitianTier.GOLD;
    }

    // Silver: 5+ contracts, 4.5+ rating, 90%+ on-time
    if (
      this._completedContracts >= 5 &&
      this._rating.value >= 4.5 &&
      this._onTimeDeliveryRate >= 90.0
    ) {
      return DietitianTier.SILVER;
    }

    return DietitianTier.NEW;
  }

  private getTierWeight(tier: DietitianTier): number {
    switch (tier) {
      case DietitianTier.PLATINUM:
        return 4;
      case DietitianTier.GOLD:
        return 3;
      case DietitianTier.SILVER:
        return 2;
      case DietitianTier.NEW:
      default:
        return 1;
    }
  }
}
