import { Injectable, BadRequestException } from '@nestjs/common';
import * as argon2 from 'argon2';
import * as crypto from 'crypto';

@Injectable()
export class PasswordService {
  private readonly PASSWORD_MIN_LENGTH = 8;
  private readonly PASSWORD_REQUIRE_UPPERCASE = true;
  private readonly PASSWORD_REQUIRE_LOWERCASE = true;
  private readonly PASSWORD_REQUIRE_NUMBER = true;
  private readonly PASSWORD_REQUIRE_SPECIAL = false;

  /**
   * Hash a password using Argon2id
   * @param password Plain text password
   * @returns Argon2id hash
   */
  async hashPassword(password: string): Promise<string> {
    return argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: 65536, // 64 MB
      timeCost: 3, // iterations
      parallelism: 4,
    });
  }

  /**
   * Verify a password against its hash
   * @param password Plain text password
   * @param hash Argon2id hash
   * @returns True if password matches
   */
  async verifyPassword(password: string, hash: string): Promise<boolean> {
    try {
      return await argon2.verify(hash, password);
    } catch (error) {
      return false;
    }
  }

  /**
   * Validate password complexity requirements
   * @param password Plain text password
   * @throws BadRequestException if password doesn't meet requirements
   */
  validatePasswordComplexity(password: string): void {
    if (password.length < this.PASSWORD_MIN_LENGTH) {
      throw new BadRequestException(
        `Password must be at least ${this.PASSWORD_MIN_LENGTH} characters long`,
      );
    }

    if (this.PASSWORD_REQUIRE_UPPERCASE && !/[A-Z]/.test(password)) {
      throw new BadRequestException(
        'Password must contain at least one uppercase letter',
      );
    }

    if (this.PASSWORD_REQUIRE_LOWERCASE && !/[a-z]/.test(password)) {
      throw new BadRequestException(
        'Password must contain at least one lowercase letter',
      );
    }

    if (this.PASSWORD_REQUIRE_NUMBER && !/\d/.test(password)) {
      throw new BadRequestException(
        'Password must contain at least one number',
      );
    }

    if (this.PASSWORD_REQUIRE_SPECIAL && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      throw new BadRequestException(
        'Password must contain at least one special character',
      );
    }
  }

  /**
   * Generate a cryptographically secure random token
   * @returns Base64 URL-safe encoded token (256-bit)
   */
  generateSecureToken(): string {
    return crypto.randomBytes(32).toString('base64url');
  }

  /**
   * Hash a token using SHA-256
   * @param token Plain text token
   * @returns SHA-256 hash
   */
  hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  /**
   * Generate a reset token and its hash
   * @returns Object with token and hash
   */
  generateResetToken(): { token: string; hash: string } {
    const token = this.generateSecureToken();
    const hash = this.hashToken(token);
    return { token, hash };
  }

  /**
   * Generate a verification token and its hash
   * @returns Object with token and hash
   */
  generateVerificationToken(): { token: string; hash: string } {
    const token = this.generateSecureToken();
    const hash = this.hashToken(token);
    return { token, hash };
  }
}
