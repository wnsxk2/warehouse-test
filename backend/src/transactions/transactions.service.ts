import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class TransactionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async create(createTransactionDto: CreateTransactionDto, userId: string, companyId: string) {
    const { type, warehouseId, itemId, quantity, notes } = createTransactionDto;

    // Use database transaction to ensure atomicity
    return this.prisma.$transaction(async (tx) => {
      // Verify warehouse exists and belongs to company
      const warehouse = await tx.warehouse.findFirst({
        where: { id: warehouseId, companyId, deletedAt: null },
      });

      if (!warehouse) {
        throw new NotFoundException('Warehouse not found');
      }

      // Verify item exists and belongs to company
      const item = await tx.item.findFirst({
        where: { id: itemId, companyId, deletedAt: null },
      });

      if (!item) {
        throw new NotFoundException('Item not found');
      }

      // Find or create inventory record
      let inventory = await tx.inventory.findFirst({
        where: { warehouseId, itemId },
      });

      if (!inventory) {
        // Create new inventory record for INBOUND transactions
        if (type === 'OUTBOUND') {
          throw new BadRequestException(
            'Cannot create OUTBOUND transaction for non-existent inventory',
          );
        }

        inventory = await tx.inventory.create({
          data: {
            warehouseId,
            itemId,
            quantity: 0,
            lastRestockedAt: new Date(),
          },
        });
      }

      const currentQuantity = Number(inventory.quantity);
      let newQuantity: number;

      if (type === 'INBOUND') {
        // Add to inventory
        newQuantity = currentQuantity + quantity;

        // Check warehouse capacity
        const totalInventoryQuantity = await tx.inventory.aggregate({
          where: { warehouseId },
          _sum: { quantity: true },
        });

        const currentTotalQuantity = Number(totalInventoryQuantity._sum.quantity || 0);
        const warehouseCapacity = Number(warehouse.capacity);
        const projectedTotal = currentTotalQuantity - currentQuantity + newQuantity;

        if (projectedTotal > warehouseCapacity) {
          throw new BadRequestException(
            `Warehouse capacity exceeded. Available capacity: ${warehouseCapacity - currentTotalQuantity + currentQuantity}, requested: ${quantity}`,
          );
        }
      } else {
        // OUTBOUND - subtract from inventory
        newQuantity = currentQuantity - quantity;

        if (newQuantity < 0) {
          throw new BadRequestException(
            `Insufficient stock. Available: ${currentQuantity}, requested: ${quantity}`,
          );
        }
      }

      // Update inventory
      await tx.inventory.update({
        where: { id: inventory.id },
        data: {
          quantity: newQuantity,
          lastRestockedAt: type === 'INBOUND' ? new Date() : inventory.lastRestockedAt,
        },
      });

      // Create transaction record
      const transaction = await tx.transaction.create({
        data: {
          type,
          warehouseId,
          itemId,
          quantity,
          notes,
          createdBy: userId,
          companyId,
        },
        include: {
          warehouse: true,
          item: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      return transaction;
    }).then(async (transaction) => {
      // Create notification after transaction completes
      const transactionTypeKo = transaction.type === 'INBOUND' ? '반입' : '반출';
      await this.notificationsService.createForCompany(
        companyId,
        'TRANSACTION_CREATED',
        `${transactionTypeKo} 거래 발생`,
        `${transaction.warehouse.name}에서 ${transaction.item.name} ${quantity}${transaction.item.unitOfMeasure} ${transactionTypeKo} 처리되었습니다.`,
        transaction.id,
      );
      return transaction;
    });
  }

  async findAll(
    companyId: string,
    filters?: {
      type?: string;
      warehouseId?: string;
      itemId?: string;
      startDate?: Date;
      endDate?: Date;
      page?: number;
      limit?: number;
    },
  ) {
    const { type, warehouseId, itemId, startDate, endDate, page = 1, limit = 20 } = filters || {};

    const skip = (page - 1) * limit;

    const where: any = {
      companyId,
    };

    if (type) {
      where.type = type;
    }

    if (warehouseId) {
      where.warehouseId = warehouseId;
    }

    if (itemId) {
      where.itemId = itemId;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = startDate;
      }
      if (endDate) {
        where.createdAt.lte = endDate;
      }
    }

    const transactions = await this.prisma.transaction.findMany({
      where,
      include: {
        warehouse: {
          select: {
            id: true,
            name: true,
            location: true,
          },
        },
        item: {
          select: {
            id: true,
            sku: true,
            name: true,
            unitOfMeasure: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      skip,
      take: limit,
      orderBy: {
        createdAt: 'desc',
      },
    });

    return transactions;
  }

  async findOne(id: string, companyId: string) {
    const transaction = await this.prisma.transaction.findFirst({
      where: { id, companyId },
      include: {
        warehouse: {
          select: {
            id: true,
            name: true,
            location: true,
            capacity: true,
          },
        },
        item: {
          select: {
            id: true,
            sku: true,
            name: true,
            category: true,
            unitOfMeasure: true,
            description: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    return transaction;
  }
}
