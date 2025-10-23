import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { CreateUserAdminDto } from './dto/create-user-admin.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto) {
    // Check if email already exists
    const existingAccount = await this.prisma.account.findUnique({
      where: { email: createUserDto.email },
    });

    if (existingAccount) {
      throw new ConflictException('Email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    const account = await this.prisma.account.create({
      data: {
        email: createUserDto.email,
        password: hashedPassword,
        user: {
          create: {
            name: createUserDto.name,
            companyId: createUserDto.companyId,
          },
        },
      },
      include: {
        user: true,
      },
    });

    if (!account.user) {
      throw new Error('Failed to create user');
    }

    return {
      id: account.user.id,
      email: account.email,
      name: account.user.name,
      role: account.user.role,
      companyId: account.user.companyId,
      isActive: account.isActive,
      createdAt: account.user.createdAt,
      updatedAt: account.user.updatedAt,
    };
  }

  async findAll(companyId?: string) {
    const where: any = {};

    if (companyId) {
      where.companyId = companyId;
    }

    const users = await this.prisma.user.findMany({
      where,
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
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return users.map((user) => ({
      id: user.id,
      email: user.account.email,
      name: user.name,
      role: user.role,
      companyId: user.companyId,
      isActive: user.account.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }));
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
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
          },
        },
        company: {
          select: {
            id: true,
            name: true,
            address: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return {
      id: user.id,
      email: user.account.email,
      name: user.name,
      role: user.role,
      companyId: user.companyId,
      isActive: user.account.isActive,
      company: user.company,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  async findByEmail(email: string) {
    const account = await this.prisma.account.findUnique({
      where: { email },
      include: { user: true },
    });

    if (!account || !account.user) {
      return null;
    }

    return {
      id: account.user.id,
      email: account.email,
      name: account.user.name,
      role: account.user.role,
      companyId: account.user.companyId,
      isActive: account.isActive,
    };
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { account: true },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    // Check email uniqueness if email is being updated
    if (updateUserDto.email && updateUserDto.email !== user.account.email) {
      const existingAccount = await this.prisma.account.findUnique({
        where: { email: updateUserDto.email },
      });

      if (existingAccount) {
        throw new ConflictException('Email already exists');
      }
    }

    // Update account (email, password)
    const accountData: any = {};
    if (updateUserDto.email) {
      accountData.email = updateUserDto.email;
    }
    if (updateUserDto.password) {
      accountData.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    if (Object.keys(accountData).length > 0) {
      await this.prisma.account.update({
        where: { id: user.accountId },
        data: accountData,
      });
    }

    // Update user (name, companyId)
    const userData: any = {};
    if (updateUserDto.name !== undefined) {
      userData.name = updateUserDto.name;
    }
    if (updateUserDto.companyId !== undefined) {
      userData.companyId = updateUserDto.companyId;
    }

    let updatedUser = user;
    if (Object.keys(userData).length > 0) {
      updatedUser = await this.prisma.user.update({
        where: { id },
        data: userData,
        include: { account: true },
      });
    }

    // Refetch to get updated data
    const result = await this.prisma.user.findUnique({
      where: { id },
      include: { account: true },
    });

    if (!result) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return {
      id: result.id,
      email: result.account.email,
      name: result.name,
      role: result.role,
      companyId: result.companyId,
      isActive: result.account.isActive,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
    };
  }

  async remove(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { account: true },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    // Soft delete by setting account isActive to false
    await this.prisma.account.update({
      where: { id: user.accountId },
      data: { isActive: false },
    });

    const result = await this.prisma.user.findUnique({
      where: { id },
      include: { account: true },
    });

    if (!result) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return {
      id: result.id,
      email: result.account.email,
      name: result.name,
      role: result.role,
      companyId: result.companyId,
      isActive: result.account.isActive,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
    };
  }

  // Admin-only methods
  async createUserByAdmin(createUserAdminDto: CreateUserAdminDto) {
    // Check if company exists
    const company = await this.prisma.company.findUnique({
      where: { id: createUserAdminDto.companyId },
      include: { _count: { select: { users: true } } },
    });

    if (!company) {
      throw new NotFoundException(`Company with ID ${createUserAdminDto.companyId} not found`);
    }

    // Check max users limit
    if (company._count.users >= company.maxUsers) {
      throw new BadRequestException(
        `Company has reached maximum users limit (${company.maxUsers})`,
      );
    }

    // Check if email already exists
    const existingAccount = await this.prisma.account.findUnique({
      where: { email: createUserAdminDto.email },
    });

    if (existingAccount) {
      throw new ConflictException('Email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(createUserAdminDto.password, 10);

    const account = await this.prisma.account.create({
      data: {
        email: createUserAdminDto.email,
        password: hashedPassword,
        user: {
          create: {
            name: createUserAdminDto.name,
            role: createUserAdminDto.role as any,
            companyId: createUserAdminDto.companyId,
          },
        },
      },
      include: {
        user: true,
      },
    });

    if (!account.user) {
      throw new Error('Failed to create user');
    }

    return {
      id: account.user.id,
      email: account.email,
      name: account.user.name,
      role: account.user.role,
      companyId: account.user.companyId,
      isActive: account.isActive,
      createdAt: account.user.createdAt,
      updatedAt: account.user.updatedAt,
    };
  }

  async updateUserRole(id: string, role: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { account: true },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    // Prevent changing SUPER_ADMIN role
    if (user.role === 'SUPER_ADMIN' || role === 'SUPER_ADMIN') {
      throw new BadRequestException('Cannot modify SUPER_ADMIN role');
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: { role: role as any },
      include: { account: true },
    });

    return {
      id: updated.id,
      email: updated.account.email,
      name: updated.name,
      role: updated.role,
      companyId: updated.companyId,
      isActive: updated.account.isActive,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    };
  }

  async deleteUserByAdmin(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { account: true },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    // Prevent removing SUPER_ADMIN from company
    if (user.role === 'SUPER_ADMIN') {
      throw new BadRequestException('Cannot modify SUPER_ADMIN user');
    }

    // Check if user is assigned to a company
    if (!user.companyId) {
      throw new BadRequestException('User is not assigned to any company');
    }

    // Remove user from company (soft removal - just unassign)
    const updated = await this.prisma.user.update({
      where: { id },
      data: {
        companyId: null,
        role: 'USER', // Reset role to USER when removing from company
      },
      include: { account: true },
    });

    return {
      id: updated.id,
      email: updated.account.email,
      name: updated.name,
      role: updated.role,
      companyId: updated.companyId,
      isActive: updated.account.isActive,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    };
  }

  async getUnassignedUsers() {
    const users = await this.prisma.user.findMany({
      where: {
        companyId: null,
        role: { not: 'SUPER_ADMIN' },
      },
      select: {
        id: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        account: {
          select: {
            email: true,
            isActive: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return users.map((user) => ({
      id: user.id,
      email: user.account.email,
      name: user.name,
      role: user.role,
      isActive: user.account.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }));
  }

  async assignUserToCompany(userId: string, companyId: string, role: string) {
    // Check if user exists
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { account: true },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // Prevent assigning SUPER_ADMIN
    if (user.role === 'SUPER_ADMIN') {
      throw new BadRequestException('Cannot assign SUPER_ADMIN to a company');
    }

    // Check if user already belongs to a company
    if (user.companyId) {
      throw new BadRequestException('User already belongs to a company');
    }

    // Check if company exists and has available slots
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      include: {
        _count: {
          select: { users: true },
        },
      },
    });

    if (!company) {
      throw new NotFoundException(`Company with ID ${companyId} not found`);
    }

    // Check max users limit
    if (company._count.users >= company.maxUsers) {
      throw new BadRequestException(
        `Company has reached maximum users limit (${company.maxUsers})`,
      );
    }

    // Assign user to company
    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        companyId,
        role: role as any,
      },
      include: { account: true },
    });

    return {
      id: updated.id,
      email: updated.account.email,
      name: updated.name,
      role: updated.role,
      companyId: updated.companyId,
      isActive: updated.account.isActive,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    };
  }

  // Company admin methods - manage their own company users
  async updateUserRoleByAdmin(adminUserId: string, targetUserId: string, role: string) {
    // Get admin's company
    const admin = await this.prisma.user.findUnique({
      where: { id: adminUserId },
      select: { companyId: true, role: true },
    });

    if (!admin || !admin.companyId) {
      throw new NotFoundException('Admin is not assigned to any company');
    }

    if (admin.role !== 'ADMIN') {
      throw new BadRequestException('Only company admins can change user roles');
    }

    // Get target user
    const targetUser = await this.prisma.user.findUnique({
      where: { id: targetUserId },
      include: { account: true },
    });

    if (!targetUser) {
      throw new NotFoundException(`User with ID ${targetUserId} not found`);
    }

    // Prevent changing SUPER_ADMIN role
    if (targetUser.role === 'SUPER_ADMIN' || role === 'SUPER_ADMIN') {
      throw new BadRequestException('Cannot modify SUPER_ADMIN role');
    }

    // Check if target user belongs to admin's company
    if (targetUser.companyId !== admin.companyId) {
      throw new BadRequestException('User does not belong to your company');
    }

    // Validate role is USER or ADMIN
    if (role !== 'USER' && role !== 'ADMIN') {
      throw new BadRequestException('Role must be USER or ADMIN');
    }

    const updated = await this.prisma.user.update({
      where: { id: targetUserId },
      data: { role: role as any },
      include: { account: true },
    });

    return {
      id: updated.id,
      email: updated.account.email,
      name: updated.name,
      role: updated.role,
      companyId: updated.companyId,
      isActive: updated.account.isActive,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    };
  }

  async removeUserFromCompanyByAdmin(adminUserId: string, targetUserId: string) {
    // Get admin's company
    const admin = await this.prisma.user.findUnique({
      where: { id: adminUserId },
      select: { companyId: true, role: true },
    });

    if (!admin || !admin.companyId) {
      throw new NotFoundException('Admin is not assigned to any company');
    }

    if (admin.role !== 'ADMIN') {
      throw new BadRequestException('Only company admins can remove users');
    }

    // Get target user
    const targetUser = await this.prisma.user.findUnique({
      where: { id: targetUserId },
      include: { account: true },
    });

    if (!targetUser) {
      throw new NotFoundException(`User with ID ${targetUserId} not found`);
    }

    // Prevent removing SUPER_ADMIN
    if (targetUser.role === 'SUPER_ADMIN') {
      throw new BadRequestException('Cannot modify SUPER_ADMIN user');
    }

    // Check if target user belongs to admin's company
    if (targetUser.companyId !== admin.companyId) {
      throw new BadRequestException('User does not belong to your company');
    }

    // Check if user is trying to remove themselves
    if (targetUserId === adminUserId) {
      throw new BadRequestException('Cannot remove yourself from the company');
    }

    // Remove user from company (soft removal - just unassign)
    const updated = await this.prisma.user.update({
      where: { id: targetUserId },
      data: {
        companyId: null,
        role: 'USER', // Reset role to USER when removing from company
      },
      include: { account: true },
    });

    return {
      id: updated.id,
      email: updated.account.email,
      name: updated.name,
      role: updated.role,
      companyId: updated.companyId,
      isActive: updated.account.isActive,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    };
  }
}
