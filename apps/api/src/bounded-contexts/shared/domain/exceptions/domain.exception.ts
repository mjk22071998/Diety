/**
 * Diety Platform - Core Domain Exception
 * 
 * Thrown whenever a business invariant or domain validation rule is violated.
 * Contains no framework dependencies (Pure Clean Architecture).
 */
export class DomainException extends Error {
  public readonly code: string;
  public readonly timestamp: string;

  constructor(message: string, code = 'DOMAIN_INVARIANT_VIOLATION') {
    super(message);
    this.name = 'DomainException';
    this.code = code;
    this.timestamp = new Date().toISOString();
    Object.setPrototypeOf(this, DomainException.prototype);
  }
}
