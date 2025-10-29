import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { TransferInventoryDto } from './dto/transfer-inventory.dto';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class TransactionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async create(createTransactionDto: CreateTransactionDto, userId: string, companyId: string) {
    const { type, items, notes } = createTransactionDto;

    // Use database transaction to ensure atomicity
    return this.prisma
      .$transaction(async (tx) => {
        const transactionItems: any[] = [];
        const warehouseItemSummary: Map<string, { warehouseName: string; items: string[] }> = new Map();

        // Process each item
        for (const item of items) {
          const { warehouseId, itemId, quantity } = item;

          // Verify warehouse exists and belongs to company
          const warehouse = await tx.warehouse.findFirst({
            where: { id: warehouseId, companyId },
          });

          if (!warehouse) {
            throw new NotFoundException(`Warehouse not found: ${warehouseId}`);
          }

          // Verify item exists and belongs to company
          const itemData = await tx.item.findFirst({
            where: { id: itemId, companyId },
          });

          if (!itemData) {
            throw new NotFoundException(`Item not found: ${itemId}`);
          }

          // Find or create inventory record
          let inventory = await tx.inventory.findFirst({
            where: { warehouseId, itemId },
          });

          if (!inventory) {
            // Create new inventory record for INBOUND transactions
            if (type === 'OUTBOUND') {
              throw new BadRequestException(
                `Cannot create OUTBOUND transaction for non-existent inventory: ${itemData.name} at ${warehouse.name}`,
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
                `Warehouse capacity exceeded at ${warehouse.name}. Available capacity: ${warehouseCapacity - currentTotalQuantity + currentQuantity}, requested: ${quantity}`,
              );
            }
          } else {
            // OUTBOUND - subtract from inventory
            newQuantity = currentQuantity - quantity;

            if (newQuantity < 0) {
              throw new BadRequestException(
                `Insufficient stock for ${itemData.name} at ${warehouse.name}. Available: ${currentQuantity}, requested: ${quantity}`,
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

          // Prepare transaction item data
          transactionItems.push({
            warehouseId,
            itemId,
            quantity,
          });

          // Build summary for notification
          if (!warehouseItemSummary.has(warehouseId)) {
            warehouseItemSummary.set(warehouseId, {
              warehouseName: warehouse.name,
              items: [],
            });
          }
          warehouseItemSummary.get(warehouseId)!.items.push(
            `${itemData.name} ${quantity}${itemData.unitOfMeasure}`,
          );
        }

        // Create transaction record with items
        const transaction = await tx.transaction.create({
          data: {
            type,
            notes,
            createdBy: userId,
            companyId,
            items: {
              create: transactionItems,
            },
          },
          include: {
            items: {
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
              },
            },
            user: {
              select: {
                id: true,
                name: true,
                account: {
                  select: {
                    email: true,
                  },
                },
              },
            },
          },
        });

        return { transaction, warehouseItemSummary };
      })
      .then(async ({ transaction, warehouseItemSummary }) => {
        // Create notification after transaction completes
        const transactionTypeKo = transaction.type === 'INBOUND' ? '반입' : '반출';
        const itemCount = transaction.items.length;

        // Build notification message
        let message = '';
        if (itemCount === 1) {
          const item = transaction.items[0];
          message = `${item.warehouse.name}에서 ${item.item.name} ${item.quantity}${item.item.unitOfMeasure} ${transactionTypeKo} 처리되었습니다.`;
        } else {
          warehouseItemSummary.forEach((summary) => {
            const itemsList = summary.items.join(', ');
            message += `${summary.warehouseName}: ${itemsList}. `;
          });
          message = `${itemCount}건의 ${transactionTypeKo} 거래가 처리되었습니다. ${message}`;
        }

        await this.notificationsService.createForCompany(
          companyId,
          'TRANSACTION_CREATED',
          `${transactionTypeKo} 거래 발생`,
          message,
          transaction.id,
          userId, // Exclude the user who created the transaction
        );

        return {
          ...transaction,
          user: {
            id: transaction.user.id,
            name: transaction.user.name,
            email: transaction.user.account.email,
          },
        };
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

    // Filter by warehouse or item through transaction items
    if (warehouseId || itemId) {
      where.items = {
        some: {
          ...(warehouseId && { warehouseId }),
          ...(itemId && { itemId }),
        },
      };
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
        items: {
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
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            account: {
              select: {
                email: true,
              },
            },
          },
        },
      },
      skip,
      take: limit,
      orderBy: {
        createdAt: 'desc',
      },
    });

    return transactions.map((transaction) => ({
      ...transaction,
      user: {
        id: transaction.user.id,
        name: transaction.user.name,
        email: transaction.user.account.email,
      },
    }));
  }

  async findOne(id: string, companyId: string) {
    const transaction = await this.prisma.transaction.findFirst({
      where: { id, companyId },
      include: {
        items: {
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
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            role: true,
            account: {
              select: {
                email: true,
              },
            },
          },
        },
      },
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    return {
      ...transaction,
      user: {
        id: transaction.user.id,
        name: transaction.user.name,
        role: transaction.user.role,
        email: transaction.user.account.email,
      },
    };
  }

  async transfer(transferDto: TransferInventoryDto, userId: string, companyId: string) {
    const { fromWarehouseId, toWarehouseId, itemId, quantity, notes } = transferDto;

    // Validate that source and destination are different
    if (fromWarehouseId === toWarehouseId) {
      throw new BadRequestException('출발 창고와 도착 창고가 같을 수 없습니다.');
    }

    // Use database transaction to ensure atomicity
    return this.prisma
      .$transaction(async (tx) => {
        // Verify both warehouses exist and belong to company
        const fromWarehouse = await tx.warehouse.findFirst({
          where: { id: fromWarehouseId, companyId },
        });

        if (!fromWarehouse) {
          throw new NotFoundException(`출발 창고를 찾을 수 없습니다: ${fromWarehouseId}`);
        }

        const toWarehouse = await tx.warehouse.findFirst({
          where: { id: toWarehouseId, companyId },
        });

        if (!toWarehouse) {
          throw new NotFoundException(`도착 창고를 찾을 수 없습니다: ${toWarehouseId}`);
        }

        // Verify item exists and belongs to company
        const item = await tx.item.findFirst({
          where: { id: itemId, companyId },
        });

        if (!item) {
          throw new NotFoundException(`아이템을 찾을 수 없습니다: ${itemId}`);
        }

        // Check inventory availability in source warehouse
        const fromInventory = await tx.inventory.findFirst({
          where: { warehouseId: fromWarehouseId, itemId },
        });

        if (!fromInventory) {
          throw new BadRequestException(
            `${fromWarehouse.name}에 ${item.name}의 재고가 없습니다.`,
          );
        }

        const currentQuantity = Number(fromInventory.quantity);

        if (currentQuantity < quantity) {
          throw new BadRequestException(
            `${fromWarehouse.name}에 ${item.name}의 재고가 부족합니다. 현재 재고: ${currentQuantity}, 요청 수량: ${quantity}`,
          );
        }

        // Update source warehouse inventory (decrement)
        await tx.inventory.update({
          where: { id: fromInventory.id },
          data: {
            quantity: currentQuantity - quantity,
          },
        });

        // Find or create destination warehouse inventory
        let toInventory = await tx.inventory.findFirst({
          where: { warehouseId: toWarehouseId, itemId },
        });

        if (toInventory) {
          // Update existing inventory (increment)
          const toCurrentQuantity = Number(toInventory.quantity);
          await tx.inventory.update({
            where: { id: toInventory.id },
            data: {
              quantity: toCurrentQuantity + quantity,
              lastRestockedAt: new Date(),
            },
          });
        } else {
          // Create new inventory record
          toInventory = await tx.inventory.create({
            data: {
              warehouseId: toWarehouseId,
              itemId,
              quantity,
              lastRestockedAt: new Date(),
            },
          });
        }

        // Check destination warehouse capacity
        const totalInventoryQuantity = await tx.inventory.aggregate({
          where: { warehouseId: toWarehouseId },
          _sum: { quantity: true },
        });

        const totalQuantity = Number(totalInventoryQuantity._sum.quantity || 0);
        const warehouseCapacity = Number(toWarehouse.capacity);

        if (totalQuantity > warehouseCapacity) {
          throw new BadRequestException(
            `${toWarehouse.name}의 용량을 초과했습니다. 창고 용량: ${warehouseCapacity}, 현재 총 재고: ${totalQuantity}`,
          );
        }

        // Create TRANSFER transaction with two items (negative and positive quantities)
        const transaction = await tx.transaction.create({
          data: {
            type: 'TRANSFER',
            notes,
            createdBy: userId,
            companyId,
            items: {
              create: [
                {
                  warehouseId: fromWarehouseId,
                  itemId,
                  quantity: -quantity, // Negative for source
                },
                {
                  warehouseId: toWarehouseId,
                  itemId,
                  quantity, // Positive for destination
                },
              ],
            },
          },
          include: {
            items: {
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
              },
            },
            user: {
              select: {
                id: true,
                name: true,
                account: {
                  select: {
                    email: true,
                  },
                },
              },
            },
          },
        });

        return { transaction, fromWarehouse, toWarehouse, item };
      })
      .then(async ({ transaction, fromWarehouse, toWarehouse, item }) => {
        // Create notification after transaction completes
        const message = `${item.name} ${quantity}${item.unitOfMeasure}이(가) ${fromWarehouse.name}에서 ${toWarehouse.name}로 이동되었습니다.`;

        await this.notificationsService.createForCompany(
          companyId,
          'TRANSACTION_CREATED',
          '재고 이동',
          message,
          transaction.id,
          userId,
        );

        return {
          ...transaction,
          user: {
            id: transaction.user.id,
            name: transaction.user.name,
            email: transaction.user.account.email,
          },
        };
      });
  }
}
