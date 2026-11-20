import * as argon2 from 'argon2';
import { DomainException } from '../../../shared/domain/exceptions/domain.exception';

/**
 * PasswordHasherService
 * 
 * Cryptographic service using Argon2id (OWASP recommended memory-hard hashing)
 * for user credential security.
 */
export class PasswordHasherService {
  private static readonly ARGON2_OPTIONS: argon2.HashOptions & { raw: false } = {
    type: argon2.argon2id,
    memoryCost: 65536, // 64 MB memory
    timeCost: 3,       // 3 iterations
    parallelism: 4,
    raw: false
  };

  /**
   * Hashes a plain-text password using Argon2id
   */
  public async hash(plainPassword: string): Promise<string> {
    if (!plainPassword || plainPassword.trim().length === 0) {
      throw new DomainException('Password cannot be empty or whitespace', 'EMPTY_PASSWORD');
    }
    if (plainPassword.length < 8) {
      throw new DomainException('Password must be at least 8 characters in length', 'PASSWORD_TOO_SHORT');
    }

    return await argon2.hash(plainPassword, PasswordHasherService.ARGON2_OPTIONS);
  }

  /**
   * Verifies a plain-text password against an Argon2id hash
   */
  public async verify(hash: string, plainPassword: string): Promise<boolean> {
    if (!hash || !plainPassword) {
      return false;
    }
    try {
      return await argon2.verify(hash, plainPassword);
    } catch {
      return false;
    }
  }
}
