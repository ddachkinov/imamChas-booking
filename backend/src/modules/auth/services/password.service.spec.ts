import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { PasswordService } from './password.service';

describe('PasswordService', () => {
  let service: PasswordService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PasswordService],
    }).compile();

    service = module.get<PasswordService>(PasswordService);
  });

  describe('hashPassword', () => {
    it('should hash a password with Argon2id', async () => {
      const password = 'Test1234';
      const hash = await service.hashPassword(password);

      expect(hash).toBeDefined();
      expect(hash).toContain('$argon2id$');
      expect(hash.length).toBeGreaterThan(90);
    });

    it('should generate different hashes for same password (salt)', async () => {
      const password = 'Test1234';
      const hash1 = await service.hashPassword(password);
      const hash2 = await service.hashPassword(password);

      expect(hash1).not.toEqual(hash2);
    });
  });

  describe('verifyPassword', () => {
    it('should verify correct password', async () => {
      const password = 'Test1234';
      const hash = await service.hashPassword(password);

      const isValid = await service.verifyPassword(password, hash);
      expect(isValid).toBe(true);
    });

    it('should reject incorrect password', async () => {
      const password = 'Test1234';
      const hash = await service.hashPassword(password);

      const isValid = await service.verifyPassword('WrongPassword123', hash);
      expect(isValid).toBe(false);
    });

    it('should reject slightly different password', async () => {
      const password = 'Test1234';
      const hash = await service.hashPassword(password);

      const isValid = await service.verifyPassword('Test1235', hash);
      expect(isValid).toBe(false);
    });

    it('should return false for invalid hash format', async () => {
      const isValid = await service.verifyPassword('Test1234', 'invalid-hash');
      expect(isValid).toBe(false);
    });
  });

  describe('validatePasswordComplexity', () => {
    it('should accept valid password', () => {
      expect(() => service.validatePasswordComplexity('Test1234')).not.toThrow();
    });

    it('should reject password that is too short', () => {
      expect(() => service.validatePasswordComplexity('Test12')).toThrow(
        BadRequestException,
      );
      expect(() => service.validatePasswordComplexity('Test12')).toThrow(
        'Password must be at least 8 characters long',
      );
    });

    it('should reject password without uppercase letter', () => {
      expect(() => service.validatePasswordComplexity('test1234')).toThrow(
        BadRequestException,
      );
      expect(() => service.validatePasswordComplexity('test1234')).toThrow(
        'Password must contain at least one uppercase letter',
      );
    });

    it('should reject password without lowercase letter', () => {
      expect(() => service.validatePasswordComplexity('TEST1234')).toThrow(
        BadRequestException,
      );
      expect(() => service.validatePasswordComplexity('TEST1234')).toThrow(
        'Password must contain at least one lowercase letter',
      );
    });

    it('should reject password without number', () => {
      expect(() => service.validatePasswordComplexity('TestTest')).toThrow(
        BadRequestException,
      );
      expect(() => service.validatePasswordComplexity('TestTest')).toThrow(
        'Password must contain at least one number',
      );
    });

    it('should accept password with all requirements', () => {
      expect(() => service.validatePasswordComplexity('Password123')).not.toThrow();
      expect(() => service.validatePasswordComplexity('MyP@ssw0rd')).not.toThrow();
    });
  });

  describe('generateSecureToken', () => {
    it('should generate a random token', () => {
      const token = service.generateSecureToken();
      expect(token).toBeDefined();
      expect(token.length).toBeGreaterThan(40);
    });

    it('should generate unique tokens', () => {
      const token1 = service.generateSecureToken();
      const token2 = service.generateSecureToken();
      expect(token1).not.toEqual(token2);
    });
  });

  describe('hashToken', () => {
    it('should hash a token with SHA-256', () => {
      const token = 'test-token-12345';
      const hash = service.hashToken(token);

      expect(hash).toBeDefined();
      expect(hash.length).toBe(64); // SHA-256 produces 64 hex characters
    });

    it('should produce same hash for same token', () => {
      const token = 'test-token-12345';
      const hash1 = service.hashToken(token);
      const hash2 = service.hashToken(token);

      expect(hash1).toEqual(hash2);
    });

    it('should produce different hash for different token', () => {
      const hash1 = service.hashToken('token1');
      const hash2 = service.hashToken('token2');

      expect(hash1).not.toEqual(hash2);
    });
  });

  describe('generateResetToken', () => {
    it('should generate token and hash', () => {
      const result = service.generateResetToken();

      expect(result.token).toBeDefined();
      expect(result.hash).toBeDefined();
      expect(result.token.length).toBeGreaterThan(40);
      expect(result.hash.length).toBe(64);
    });

    it('should hash match the token', () => {
      const result = service.generateResetToken();
      const manualHash = service.hashToken(result.token);

      expect(result.hash).toEqual(manualHash);
    });
  });

  describe('generateVerificationToken', () => {
    it('should generate token and hash', () => {
      const result = service.generateVerificationToken();

      expect(result.token).toBeDefined();
      expect(result.hash).toBeDefined();
      expect(result.token.length).toBeGreaterThan(40);
      expect(result.hash.length).toBe(64);
    });
  });
});
