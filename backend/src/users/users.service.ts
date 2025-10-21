import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
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
    const existingUser = await this.prisma.user.findUnique({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    return this.prisma.user.create({
      data: {
        ...createUserDto,
        password: hashedPassword,
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

  async findAll(companyId?: string) {
    const where: any = {};

    if (companyId) {
      where.companyId = companyId;
    }

    return this.prisma.user.findMany({
      where,
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
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        companyId: true,
        isActive: true,
        company: {
          select: {
            id: true,
            name: true,
            address: true,
          },
        },
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    // Check email uniqueness if email is being updated
    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingUser = await this.prisma.user.findUnique({
        where: { email: updateUserDto.email },
      });

      if (existingUser) {
        throw new ConflictException('Email already exists');
      }
    }

    // Hash password if provided
    const data: any = { ...updateUserDto };
    if (updateUserDto.password) {
      data.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    return this.prisma.user.update({
      where: { id },
      data,
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

  async remove(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    // Soft delete by setting isActive to false
    return this.prisma.user.update({
      where: { id },
      data: { isActive: false },
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
      throw new BadRequestException(`Company has reached maximum users limit (${company.maxUsers})`);
    }

    // Check if email already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: createUserAdminDto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(createUserAdminDto.password, 10);

    return this.prisma.user.create({
      data: {
        email: createUserAdminDto.email,
        password: hashedPassword,
        name: createUserAdminDto.name,
        role: createUserAdminDto.role as any,
        companyId: createUserAdminDto.companyId,
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

  async updateUserRole(id: string, role: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    // Prevent changing SUPER_ADMIN role
    if (user.role === 'SUPER_ADMIN' || role === 'SUPER_ADMIN') {
      throw new BadRequestException('Cannot modify SUPER_ADMIN role');
    }

    return this.prisma.user.update({
      where: { id },
      data: { role: role as any },
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

  async deleteUserByAdmin(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
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
    return this.prisma.user.update({
      where: { id },
      data: {
        companyId: null,
        role: 'USER', // Reset role to USER when removing from company
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

  async getUnassignedUsers() {
    return this.prisma.user.findMany({
      where: {
        companyId: null,
        role: { not: 'SUPER_ADMIN' },
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async assignUserToCompany(userId: string, companyId: string, role: string) {
    // Check if user exists
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
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
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        companyId,
        role: role as any,
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
}
