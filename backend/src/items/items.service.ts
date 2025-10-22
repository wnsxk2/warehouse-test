import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateItemDto } from './dto/create-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class ItemsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async findAll(
    companyId: string,
    filters?: {
      search?: string;
      category?: string;
      page?: number;
      limit?: number;
    },
  ) {
    const { search, category, page = 1, limit = 20 } = filters || {};
    const skip = (page - 1) * limit;

    const where: any = {
      companyId,
      deletedAt: null,
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
        { category: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (category) {
      where.category = category;
    }

    const items = await this.prisma.item.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        createdAt: 'desc',
      },
    });

    return items;
  }

  async findOne(id: string, companyId: string) {
    const item = await this.prisma.item.findFirst({
      where: { id, companyId, deletedAt: null },
      include: {
        inventory: {
          select: {
            quantity: true,
            warehouse: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!item) {
      throw new NotFoundException('Item not found');
    }

    // Calculate total quantity across all warehouses
    const totalQuantity = item.inventory.reduce((sum, inv) => sum + Number(inv.quantity), 0);

    return {
      ...item,
      totalQuantity,
    };
  }

  async create(createItemDto: CreateItemDto, companyId: string) {
    const { sku, name, category, unitOfMeasure, description, reorderThreshold } = createItemDto;

    // Check for duplicate SKU
    const existingItem = await this.prisma.item.findFirst({
      where: {
        sku,
        companyId,
        deletedAt: null,
      },
    });

    if (existingItem) {
      throw new BadRequestException(`Item with SKU '${sku}' already exists`);
    }

    const item = await this.prisma.item.create({
      data: {
        sku,
        name,
        category,
        unitOfMeasure,
        description,
        reorderThreshold,
        companyId,
      },
    });

    // Create notification for all users in the company
    await this.notificationsService.createForCompany(
      companyId,
      'ITEM_CREATED',
      '새 아이템 등록',
      `새로운 아이템 "${item.name}" (SKU: ${item.sku})이(가) 등록되었습니다.`,
      item.id,
    );

    return item;
  }

  async update(id: string, updateItemDto: UpdateItemDto, companyId: string) {
    // Verify item exists and belongs to company
    const item = await this.prisma.item.findFirst({
      where: { id, companyId, deletedAt: null },
    });

    if (!item) {
      throw new NotFoundException('Item not found');
    }

    // If SKU is being updated, check for duplicates
    if (updateItemDto.sku && updateItemDto.sku !== item.sku) {
      const existingItem = await this.prisma.item.findFirst({
        where: {
          sku: updateItemDto.sku,
          companyId,
          deletedAt: null,
          id: { not: id },
        },
      });

      if (existingItem) {
        throw new BadRequestException(`Item with SKU '${updateItemDto.sku}' already exists`);
      }
    }

    const updatedItem = await this.prisma.item.update({
      where: { id },
      data: updateItemDto,
    });

    return updatedItem;
  }

  async remove(id: string, companyId: string) {
    // Verify item exists and belongs to company
    const item = await this.prisma.item.findFirst({
      where: { id, companyId, deletedAt: null },
    });

    if (!item) {
      throw new NotFoundException('Item not found');
    }

    // Soft delete
    const deletedItem = await this.prisma.item.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });

    // Create notification for all users in the company
    await this.notificationsService.createForCompany(
      companyId,
      'ITEM_DELETED',
      '아이템 삭제',
      `아이템 "${item.name}" (SKU: ${item.sku})이(가) 삭제되었습니다.`,
      item.id,
    );

    return deletedItem;
  }
}
