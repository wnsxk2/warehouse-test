import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async register(registerDto: RegisterDto) {
    // Check if account already exists
    const existingAccount = await this.prisma.account.findUnique({
      where: { email: registerDto.email },
    });

    if (existingAccount) {
      throw new ConflictException('Email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(registerDto.password, 12);

    // Create account and user (without company, will be assigned by admin later)
    const account = await this.prisma.account.create({
      data: {
        email: registerDto.email,
        password: hashedPassword,
        user: {
          create: {
            name: registerDto.name,
            role: 'USER',
            companyId: null,
          },
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            role: true,
            createdAt: true,
          },
        },
      },
    });

    if (!account.user) {
      throw new Error('Failed to create user');
    }

    return {
      message: 'Registration successful',
      user: {
        id: account.user.id,
        email: account.email,
        name: account.user.name,
        role: account.user.role,
        createdAt: account.user.createdAt,
      },
    };
  }

  async validateUser(email: string, password: string) {
    const account = await this.prisma.account.findUnique({
      where: { email },
      include: {
        user: {
          include: {
            company: true,
          },
        },
      },
    });

    if (!account || !account.isActive || !account.user) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, account.password);
    if (!isPasswordValid) {
      return null;
    }

    return {
      id: account.user.id,
      accountId: account.id,
      email: account.email,
      name: account.user.name,
      role: account.user.role,
      companyId: account.user.companyId,
      company: account.user.company,
      isActive: account.isActive,
      lastLoginAt: account.lastLoginAt,
    };
  }

  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.email, loginDto.password);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Update last login timestamp on account
    await this.prisma.account.update({
      where: { id: user.accountId },
      data: { lastLoginAt: new Date() },
    });

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      companyId: user.companyId,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.get('JWT_ACCESS_TOKEN_EXPIRATION'),
    });

    const refreshToken = this.jwtService.sign(
      { sub: user.accountId },
      {
        secret: this.configService.get('JWT_SECRET'),
        expiresIn: this.configService.get('JWT_REFRESH_TOKEN_EXPIRATION'),
      },
    );

    // Store refresh token in database (hashed)
    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    await this.prisma.refreshToken.create({
      data: {
        token: hashedRefreshToken,
        accountId: user.accountId,
        expiresAt,
      },
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        companyId: user.companyId,
      },
    };
  }

  async refresh(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get('JWT_SECRET'),
      });

      // Find matching refresh token in database (payload.sub is accountId)
      const storedTokens = await this.prisma.refreshToken.findMany({
        where: {
          accountId: payload.sub,
          isRevoked: false,
        },
      });

      // Verify token matches one of the stored hashed tokens
      let validToken = null;
      for (const stored of storedTokens) {
        const isMatch = await bcrypt.compare(refreshToken, stored.token);
        if (isMatch && stored.expiresAt > new Date()) {
          validToken = stored;
          break;
        }
      }

      if (!validToken) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Revoke old refresh token (RTR - Refresh Token Rotation)
      await this.prisma.refreshToken.update({
        where: { id: validToken.id },
        data: { isRevoked: true },
      });

      // Get account and user details
      const account = await this.prisma.account.findUnique({
        where: { id: payload.sub },
        include: {
          user: true,
        },
      });

      if (!account || !account.isActive || !account.user) {
        throw new UnauthorizedException('Account not found or inactive');
      }

      const user = account.user;

      // Generate new tokens
      const newPayload: JwtPayload = {
        sub: user.id,
        email: account.email,
        companyId: user.companyId,
        role: user.role,
      };

      const accessToken = this.jwtService.sign(newPayload, {
        expiresIn: this.configService.get('JWT_ACCESS_TOKEN_EXPIRATION'),
      });

      const newRefreshToken = this.jwtService.sign(
        { sub: account.id },
        {
          secret: this.configService.get('JWT_SECRET'),
          expiresIn: this.configService.get('JWT_REFRESH_TOKEN_EXPIRATION'),
        },
      );

      // Store new refresh token
      const hashedRefreshToken = await bcrypt.hash(newRefreshToken, 10);
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      await this.prisma.refreshToken.create({
        data: {
          token: hashedRefreshToken,
          accountId: account.id,
          expiresAt,
        },
      });

      return {
        accessToken,
        refreshToken: newRefreshToken,
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(userId: string) {
    // Find user's account
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { accountId: true },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Revoke all account's refresh tokens
    await this.prisma.refreshToken.updateMany({
      where: {
        accountId: user.accountId,
        isRevoked: false,
      },
      data: {
        isRevoked: true,
      },
    });

    return { message: 'Logged out successfully' };
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        role: true,
        companyId: true,
        createdAt: true,
        updatedAt: true,
        account: {
          select: {
            email: true,
            isActive: true,
            lastLoginAt: true,
          },
        },
        company: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return {
      id: user.id,
      email: user.account.email,
      name: user.name,
      role: user.role,
      companyId: user.companyId,
      isActive: user.account.isActive,
      lastLoginAt: user.account.lastLoginAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      company: user.company,
    };
  }

  async changePassword(userId: string, changePasswordDto: ChangePasswordDto) {
    // Find user's account
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        account: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(
      changePasswordDto.currentPassword,
      user.account.password,
    );

    if (!isPasswordValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(changePasswordDto.newPassword, 12);

    // Update password
    await this.prisma.account.update({
      where: { id: user.accountId },
      data: { password: hashedPassword },
    });

    // Revoke all refresh tokens to force re-login
    await this.prisma.refreshToken.updateMany({
      where: {
        accountId: user.accountId,
        isRevoked: false,
      },
      data: {
        isRevoked: true,
      },
    });

    return { message: 'Password changed successfully' };
  }
}
