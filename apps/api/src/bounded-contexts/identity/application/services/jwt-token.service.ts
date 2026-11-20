import { JwtService } from '@nestjs/jwt';
import { UserRole } from '@diety/types';
import { DomainException } from '../../../shared/domain/exceptions/domain.exception';

export interface JwtUserPayload {
  sub: string;
  email: string;
  role: UserRole;
  status: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresInSeconds: number;
}

export interface JwtTokenServiceConfig {
  jwtService?: JwtService;
  jwtSecret?: string;
  accessTokenTtlSeconds?: number;
  refreshTokenTtlSeconds?: number;
}

/**
 * JwtTokenService
 * 
 * Issues and cryptographically verifies Dual-Token authentication credentials:
 * - Access Token: short-lived (15 minutes default) containing user identity and role.
 * - Refresh Token: longer-lived (7 days default) for silent session renewal.
 */
export class JwtTokenService {
  private readonly jwtService: JwtService;
  private readonly accessTokenTtlSeconds: number;
  private readonly refreshTokenTtlSeconds: number;

  constructor(config: JwtTokenServiceConfig = {}) {
    this.accessTokenTtlSeconds = config.accessTokenTtlSeconds ?? 900;       // 15 minutes
    this.refreshTokenTtlSeconds = config.refreshTokenTtlSeconds ?? 604800; // 7 days

    this.jwtService =
      config.jwtService ??
      new JwtService({
        secret: config.jwtSecret || process.env.JWT_SECRET || 'default-diety-secure-jwt-secret-key-change-in-prod'
      });
  }

  /**
   * Generates paired access and refresh tokens for an authenticated user
   */
  public async generateAuthTokens(user: JwtUserPayload): Promise<AuthTokens> {
    if (!user.sub || !user.email || !user.role) {
      throw new DomainException('Invalid user payload for token generation', 'INVALID_TOKEN_PAYLOAD');
    }

    const accessPayload = {
      sub: user.sub,
      email: user.email,
      role: user.role,
      status: user.status,
      type: 'ACCESS'
    };

    const refreshPayload = {
      sub: user.sub,
      type: 'REFRESH'
    };

    const accessToken = await this.jwtService.signAsync(accessPayload, {
      expiresIn: this.accessTokenTtlSeconds
    });

    const refreshToken = await this.jwtService.signAsync(refreshPayload, {
      expiresIn: this.refreshTokenTtlSeconds
    });

    return {
      accessToken,
      refreshToken,
      expiresInSeconds: this.accessTokenTtlSeconds
    };
  }

  /**
   * Verifies an access token and returns the typed user payload
   */
  public async verifyAccessToken(token: string): Promise<JwtUserPayload> {
    if (!token || token.trim().length === 0) {
      throw new DomainException('Access token must not be empty', 'EMPTY_TOKEN');
    }

    try {
      const decoded = await this.jwtService.verifyAsync(token);
      if (decoded.type !== 'ACCESS') {
        throw new DomainException('Invalid token type: expected ACCESS', 'INVALID_TOKEN_TYPE');
      }
      return {
        sub: decoded.sub,
        email: decoded.email,
        role: decoded.role as UserRole,
        status: decoded.status
      };
    } catch (err: any) {
      if (err instanceof DomainException) {
        throw err;
      }
      throw new DomainException(`Token verification failed: ${err.message}`, 'INVALID_TOKEN');
    }
  }

  /**
   * Verifies a refresh token and returns the subject ID
   */
  public async verifyRefreshToken(token: string): Promise<{ sub: string }> {
    if (!token || token.trim().length === 0) {
      throw new DomainException('Refresh token must not be empty', 'EMPTY_TOKEN');
    }

    try {
      const decoded = await this.jwtService.verifyAsync(token);
      if (decoded.type !== 'REFRESH') {
        throw new DomainException('Invalid token type: expected REFRESH', 'INVALID_TOKEN_TYPE');
      }
      return { sub: decoded.sub };
    } catch (err: any) {
      if (err instanceof DomainException) {
        throw err;
      }
      throw new DomainException(`Refresh token verification failed: ${err.message}`, 'INVALID_TOKEN');
    }
  }
}
