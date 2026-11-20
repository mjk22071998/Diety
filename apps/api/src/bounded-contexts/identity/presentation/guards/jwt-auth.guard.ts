import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException
} from '@nestjs/common';
import { JwtTokenService } from '../../application/services/jwt-token.service';

/**
 * JwtAuthGuard
 * 
 * Extracts and cryptographically validates the Bearer access token from HTTP headers.
 * Populates request.user upon successful verification.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtTokenService: JwtTokenService) {}

  public async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers?.authorization;

    if (!authHeader || typeof authHeader !== 'string') {
      throw new UnauthorizedException('Authorization header is missing');
    }

    const [scheme, token] = authHeader.split(' ');
    if (scheme !== 'Bearer' || !token) {
      throw new UnauthorizedException('Malformed authorization header: expected Bearer <token>');
    }

    try {
      const payload = await this.jwtTokenService.verifyAccessToken(token);
      request.user = payload;
      return true;
    } catch (err: any) {
      throw new UnauthorizedException(`Authentication failed: ${err.message}`);
    }
  }
}
