import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWarehouseDto } from './dto/create-warehouse.dto';
import { UpdateWarehouseDto } from './dto/update-warehouse.dto';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class WarehousesService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  async findAll(companyId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const warehouses = await this.prisma.warehouse.findMany({
      where: {
        companyId,
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

  async create(createWarehouseDto: CreateWarehouseDto, companyId: string, userId: string) {
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

    // Create notification for all users in the company (excluding the user who created it)
    await this.notificationsService.createForCompany(
      companyId,
      'WAREHOUSE_CREATED',
      '새 창고 생성',
      `새로운 창고 "${warehouse.name}"이(가) 생성되었습니다.`,
      warehouse.id,
      userId, // Exclude the user who created the warehouse
    );

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

  async remove(id: string, companyId: string, userId: string) {
    // Verify warehouse exists and belongs to company
    const warehouse = await this.findOne(id, companyId);

    // Hard delete (history is automatically saved by Prisma middleware)
    await this.prisma.warehouse.delete({
      where: { id },
    });

    // Create notification for all users in the company (excluding the user who deleted it)
    await this.notificationsService.createForCompany(
      companyId,
      'WAREHOUSE_DELETED',
      '창고 삭제',
      `창고 "${warehouse.name}"이(가) 삭제되었습니다.`,
      warehouse.id,
      userId, // Exclude the user who deleted the warehouse
    );

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
