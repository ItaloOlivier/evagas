import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { LoginDto, RegisterDto, RefreshTokenDto } from './dto/auth.dto';
import { AuditService } from '../audit/audit.service';

export interface JwtPayload {
  sub: string;
  email: string;
  roles: string[];
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private auditService: AuditService,
  ) {}

  async login(dto: LoginDto, ipAddress?: string, userAgent?: string): Promise<AuthTokens> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if account is locked
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new UnauthorizedException('Account is locked. Please try again later.');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);

    if (!isPasswordValid) {
      // Increment failed attempts
      const failedAttempts = user.failedLoginAttempts + 1;
      const updates: any = { failedLoginAttempts: failedAttempts };

      // Lock account after 5 failed attempts
      if (failedAttempts >= 5) {
        updates.lockedUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
      }

      await this.prisma.user.update({
        where: { id: user.id },
        data: updates,
      });

      await this.auditService.log({
        eventType: 'AUTH',
        eventSubtype: 'LOGIN_FAILED',
        action: 'LOGIN',
        actorId: user.id,
        actorEmail: user.email,
        entityType: 'user',
        entityId: user.id,
        summary: `Failed login attempt for ${user.email}`,
        details: { failedAttempts, locked: failedAttempts >= 5 },
        ipAddress,
        userAgent,
      });

      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if user is active
    if (user.status !== 'active') {
      throw new UnauthorizedException('Account is not active');
    }

    // Reset failed attempts and update last login
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: 0,
        lockedUntil: null,
        lastLoginAt: new Date(),
      },
    });

    // Generate tokens
    const tokens = await this.generateTokens(user);

    // Store refresh token
    await this.storeRefreshToken(user.id, tokens.refreshToken, dto.deviceInfo);

    // Audit log
    await this.auditService.log({
      eventType: 'AUTH',
      eventSubtype: 'LOGIN_SUCCESS',
      action: 'LOGIN',
      actorId: user.id,
      actorEmail: user.email,
      entityType: 'user',
      entityId: user.id,
      summary: `User ${user.email} logged in`,
      ipAddress,
      userAgent,
    });

    return tokens;
  }

  async logout(userId: string, refreshToken: string): Promise<void> {
    const tokenHash = await this.hashToken(refreshToken);

    await this.prisma.refreshToken.updateMany({
      where: {
        userId,
        tokenHash,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });

    await this.auditService.log({
      eventType: 'AUTH',
      eventSubtype: 'LOGOUT',
      action: 'LOGOUT',
      actorId: userId,
      entityType: 'user',
      entityId: userId,
      summary: 'User logged out',
    });
  }

  async refreshTokens(dto: RefreshTokenDto): Promise<AuthTokens> {
    const tokenHash = await this.hashToken(dto.refreshToken);

    const storedToken = await this.prisma.refreshToken.findFirst({
      where: {
        tokenHash,
        revokedAt: null,
        expiresAt: {
          gt: new Date(),
        },
      },
      include: {
        user: {
          include: {
            roles: {
              include: {
                role: true,
              },
            },
          },
        },
      },
    });

    if (!storedToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (storedToken.user.status !== 'active') {
      throw new UnauthorizedException('Account is not active');
    }

    // Revoke old token (rotation)
    await this.prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { revokedAt: new Date() },
    });

    // Generate new tokens
    const tokens = await this.generateTokens(storedToken.user);

    // Store new refresh token
    await this.storeRefreshToken(storedToken.userId, tokens.refreshToken, storedToken.deviceInfo);

    return tokens;
  }

  async register(dto: RegisterDto): Promise<{ user: any; tokens: AuthTokens }> {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (existingUser) {
      throw new BadRequestException('Email already registered');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
        status: 'active',
      },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    });

    const tokens = await this.generateTokens(user);
    await this.storeRefreshToken(user.id, tokens.refreshToken);

    await this.auditService.log({
      eventType: 'AUTH',
      eventSubtype: 'REGISTER',
      action: 'CREATE',
      actorId: user.id,
      actorEmail: user.email,
      entityType: 'user',
      entityId: user.id,
      summary: `New user registered: ${user.email}`,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        roles: user.roles.map((r) => r.role.name),
      },
      tokens,
    };
  }

  async validateUser(payload: JwtPayload): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: {
        roles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user || user.status !== 'active') {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      roles: user.roles.map((r) => r.role.name),
      permissions: this.extractPermissions(user.roles),
    };
  }

  private async generateTokens(user: any): Promise<AuthTokens> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      roles: user.roles.map((r: any) => r.role.name),
    };

    const accessToken = this.jwtService.sign(payload);

    const refreshExpiryDays = parseInt(
      this.configService.get('JWT_REFRESH_EXPIRY_DAYS') || '7',
      10,
    );
    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: `${refreshExpiryDays}d`,
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: 900, // 15 minutes in seconds
    };
  }

  private async storeRefreshToken(
    userId: string,
    token: string,
    deviceInfo?: any,
  ): Promise<void> {
    const tokenHash = await this.hashToken(token);
    const refreshExpiryDays = parseInt(
      this.configService.get('JWT_REFRESH_EXPIRY_DAYS') || '7',
      10,
    );

    await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash,
        deviceInfo,
        expiresAt: new Date(Date.now() + refreshExpiryDays * 24 * 60 * 60 * 1000),
      },
    });
  }

  private async hashToken(token: string): Promise<string> {
    return bcrypt.hash(token, 10);
  }

  private extractPermissions(
    roles: Array<{ role: { permissions: Array<{ permission: { resource: string; action: string } }> } }>,
  ): string[] {
    const permissions = new Set<string>();

    for (const userRole of roles) {
      for (const rolePermission of userRole.role.permissions) {
        permissions.add(`${rolePermission.permission.resource}:${rolePermission.permission.action}`);
      }
    }

    return Array.from(permissions);
  }
}
