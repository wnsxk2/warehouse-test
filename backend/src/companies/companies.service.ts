import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { SetupCompanyDto } from './dto/setup-company.dto';
import { AddUserDto } from './dto/add-user.dto';
import { CreateInviteCodeDto } from './dto/create-invite-code.dto';
import { JoinWithInviteDto } from './dto/join-with-invite.dto';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

@Injectable()
export class CompaniesService {
  constructor(private readonly prisma: PrismaService) {}

  async setupCompany(userId: string, setupCompanyDto: SetupCompanyDto) {
    // Check if user exists and is not already assigned to a company
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.companyId) {
      throw new BadRequestException('User is already assigned to a company');
    }

    // Create company and assign user as admin in a transaction
    const result = await this.prisma.$transaction(async (prisma) => {
      // Create company
      const company = await prisma.company.create({
        data: {
          name: setupCompanyDto.name,
          email: setupCompanyDto.email,
          phone: setupCompanyDto.phone,
          address: setupCompanyDto.address,
          maxUsers: setupCompanyDto.maxUsers || 50,
        },
      });

      // Update user to assign to company as ADMIN
      await prisma.user.update({
        where: { id: userId },
        data: {
          companyId: company.id,
          role: 'ADMIN',
        },
      });

      return company;
    });

    return result;
  }

  async create(createCompanyDto: CreateCompanyDto) {
    return this.prisma.company.create({
      data: createCompanyDto,
    });
  }

  async findAll() {
    return this.prisma.company.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const company = await this.prisma.company.findUnique({
      where: { id },
      include: {
        users: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            isActive: true,
            createdAt: true,
          },
        },
        _count: {
          select: {
            warehouses: true,
            items: true,
            users: true,
          },
        },
      },
    });

    if (!company) {
      throw new NotFoundException(`Company with ID ${id} not found`);
    }

    return company;
  }

  async update(id: string, updateCompanyDto: UpdateCompanyDto) {
    const company = await this.prisma.company.findUnique({
      where: { id },
    });

    if (!company) {
      throw new NotFoundException(`Company with ID ${id} not found`);
    }

    return this.prisma.company.update({
      where: { id },
      data: updateCompanyDto,
    });
  }

  async remove(id: string) {
    const company = await this.prisma.company.findUnique({
      where: { id },
    });

    if (!company) {
      throw new NotFoundException(`Company with ID ${id} not found`);
    }

    // Hard delete for Company (no soft delete in schema)
    return this.prisma.company.delete({
      where: { id },
    });
  }

  async getCompanyUsers(id: string) {
    const company = await this.prisma.company.findUnique({
      where: { id },
    });

    if (!company) {
      throw new NotFoundException(`Company with ID ${id} not found`);
    }

    return this.prisma.user.findMany({
      where: { companyId: id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Company admin methods
  async getMyCompany(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { companyId: true },
    });

    if (!user || !user.companyId) {
      throw new NotFoundException('User is not assigned to any company');
    }

    return this.findOne(user.companyId);
  }

  async getMyCompanyUsers(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { companyId: true },
    });

    if (!user || !user.companyId) {
      throw new NotFoundException('User is not assigned to any company');
    }

    return this.getCompanyUsers(user.companyId);
  }

  async addUserToMyCompany(adminUserId: string, addUserDto: AddUserDto) {
    // Get admin's company
    const admin = await this.prisma.user.findUnique({
      where: { id: adminUserId },
      select: { companyId: true },
    });

    if (!admin || !admin.companyId) {
      throw new NotFoundException('Admin is not assigned to any company');
    }

    // Check if company exists and has available slots
    const company = await this.prisma.company.findUnique({
      where: { id: admin.companyId },
      include: {
        _count: {
          select: { users: true },
        },
      },
    });

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    // Check max users limit
    if (company._count.users >= company.maxUsers) {
      throw new BadRequestException(
        `Company has reached maximum users limit (${company.maxUsers})`,
      );
    }

    // Check if email already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: addUserDto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(addUserDto.password, 10);

    // Create user and assign to company
    return this.prisma.user.create({
      data: {
        email: addUserDto.email,
        password: hashedPassword,
        name: addUserDto.name,
        role: addUserDto.role || 'USER',
        companyId: admin.companyId,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        companyId: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  // Invite code methods
  private generateInviteCode(): string {
    // Generate a random 8-character code (uppercase letters and numbers)
    const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude similar characters (I, O, 0, 1)
    let code = '';
    for (let i = 0; i < 8; i++) {
      const randomIndex = crypto.randomInt(0, characters.length);
      code += characters[randomIndex];
    }
    return code;
  }

  async createInviteCode(adminUserId: string, createInviteCodeDto: CreateInviteCodeDto) {
    // Get admin's company
    const admin = await this.prisma.user.findUnique({
      where: { id: adminUserId },
      select: { companyId: true, role: true },
    });

    if (!admin || !admin.companyId) {
      throw new NotFoundException('Admin is not assigned to any company');
    }

    if (admin.role !== 'ADMIN') {
      throw new BadRequestException('Only company admins can create invite codes');
    }

    // Generate unique code
    let code = this.generateInviteCode();
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
      const existing = await this.prisma.inviteCode.findUnique({
        where: { code },
      });

      if (!existing) {
        break;
      }

      code = this.generateInviteCode();
      attempts++;
    }

    if (attempts === maxAttempts) {
      throw new BadRequestException('Failed to generate unique invite code');
    }

    // Calculate expiration date (default 7 days)
    const expiresInDays = createInviteCodeDto.expiresInDays || 7;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    // Create invite code
    return this.prisma.inviteCode.create({
      data: {
        code,
        companyId: admin.companyId,
        createdBy: adminUserId,
        expiresAt,
        maxUses: createInviteCodeDto.maxUses || 10,
      },
      select: {
        id: true,
        code: true,
        companyId: true,
        expiresAt: true,
        maxUses: true,
        usedCount: true,
        isActive: true,
        createdAt: true,
      },
    });
  }

  async getMyInviteCodes(adminUserId: string) {
    // Get admin's company
    const admin = await this.prisma.user.findUnique({
      where: { id: adminUserId },
      select: { companyId: true, role: true },
    });

    if (!admin || !admin.companyId) {
      throw new NotFoundException('Admin is not assigned to any company');
    }

    if (admin.role !== 'ADMIN') {
      throw new BadRequestException('Only company admins can view invite codes');
    }

    return this.prisma.inviteCode.findMany({
      where: { companyId: admin.companyId },
      select: {
        id: true,
        code: true,
        expiresAt: true,
        maxUses: true,
        usedCount: true,
        isActive: true,
        createdAt: true,
        creator: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async deactivateInviteCode(adminUserId: string, inviteCodeId: string) {
    // Get admin's company
    const admin = await this.prisma.user.findUnique({
      where: { id: adminUserId },
      select: { companyId: true, role: true },
    });

    if (!admin || !admin.companyId) {
      throw new NotFoundException('Admin is not assigned to any company');
    }

    if (admin.role !== 'ADMIN') {
      throw new BadRequestException('Only company admins can deactivate invite codes');
    }

    // Get invite code
    const inviteCode = await this.prisma.inviteCode.findUnique({
      where: { id: inviteCodeId },
    });

    if (!inviteCode) {
      throw new NotFoundException('Invite code not found');
    }

    if (inviteCode.companyId !== admin.companyId) {
      throw new BadRequestException('Invite code does not belong to your company');
    }

    return this.prisma.inviteCode.update({
      where: { id: inviteCodeId },
      data: { isActive: false },
      select: {
        id: true,
        code: true,
        isActive: true,
      },
    });
  }

  async joinWithInviteCode(userId: string, joinWithInviteDto: JoinWithInviteDto) {
    // Get user
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.companyId) {
      throw new BadRequestException('User is already assigned to a company');
    }

    // Get invite code
    const inviteCode = await this.prisma.inviteCode.findUnique({
      where: { code: joinWithInviteDto.code },
      include: {
        company: {
          include: {
            _count: {
              select: { users: true },
            },
          },
        },
      },
    });

    if (!inviteCode) {
      throw new NotFoundException('Invalid invite code');
    }

    // Validate invite code
    if (!inviteCode.isActive) {
      throw new BadRequestException('Invite code is not active');
    }

    if (new Date() > inviteCode.expiresAt) {
      throw new BadRequestException('Invite code has expired');
    }

    if (inviteCode.usedCount >= inviteCode.maxUses) {
      throw new BadRequestException('Invite code has reached maximum uses');
    }

    // Check company max users limit
    if (inviteCode.company._count.users >= inviteCode.company.maxUsers) {
      throw new BadRequestException(
        `Company has reached maximum users limit (${inviteCode.company.maxUsers})`,
      );
    }

    // Join company and increment used count in a transaction
    const result = await this.prisma.$transaction(async (prisma) => {
      // Update user
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          companyId: inviteCode.companyId,
          role: 'USER',
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          companyId: true,
          isActive: true,
        },
      });

      // Increment used count
      await prisma.inviteCode.update({
        where: { id: inviteCode.id },
        data: {
          usedCount: { increment: 1 },
        },
      });

      return updatedUser;
    });

    return result;
  }
}
