import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtService } from '../services/jwt.service';
import { UsersService } from '../../users/users.service';
import { JwtPayload } from '../interfaces/auth-response.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configService.get<string>('JWT_SECRET'),
      algorithms: ['HS256'],
      issuer: configService.get<string>('JWT_ISSUER', 'booking-platform'),
      audience: configService.get<string>('JWT_AUDIENCE', 'booking-platform-api'),
      passReqToCallback: false,
    });
  }

  async validate(payload: JwtPayload) {
    // Check if token is revoked
    const isRevoked = await this.jwtService.isTokenRevoked(payload.jti);
    if (isRevoked) {
      throw new UnauthorizedException('Token has been revoked');
    }

    // Verify user still exists
    const user = await this.usersService.findById(payload.user_id);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Check if user is active
    if (user.status !== 'active' && user.status !== 'pending_verification') {
      throw new UnauthorizedException('User account is not active');
    }

    // Return user object for request.user
    return {
      userId: payload.user_id,
      tenantId: payload.tenant_id,
      email: payload.email,
      roles: payload.roles,
      permissions: payload.permissions,
      jti: payload.jti,
    };
  }
}
