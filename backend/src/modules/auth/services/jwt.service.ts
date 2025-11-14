import { Injectable, UnauthorizedException, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService as NestJwtService } from '@nestjs/jwt';
import { Redis } from 'ioredis';
import { v4 as uuidv4 } from 'uuid';
import { JwtPayload, AuthResponse } from '../interfaces/auth-response.interface';
import { User } from '../../users/entities/user.entity';
import { Tenant } from '../../tenants/entities/tenant.entity';

@Injectable()
export class JwtService {
  private readonly accessTokenExpiry: number;
  private readonly refreshTokenExpiry: number;
  private readonly issuer: string;
  private readonly audience: string;

  constructor(
    private readonly nestJwtService: NestJwtService,
    private readonly configService: ConfigService,
    @Inject('REDIS_CLIENT') private readonly redisClient: Redis,
  ) {
    this.accessTokenExpiry = this.configService.get<number>('JWT_ACCESS_TOKEN_EXPIRY', 3600); // 1 hour
    this.refreshTokenExpiry = this.configService.get<number>('JWT_REFRESH_TOKEN_EXPIRY', 2592000); // 30 days
    this.issuer = this.configService.get<string>('JWT_ISSUER', 'booking-platform');
    this.audience = this.configService.get<string>('JWT_AUDIENCE', 'booking-platform-api');
  }

  /**
   * Generate access token with user permissions
   */
  async generateAccessToken(
    user: User,
    tenant: Tenant,
    roles: any[] = [],
    permissions: string[] = [],
  ): Promise<string> {
    const tokenId = uuidv4();

    const payload: JwtPayload = {
      user_id: user.id,
      tenant_id: tenant.id,
      email: user.email,
      roles: roles.map(r => ({
        id: r.id,
        name: r.name,
        scope_type: r.scope_type,
        scope_id: r.scope_id,
      })),
      permissions,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + this.accessTokenExpiry,
      jti: tokenId,
    };

    const secret = this.configService.get<string>('JWT_SECRET');

    return this.nestJwtService.sign(payload, {
      algorithm: 'HS256',
      secret,
      issuer: this.issuer,
      audience: this.audience,
    });
  }

  /**
   * Generate refresh token
   */
  async generateRefreshToken(user: User, tenant: Tenant): Promise<string> {
    const tokenId = uuidv4();

    const payload = {
      user_id: user.id,
      tenant_id: tenant.id,
      type: 'refresh',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + this.refreshTokenExpiry,
      jti: tokenId,
    };

    const secret = this.configService.get<string>('REFRESH_TOKEN_SECRET');

    const refreshToken = this.nestJwtService.sign(payload, {
      algorithm: 'HS256',
      secret,
      issuer: this.issuer,
      audience: this.audience,
    });

    // Store refresh token in Redis with expiry
    await this.storeRefreshToken(user.id, tokenId, this.refreshTokenExpiry);

    return refreshToken;
  }

  /**
   * Verify and decode JWT token
   */
  async verifyToken(token: string): Promise<JwtPayload> {
    try {
      const secret = this.configService.get<string>('JWT_SECRET');

      const payload = this.nestJwtService.verify(token, {
        algorithms: ['HS256'],
        secret,
        issuer: this.issuer,
        audience: this.audience,
      }) as JwtPayload;

      // Check if token is revoked
      const isRevoked = await this.isTokenRevoked(payload.jti);
      if (isRevoked) {
        throw new UnauthorizedException('Token has been revoked');
      }

      return payload;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  /**
   * Revoke a token by storing its ID in Redis
   */
  async revokeToken(tokenId: string, expirySeconds: number): Promise<void> {
    const key = `revoked_token:${tokenId}`;
    const revokedAt = new Date().toISOString();

    await this.redisClient.setex(key, expirySeconds, revokedAt);
  }

  /**
   * Check if a token is revoked
   */
  async isTokenRevoked(tokenId: string): Promise<boolean> {
    const key = `revoked_token:${tokenId}`;
    const result = await this.redisClient.get(key);
    return result !== null;
  }

  /**
   * Store refresh token in Redis
   */
  private async storeRefreshToken(
    userId: string,
    tokenId: string,
    expirySeconds: number,
  ): Promise<void> {
    const key = `refresh_token:${userId}:${tokenId}`;
    const data = JSON.stringify({
      tokenId,
      userId,
      createdAt: new Date().toISOString(),
    });

    await this.redisClient.setex(key, expirySeconds, data);
  }

  /**
   * Validate refresh token exists in Redis
   */
  async validateRefreshToken(userId: string, tokenId: string): Promise<boolean> {
    const key = `refresh_token:${userId}:${tokenId}`;
    const result = await this.redisClient.get(key);
    return result !== null;
  }

  /**
   * Delete refresh token from Redis
   */
  async deleteRefreshToken(userId: string, tokenId: string): Promise<void> {
    const key = `refresh_token:${userId}:${tokenId}`;
    await this.redisClient.del(key);
  }

  /**
   * Delete all refresh tokens for a user
   */
  async deleteAllRefreshTokens(userId: string): Promise<void> {
    const pattern = `refresh_token:${userId}:*`;
    const keys = await this.redisClient.keys(pattern);

    if (keys.length > 0) {
      await this.redisClient.del(...keys);
    }
  }

  /**
   * Generate token pair (access + refresh)
   */
  async generateTokenPair(
    user: User,
    tenant: Tenant,
    roles: any[] = [],
    permissions: string[] = [],
  ): Promise<AuthResponse> {
    const [accessToken, refreshToken] = await Promise.all([
      this.generateAccessToken(user, tenant, roles, permissions),
      this.generateRefreshToken(user, tenant),
    ]);

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_in: this.accessTokenExpiry,
      token_type: 'Bearer',
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        email_verified: user.email_verified,
      },
    };
  }
}
