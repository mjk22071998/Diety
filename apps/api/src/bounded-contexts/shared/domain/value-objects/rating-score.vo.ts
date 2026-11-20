import { DomainException } from '../exceptions/domain.exception';

/**
 * RatingScore Value Object
 * 
 * Enforces valid dietitian feedback scores between 1.0 and 5.0 (inclusive).
 * Automatically rounds to 1 decimal place.
 */
export class RatingScore {
  private readonly _value: number;

  private constructor(value: number) {
    if (value < 1.0 || value > 5.0) {
      throw new DomainException(
        `Rating score must be between 1.0 and 5.0: received ${value}`,
        'INVALID_RATING_SCORE'
      );
    }
    // Round to 1 decimal place
    this._value = Math.round(value * 10) / 10;
  }

  public static create(value: number): RatingScore {
    return new RatingScore(value);
  }

  public get value(): number {
    return this._value;
  }

  public isTopRated(): boolean {
    return this._value >= 4.8;
  }

  public equals(other: RatingScore): boolean {
    return this._value === other._value;
  }
}
