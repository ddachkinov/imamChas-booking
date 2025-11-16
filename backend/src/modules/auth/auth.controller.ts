import {
  Controller,
  Post,
  Get,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './services/auth.service';
import {
  RegisterDto,
  LoginDto,
  RefreshTokenDto,
  PasswordResetRequestDto,
  PasswordResetConfirmDto,
  VerifyEmailDto,
} from './dto';
import { AuthResponse } from './interfaces/auth-response.interface';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from '@/common/decorators';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({
    status: 201,
    description: 'User registered successfully',
    type: Object, // TODO: Create proper Swagger schema
  })
  @ApiResponse({ status: 409, description: 'User already exists' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  async register(@Body() registerDto: RegisterDto): Promise<AuthResponse> {
    // TODO: Extract tenant ID from request or subdomain
    // For now, using a default tenant ID (should be replaced with proper tenant resolution)
    const tenantId = '00000000-0000-0000-0000-000000000000';
    return this.authService.register(registerDto, tenantId);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login user' })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
    type: Object,
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() loginDto: LoginDto, @Req() request: any): Promise<AuthResponse> {
    // Extract tenant from subdomain (e.g., demo.ic-booking.groundpoint.net -> 'demo')
    const host = request.headers.host || '';
    const subdomain = host.split('.')[0];

    // Use subdomain to get tenant, fallback to demo tenant for development
    const tenantSlug = subdomain === 'api' ? 'demo' : subdomain;

    return this.authService.loginBySlug(loginDto, tenantSlug);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user information' })
  @ApiResponse({
    status: 200,
    description: 'Current user information',
    type: Object,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getCurrentUser(@CurrentUser() user: any): Promise<any> {
    return this.authService.getUserInfo(user.userId);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({
    status: 200,
    description: 'Token refreshed successfully',
    type: Object,
  })
  @ApiResponse({ status: 401, description: 'Invalid refresh token' })
  async refresh(@Body() refreshTokenDto: RefreshTokenDto): Promise<AuthResponse> {
    return this.authService.refreshToken(refreshTokenDto.refresh_token);
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout current session' })
  @ApiResponse({ status: 204, description: 'Logout successful' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async logout(@CurrentUser() user: any, @Req() req: any): Promise<void> {
    // Extract token ID from JWT payload
    const tokenId = req.user.jti;
    await this.authService.logout(user.userId, tokenId);
  }

  @Post('logout-all')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout all sessions' })
  @ApiResponse({ status: 204, description: 'All sessions logged out' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async logoutAll(@CurrentUser() user: any): Promise<void> {
    await this.authService.logoutAll(user.userId);
  }

  @Post('password-reset')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request password reset' })
  @ApiResponse({
    status: 200,
    description: 'Password reset email sent (if user exists)',
  })
  async requestPasswordReset(
    @Body() requestDto: PasswordResetRequestDto,
  ): Promise<{ message: string }> {
    // TODO: Extract tenant ID from request or subdomain
    const tenantId = '00000000-0000-0000-0000-000000000000';
    await this.authService.requestPasswordReset(requestDto, tenantId);
    return {
      message: 'If an account with that email exists, a password reset link has been sent.',
    };
  }

  @Post('password-reset/confirm')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Confirm password reset with token' })
  @ApiResponse({ status: 200, description: 'Password reset successful' })
  @ApiResponse({ status: 400, description: 'Invalid or expired token' })
  async confirmPasswordReset(
    @Body() confirmDto: PasswordResetConfirmDto,
  ): Promise<{ message: string }> {
    await this.authService.confirmPasswordReset(confirmDto);
    return { message: 'Password has been reset successfully' };
  }

  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify email with token' })
  @ApiResponse({ status: 200, description: 'Email verified successfully' })
  @ApiResponse({ status: 400, description: 'Invalid or expired token' })
  async verifyEmail(@Body() verifyDto: VerifyEmailDto): Promise<{ message: string }> {
    await this.authService.verifyEmail(verifyDto.token);
    return { message: 'Email verified successfully' };
  }

  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Resend email verification' })
  @ApiResponse({ status: 200, description: 'Verification email sent' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async resendVerification(@CurrentUser() user: any): Promise<{ message: string }> {
    // TODO: Implement resend verification logic
    return { message: 'Verification email sent' };
  }
}
