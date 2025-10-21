import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWarehouseDto } from './dto/create-warehouse.dto';
import { UpdateWarehouseDto } from './dto/update-warehouse.dto';

@Injectable()
export class WarehousesService {
  constructor(private prisma: PrismaService) {}

  async findAll(companyId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const warehouses = await this.prisma.warehouse.findMany({
      where: {
        companyId,
        deletedAt: null,
      },
      include: {
        _count: {
          select: {
            inventory: true,
          },
        },
      },
      skip,
      take: limit,
      orderBy: {
        createdAt: 'desc',
      },
    });

    return warehouses;
  }

  async findOne(id: string, companyId: string) {
    const warehouse = await this.prisma.warehouse.findFirst({
      where: {
        id,
        companyId,
        deletedAt: null,
      },
      include: {
        _count: {
          select: {
            inventory: true,
          },
        },
      },
    });

    if (!warehouse) {
      throw new NotFoundException(`Warehouse with ID ${id} not found`);
    }

    return warehouse;
  }

  async create(createWarehouseDto: CreateWarehouseDto, companyId: string) {
    const warehouse = await this.prisma.warehouse.create({
      data: {
        ...createWarehouseDto,
        companyId,
      },
      include: {
        _count: {
          select: {
            inventory: true,
          },
        },
      },
    });

    return warehouse;
  }

  async update(id: string, updateWarehouseDto: UpdateWarehouseDto, companyId: string) {
    // Verify warehouse exists and belongs to company
    await this.findOne(id, companyId);

    const warehouse = await this.prisma.warehouse.update({
      where: { id },
      data: updateWarehouseDto,
      include: {
        _count: {
          select: {
            inventory: true,
          },
        },
      },
    });

    return warehouse;
  }

  async remove(id: string, companyId: string) {
    // Verify warehouse exists and belongs to company
    await this.findOne(id, companyId);

    // Soft delete: set deletedAt timestamp
    const warehouse = await this.prisma.warehouse.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });

    return warehouse;
  }

  async getInventory(id: string, companyId: string) {
    // Verify warehouse exists and belongs to company
    await this.findOne(id, companyId);

    const inventory = await this.prisma.inventory.findMany({
      where: {
        warehouseId: id,
      },
      include: {
        item: {
          select: {
            id: true,
            name: true,
            sku: true,
            category: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    return inventory;
  }
}
