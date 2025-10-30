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

  async getStockSummary(companyId: string) {
    const items = await this.prisma.item.findMany({
      where: { companyId },
      include: {
        inventory: {
          include: {
            warehouse: {
              select: {
                id: true,
                name: true,
                location: true,
              },
            },
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    return items.map((item) => {
      const totalQuantity = item.inventory.reduce((sum, inv) => sum + Number(inv.quantity), 0);
      const warehouseDistribution = item.inventory.map((inv) => ({
        warehouseId: inv.warehouse.id,
        warehouseName: inv.warehouse.name,
        warehouseLocation: inv.warehouse.location,
        quantity: Number(inv.quantity),
      }));

      return {
        id: item.id,
        sku: item.sku,
        name: item.name,
        category: item.category,
        unitOfMeasure: item.unitOfMeasure,
        reorderThreshold: item.reorderThreshold,
        totalQuantity,
        warehouseDistribution,
        isLowStock: item.reorderThreshold ? totalQuantity <= item.reorderThreshold : false,
      };
    });
  }

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
      where: { id, companyId },
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

  async create(createItemDto: CreateItemDto, companyId: string, userId: string) {
    const { sku, name, category, unitOfMeasure, description, purchasePrice, purchasePriceCurrencyId, salePrice, salePriceCurrencyId, reorderThreshold } = createItemDto;

    // Check for duplicate SKU
    const existingItem = await this.prisma.item.findFirst({
      where: {
        sku,
        companyId,
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
        purchasePrice,
        purchasePriceCurrencyId,
        salePrice,
        salePriceCurrencyId,
        reorderThreshold,
        companyId,
      },
    });

    // Create notification for all users in the company (excluding the user who created it)
    await this.notificationsService.createForCompany(
      companyId,
      'ITEM_CREATED',
      '새 아이템 등록',
      `새로운 아이템 "${item.name}" (SKU: ${item.sku})이(가) 등록되었습니다.`,
      item.id,
      userId, // Exclude the user who created the item
    );

    return item;
  }

  async update(id: string, updateItemDto: UpdateItemDto, companyId: string) {
    // Verify item exists and belongs to company
    const item = await this.prisma.item.findFirst({
      where: { id, companyId },
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

  async remove(id: string, companyId: string, userId: string) {
    // Verify item exists and belongs to company
    const item = await this.prisma.item.findFirst({
      where: { id, companyId },
    });

    if (!item) {
      throw new NotFoundException('Item not found');
    }

    // Hard delete (history is automatically saved by Prisma middleware)
    await this.prisma.item.delete({
      where: { id },
    });

    // Create notification for all users in the company (excluding the user who deleted it)
    await this.notificationsService.createForCompany(
      companyId,
      'ITEM_DELETED',
      '아이템 삭제',
      `아이템 "${item.name}" (SKU: ${item.sku})이(가) 삭제되었습니다.`,
      item.id,
      userId, // Exclude the user who deleted the item
    );

    return item;
  }
}
