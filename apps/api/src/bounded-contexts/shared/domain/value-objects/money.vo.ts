import { DomainException } from '../exceptions/domain.exception';

/**
 * Money Value Object
 * 
 * Enforces integer cents to prevent floating-point inaccuracies in financial calculations.
 * Invariant: Cents must be an integer >= 0. Operations between differing currencies throw DomainException.
 */
export class Money {
  private readonly _cents: number;
  private readonly _currency: string;

  private constructor(cents: number, currency = 'USD') {
    if (!Number.isInteger(cents)) {
      throw new DomainException(`Money cents must be an integer: received ${cents}`, 'INVALID_MONEY_AMOUNT');
    }
    if (cents < 0) {
      throw new DomainException(`Money amount cannot be negative: received ${cents}`, 'NEGATIVE_MONEY_AMOUNT');
    }
    this._cents = cents;
    this._currency = currency.toUpperCase();
  }

  public static fromCents(cents: number, currency = 'USD'): Money {
    return new Money(cents, currency);
  }

  public static fromDollars(dollars: number, currency = 'USD'): Money {
    const cents = Math.round(dollars * 100);
    return new Money(cents, currency);
  }

  public static zero(currency = 'USD'): Money {
    return new Money(0, currency);
  }

  public get cents(): number {
    return this._cents;
  }

  public get dollars(): number {
    return this._cents / 100;
  }

  public get currency(): string {
    return this._currency;
  }

  public add(other: Money): Money {
    this.assertSameCurrency(other);
    return new Money(this._cents + other._cents, this._currency);
  }

  public subtract(other: Money): Money {
    this.assertSameCurrency(other);
    if (this._cents < other._cents) {
      throw new DomainException(
        `Insufficient funds: cannot subtract ${other.format()} from ${this.format()}`,
        'INSUFFICIENT_FUNDS'
      );
    }
    return new Money(this._cents - other._cents, this._currency);
  }

  public multiply(factor: number): Money {
    if (factor < 0) {
      throw new DomainException('Money multiplication factor cannot be negative', 'INVALID_MULTIPLICATION_FACTOR');
    }
    return new Money(Math.round(this._cents * factor), this._currency);
  }

  public percentage(percent: number): Money {
    if (percent < 0 || percent > 100) {
      throw new DomainException(`Invalid percentage ${percent}: must be between 0 and 100`, 'INVALID_PERCENTAGE');
    }
    return new Money(Math.round((this._cents * percent) / 100), this._currency);
  }

  /**
   * Evenly splits this Money across n parts, distributing remaining cents
   * so that sum(splits) === this.cents with zero penny loss.
   */
  public split(parts: number): Money[] {
    if (!Number.isInteger(parts) || parts <= 0) {
      throw new DomainException(`Parts must be a positive integer: received ${parts}`, 'INVALID_SPLIT_PARTS');
    }

    const baseCents = Math.floor(this._cents / parts);
    let remainder = this._cents % parts;

    const result: Money[] = [];
    for (let i = 0; i < parts; i++) {
      const centPart = baseCents + (remainder > 0 ? 1 : 0);
      if (remainder > 0) remainder--;
      result.push(new Money(centPart, this._currency));
    }

    return result;
  }

  public equals(other: Money): boolean {
    return this._currency === other._currency && this._cents === other._cents;
  }

  public isZero(): boolean {
    return this._cents === 0;
  }

  public isGreaterThan(other: Money): boolean {
    this.assertSameCurrency(other);
    return this._cents > other._cents;
  }

  public isLessThan(other: Money): boolean {
    this.assertSameCurrency(other);
    return this._cents < other._cents;
  }

  public format(): string {
    const symbol = this._currency === 'USD' ? '$' : `${this._currency} `;
    return `${symbol}${this.dollars.toFixed(2)}`;
  }

  private assertSameCurrency(other: Money): void {
    if (this._currency !== other._currency) {
      throw new DomainException(
        `Currency mismatch: cannot perform operation between ${this._currency} and ${other._currency}`,
        'CURRENCY_MISMATCH'
      );
    }
  }
}
