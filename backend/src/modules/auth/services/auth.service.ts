import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Redis } from 'ioredis';
import { RegisterDto, LoginDto, PasswordResetRequestDto, PasswordResetConfirmDto } from '../dto';
import { AuthResponse } from '../interfaces/auth-response.interface';
import { PasswordService } from './password.service';
import { JwtService } from './jwt.service';
import { UsersService } from '../../users/users.service';
import { TenantsService } from '../../tenants/tenants.service';
import { User, UserStatus } from '../../users/entities/user.entity';
import { PasswordResetToken } from '../entities/password-reset-token.entity';
import { EmailVerificationToken } from '../entities/email-verification-token.entity';
import { StaffMember } from '../../staff/entities/staff-member.entity';

@Injectable()
export class AuthService {
  private readonly MAX_FAILED_ATTEMPTS = 5;
  private readonly LOCKOUT_DURATION_MINUTES = 15;

  constructor(
    private readonly passwordService: PasswordService,
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
    private readonly tenantsService: TenantsService,
    @InjectRepository(PasswordResetToken)
    private readonly passwordResetTokenRepository: Repository<PasswordResetToken>,
    @InjectRepository(EmailVerificationToken)
    private readonly emailVerificationTokenRepository: Repository<EmailVerificationToken>,
    @InjectRepository(StaffMember)
    private readonly staffMemberRepository: Repository<StaffMember>,
    @Inject('REDIS_CLIENT') private readonly redisClient: Redis,
  ) {}

  /**
   * Register a new user
   */
  async register(registerDto: RegisterDto, tenantId: string): Promise<AuthResponse> {
    // Check if user already exists
    const existingUser = await this.usersService.findByEmail(registerDto.email, tenantId);
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Get tenant
    const tenant = await this.tenantsService.findById(tenantId);
    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    // Validate password complexity
    this.passwordService.validatePasswordComplexity(registerDto.password);

    // Hash password
    const passwordHash = await this.passwordService.hashPassword(registerDto.password);

    // Create user
    const user = await this.usersService.create({
      tenant_id: tenantId,
      email: registerDto.email,
      password_hash: passwordHash,
      first_name: registerDto.first_name,
      last_name: registerDto.last_name,
      phone_number: registerDto.phone_number,
      language: registerDto.language || 'en',
      timezone: registerDto.timezone || 'UTC',
      status: UserStatus.PENDING_VERIFICATION,
      email_verified: false,
    });

    // Generate email verification token
    await this.createEmailVerificationToken(user.id);

    // TODO: Send verification email (requires email service)

    // Generate JWT tokens
    const permissions = await this.usersService.getUserPermissions(user.id);
    return this.jwtService.generateTokenPair(user, tenant, [], permissions);
  }

  /**
   * Login user by tenant slug
   */
  async loginBySlug(loginDto: LoginDto, tenantSlug: string): Promise<AuthResponse> {
    // Get tenant by slug
    const tenant = await this.tenantsService.findBySlug(tenantSlug);
    if (!tenant) {
      throw new UnauthorizedException('Tenant not found');
    }

    return this.login(loginDto, tenant.id);
  }

  /**
   * Login user
   */
  async login(loginDto: LoginDto, tenantId: string): Promise<AuthResponse> {
    // Find user
    const user = await this.usersService.findByEmail(loginDto.email, tenantId);
    if (!user || !user.password_hash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if account is locked
    const isLocked = await this.isAccountLocked(user.id);
    if (isLocked) {
      throw new UnauthorizedException(
        `Account is locked due to too many failed login attempts. Try again in ${this.LOCKOUT_DURATION_MINUTES} minutes.`,
      );
    }

    // Verify password
    const isPasswordValid = await this.passwordService.verifyPassword(
      loginDto.password,
      user.password_hash,
    );

    if (!isPasswordValid) {
      await this.incrementFailedAttempts(user.id);
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check MFA if enabled
    if (user.mfa_enabled && !loginDto.mfa_code) {
      throw new UnauthorizedException('MFA code required');
    }

    if (user.mfa_enabled && loginDto.mfa_code) {
      // TODO: Verify MFA code (requires MFA service)
      throw new BadRequestException('MFA verification not yet implemented');
    }

    // Get tenant
    const tenant = await this.tenantsService.findById(tenantId);
    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    // Check subscription
    const hasValidSubscription = await this.tenantsService.hasValidSubscription(tenantId);
    if (!hasValidSubscription) {
      throw new UnauthorizedException('Tenant subscription is not active');
    }

    // Reset failed attempts
    await this.resetFailedAttempts(user.id);

    // Update last login
    await this.usersService.updateLastLogin(user.id);

    // Get user's business_id if they are a staff member
    const staffMember = await this.staffMemberRepository.findOne({
      where: { user_id: user.id },
    });
    const businessId = staffMember?.business_id || null;

    // Generate JWT tokens
    const permissions = await this.usersService.getUserPermissions(user.id);
    return this.jwtService.generateTokenPair(user, tenant, user.userRoles || [], permissions, businessId);
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    // Verify refresh token
    const payload = await this.jwtService.verifyToken(refreshToken);

    if (payload.type !== 'refresh') {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Check if refresh token exists in Redis
    const isValid = await this.jwtService.validateRefreshToken(payload.user_id, payload.jti);
    if (!isValid) {
      throw new UnauthorizedException('Refresh token has been revoked');
    }

    // Get user and tenant
    const user = await this.usersService.findById(payload.user_id);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const tenant = await this.tenantsService.findById(payload.tenant_id);
    if (!tenant) {
      throw new UnauthorizedException('Tenant not found');
    }

    // Delete old refresh token (token rotation)
    await this.jwtService.deleteRefreshToken(payload.user_id, payload.jti);

    // Get user's business_id if they are a staff member
    const staffMember = await this.staffMemberRepository.findOne({
      where: { user_id: user.id },
    });
    const businessId = staffMember?.business_id || null;

    // Generate new token pair
    const permissions = await this.usersService.getUserPermissions(user.id);
    return this.jwtService.generateTokenPair(user, tenant, user.userRoles || [], permissions, businessId);
  }

  /**
   * Logout user
   */
  async logout(userId: string, tokenId: string): Promise<void> {
    // Revoke access token
    await this.jwtService.revokeToken(tokenId, 3600); // 1 hour

    // Delete refresh token
    await this.jwtService.deleteRefreshToken(userId, tokenId);
  }

  /**
   * Logout all sessions
   */
  async logoutAll(userId: string): Promise<void> {
    // Delete all refresh tokens
    await this.jwtService.deleteAllRefreshTokens(userId);
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(requestDto: PasswordResetRequestDto, tenantId: string): Promise<void> {
    // Always return success to prevent email enumeration
    const user = await this.usersService.findByEmail(requestDto.email, tenantId);
    if (!user) {
      return; // Don't reveal that user doesn't exist
    }

    // Check rate limit (5 requests per hour)
    const rateLimitKey = `password_reset_rate:${user.id}`;
    const requests = await this.redisClient.incr(rateLimitKey);

    if (requests === 1) {
      await this.redisClient.expire(rateLimitKey, 3600); // 1 hour
    }

    if (requests > 5) {
      return; // Don't reveal rate limit exceeded
    }

    // Generate reset token
    const { token, hash } = this.passwordService.generateResetToken();

    // Store token in database
    const resetToken = this.passwordResetTokenRepository.create({
      user_id: user.id,
      token_hash: hash,
      expires_at: new Date(Date.now() + 3600 * 1000), // 1 hour
      used: false,
    });

    await this.passwordResetTokenRepository.save(resetToken);

    // TODO: Send password reset email with token
    // For now, we'll just log it (remove in production!)
    console.log(`Password reset token for ${user.email}: ${token}`);
  }

  /**
   * Confirm password reset
   */
  async confirmPasswordReset(confirmDto: PasswordResetConfirmDto): Promise<void> {
    // Hash the provided token
    const tokenHash = this.passwordService.hashToken(confirmDto.reset_token);

    // Find token
    const resetToken = await this.passwordResetTokenRepository.findOne({
      where: { token_hash: tokenHash, used: false },
      relations: ['user'],
    });

    if (!resetToken) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    // Check if token is expired
    if (new Date() > resetToken.expires_at) {
      throw new BadRequestException('Reset token has expired');
    }

    // Validate new password
    this.passwordService.validatePasswordComplexity(confirmDto.new_password);

    // Hash new password
    const newPasswordHash = await this.passwordService.hashPassword(confirmDto.new_password);

    // Update user password
    await this.usersService.update(resetToken.user_id, {
      password_hash: newPasswordHash,
    });

    // Mark token as used
    resetToken.used = true;
    await this.passwordResetTokenRepository.save(resetToken);

    // Invalidate all sessions
    await this.logoutAll(resetToken.user_id);

    // TODO: Send password changed notification email
  }

  /**
   * Verify email
   */
  async verifyEmail(token: string): Promise<void> {
    // Hash the provided token
    const tokenHash = this.passwordService.hashToken(token);

    // Find token
    const verificationToken = await this.emailVerificationTokenRepository.findOne({
      where: { token_hash: tokenHash, used: false },
      relations: ['user'],
    });

    if (!verificationToken) {
      throw new BadRequestException('Invalid or expired verification token');
    }

    // Check if token is expired
    if (new Date() > verificationToken.expires_at) {
      throw new BadRequestException('Verification token has expired');
    }

    // Mark email as verified
    await this.usersService.markEmailVerified(verificationToken.user_id);

    // Mark token as used
    verificationToken.used = true;
    await this.emailVerificationTokenRepository.save(verificationToken);
  }

  /**
   * Create email verification token
   */
  private async createEmailVerificationToken(userId: string): Promise<string> {
    const { token, hash } = this.passwordService.generateVerificationToken();

    const verificationToken = this.emailVerificationTokenRepository.create({
      user_id: userId,
      token_hash: hash,
      expires_at: new Date(Date.now() + 24 * 3600 * 1000), // 24 hours
      used: false,
    });

    await this.emailVerificationTokenRepository.save(verificationToken);

    // TODO: Send verification email
    console.log(`Email verification token for user ${userId}: ${token}`);

    return token;
  }

  /**
   * Check if account is locked
   */
  private async isAccountLocked(userId: string): Promise<boolean> {
    const key = `failed_login:${userId}`;
    const attempts = await this.redisClient.get(key);
    return attempts !== null && parseInt(attempts, 10) >= this.MAX_FAILED_ATTEMPTS;
  }

  /**
   * Increment failed login attempts
   */
  private async incrementFailedAttempts(userId: string): Promise<void> {
    const key = `failed_login:${userId}`;
    const attempts = await this.redisClient.incr(key);

    if (attempts === 1) {
      // Set expiry on first attempt
      await this.redisClient.expire(key, this.LOCKOUT_DURATION_MINUTES * 60);
    }

    if (attempts >= this.MAX_FAILED_ATTEMPTS) {
      // TODO: Send account locked notification email
      console.log(`Account locked for user ${userId} due to failed login attempts`);
    }
  }

  /**
   * Reset failed login attempts
   */
  private async resetFailedAttempts(userId: string): Promise<void> {
    const key = `failed_login:${userId}`;
    await this.redisClient.del(key);
  }
}
