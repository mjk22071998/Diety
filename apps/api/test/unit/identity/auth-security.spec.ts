import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PasswordHasherService } from '../../../src/bounded-contexts/identity/application/services/password-hasher.service';
import { JwtTokenService } from '../../../src/bounded-contexts/identity/application/services/jwt-token.service';
import { RolesGuard } from '../../../src/bounded-contexts/identity/presentation/guards/roles.guard';
import { JwtAuthGuard } from '../../../src/bounded-contexts/identity/presentation/guards/jwt-auth.guard';
import { Roles, ROLES_KEY } from '../../../src/bounded-contexts/identity/presentation/decorators/roles.decorator';
import { Reflector } from '@nestjs/core';
import { ExecutionContext, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { UserRole } from '@diety/types';
import { DomainException } from '../../../src/bounded-contexts/shared/domain/exceptions/domain.exception';

describe('Task 4.1: Authentication & RBAC Security Engine (Pure TDD)', () => {
  describe('PasswordHasherService (Argon2id)', () => {
    const hasher = new PasswordHasherService();

    it('should hash password with Argon2id and verify positive match', async () => {
      const plain = 'P@ssword123!';
      const hash = await hasher.hash(plain);

      expect(hash).toBeDefined();
      expect(hash).toContain('$argon2id$');

      const isValid = await hasher.verify(hash, plain);
      expect(isValid).toBe(true);
    });

    it('should reject incorrect password', async () => {
      const hash = await hasher.hash('CorrectPassword99#');
      const isValid = await hasher.verify(hash, 'WrongPassword123');
      expect(isValid).toBe(false);
    });

    it('should throw DomainException if password is empty or whitespace', async () => {
      await expect(hasher.hash('')).rejects.toThrow(DomainException);
      await expect(hasher.hash('   ')).rejects.toThrow(DomainException);
    });

    it('should throw DomainException if password is less than 8 characters', async () => {
      await expect(hasher.hash('abc12')).rejects.toThrow(DomainException);
    });

    it('should return false for malformed hash or empty password on verify', async () => {
      expect(await hasher.verify('not-a-hash', 'password')).toBe(false);
      expect(await hasher.verify('', 'password')).toBe(false);
      expect(await hasher.verify('$argon2id$fake', '')).toBe(false);
    });
  });

  describe('JwtTokenService', () => {
    const tokenService = new JwtTokenService({
      jwtSecret: 'test-secret-key-12345678901234567890',
      accessTokenTtlSeconds: 900,
      refreshTokenTtlSeconds: 3600
    });

    const sampleUser = {
      sub: 'usr-123',
      email: 'dietitian@example.com',
      role: UserRole.DIETITIAN,
      status: 'ACTIVE'
    };

    it('should generate paired access and refresh tokens', async () => {
      const tokens = await tokenService.generateAuthTokens(sampleUser);
      expect(tokens.accessToken).toBeDefined();
      expect(tokens.refreshToken).toBeDefined();
      expect(tokens.expiresInSeconds).toBe(900);
    });

    it('should verify valid access token and extract user claims', async () => {
      const tokens = await tokenService.generateAuthTokens(sampleUser);
      const payload = await tokenService.verifyAccessToken(tokens.accessToken);

      expect(payload.sub).toBe('usr-123');
      expect(payload.email).toBe('dietitian@example.com');
      expect(payload.role).toBe(UserRole.DIETITIAN);
      expect(payload.status).toBe('ACTIVE');
    });

    it('should verify valid refresh token and extract sub', async () => {
      const tokens = await tokenService.generateAuthTokens(sampleUser);
      const payload = await tokenService.verifyRefreshToken(tokens.refreshToken);

      expect(payload.sub).toBe('usr-123');
    });

    it('should reject refresh token when verifying as access token', async () => {
      const tokens = await tokenService.generateAuthTokens(sampleUser);
      await expect(tokenService.verifyAccessToken(tokens.refreshToken)).rejects.toThrow(DomainException);
    });

    it('should reject access token when verifying as refresh token', async () => {
      const tokens = await tokenService.generateAuthTokens(sampleUser);
      await expect(tokenService.verifyRefreshToken(tokens.accessToken)).rejects.toThrow(DomainException);
    });

    it('should reject empty or invalid token', async () => {
      await expect(tokenService.verifyAccessToken('')).rejects.toThrow(DomainException);
      await expect(tokenService.verifyAccessToken('invalid.token.structure')).rejects.toThrow(DomainException);
      await expect(tokenService.verifyRefreshToken('')).rejects.toThrow(DomainException);
    });

    it('should reject incomplete user payload when generating tokens', async () => {
      await expect(
        tokenService.generateAuthTokens({ sub: '', email: 'a@b.com', role: UserRole.CLIENT, status: 'A' })
      ).rejects.toThrow(DomainException);
    });
  });

  describe('Roles Decorator', () => {
    it('should set metadata with ROLES_KEY and specified roles', () => {
      class TestController {
        @Roles(UserRole.ADMIN, UserRole.DIETITIAN)
        public testMethod() {}
      }

      const metadata = Reflect.getMetadata(ROLES_KEY, TestController.prototype.testMethod);
      expect(metadata).toEqual([UserRole.ADMIN, UserRole.DIETITIAN]);
    });
  });

  describe('RolesGuard (RBAC)', () => {
    let mockReflector: Reflector;
    let rolesGuard: RolesGuard;

    const createMockContext = (user: any): ExecutionContext => {
      return {
        getHandler: vi.fn(),
        getClass: vi.fn(),
        switchToHttp: () => ({
          getRequest: () => ({ user })
        })
      } as unknown as ExecutionContext;
    };

    beforeEach(() => {
      mockReflector = {
        getAllAndOverride: vi.fn()
      } as unknown as Reflector;
      rolesGuard = new RolesGuard(mockReflector);
    });

    it('should allow access if no roles are required on route', () => {
      (mockReflector.getAllAndOverride as any).mockReturnValue(undefined);
      const context = createMockContext({ role: UserRole.CLIENT });
      expect(rolesGuard.canActivate(context)).toBe(true);
    });

    it('should allow access if user has required role', () => {
      (mockReflector.getAllAndOverride as any).mockReturnValue([UserRole.DIETITIAN, UserRole.ADMIN]);
      const context = createMockContext({ role: UserRole.DIETITIAN });
      expect(rolesGuard.canActivate(context)).toBe(true);
    });

    it('should throw ForbiddenException if user has non-matching role', () => {
      (mockReflector.getAllAndOverride as any).mockReturnValue([UserRole.ADMIN]);
      const context = createMockContext({ role: UserRole.CLIENT });
      expect(() => rolesGuard.canActivate(context)).toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException if user is unauthenticated or missing role', () => {
      (mockReflector.getAllAndOverride as any).mockReturnValue([UserRole.ADMIN]);
      const context = createMockContext(null);
      expect(() => rolesGuard.canActivate(context)).toThrow(ForbiddenException);
    });
  });

  describe('JwtAuthGuard', () => {
    let mockTokenService: JwtTokenService;
    let authGuard: JwtAuthGuard;

    const createMockHttpContext = (authHeader: string | undefined): { context: ExecutionContext; request: any } => {
      const request: any = { headers: { authorization: authHeader } };
      const context = {
        switchToHttp: () => ({
          getRequest: () => request
        })
      } as unknown as ExecutionContext;
      return { context, request };
    };

    beforeEach(() => {
      mockTokenService = {
        verifyAccessToken: vi.fn()
      } as unknown as JwtTokenService;
      authGuard = new JwtAuthGuard(mockTokenService);
    });

    it('should authenticate valid Bearer token and attach user to request', async () => {
      const expectedUser = {
        sub: 'usr-456',
        email: 'client@example.com',
        role: UserRole.CLIENT,
        status: 'ACTIVE'
      };
      (mockTokenService.verifyAccessToken as any).mockResolvedValue(expectedUser);

      const { context, request } = createMockHttpContext('Bearer valid.jwt.token');
      const result = await authGuard.canActivate(context);

      expect(result).toBe(true);
      expect(request.user).toEqual(expectedUser);
      expect(mockTokenService.verifyAccessToken).toHaveBeenCalledWith('valid.jwt.token');
    });

    it('should throw UnauthorizedException if authorization header is missing', async () => {
      const { context } = createMockHttpContext(undefined);
      await expect(authGuard.canActivate(context)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if scheme is not Bearer', async () => {
      const { context } = createMockHttpContext('Basic dXNlcjpwYXNz');
      await expect(authGuard.canActivate(context)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if token verification fails', async () => {
      (mockTokenService.verifyAccessToken as any).mockRejectedValue(new Error('Expired token'));
      const { context } = createMockHttpContext('Bearer expired.token');
      await expect(authGuard.canActivate(context)).rejects.toThrow(UnauthorizedException);
    });
  });
});
