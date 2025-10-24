import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DashboardStatsDto, RecentTransactionDto } from './dto/dashboard-stats.dto';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getStats(companyId: string): Promise<DashboardStatsDto> {
    // Get total warehouses
    const totalWarehouses = await this.prisma.warehouse.count({
      where: {
        companyId,
      },
    });

    // Get total items
    const totalItems = await this.prisma.item.count({
      where: {
        companyId,
      },
    });

    // Get low stock items (items where total quantity <= reorderThreshold)
    const items = await this.prisma.item.findMany({
      where: {
        companyId,
        reorderThreshold: { not: null },
      },
      include: {
        inventory: {
          select: {
            quantity: true,
          },
        },
      },
    });

    const lowStockItems = items.filter((item) => {
      const totalQuantity = item.inventory.reduce((sum, inv) => sum + Number(inv.quantity), 0);
      return item.reorderThreshold && totalQuantity <= item.reorderThreshold;
    }).length;

    // Get total transactions count (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const totalTransactions = await this.prisma.transaction.count({
      where: {
        companyId,
        createdAt: {
          gte: thirtyDaysAgo,
        },
      },
    });

    return {
      totalWarehouses,
      totalItems,
      lowStockItems,
      totalTransactions,
    };
  }

  async getRecentTransactions(companyId: string): Promise<RecentTransactionDto[]> {
    const transactions = await this.prisma.transaction.findMany({
      where: { companyId },
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        items: {
          include: {
            warehouse: {
              select: {
                id: true,
                name: true,
              },
            },
            item: {
              select: {
                id: true,
                name: true,
                sku: true,
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // For dashboard, show only the first item for multi-item transactions
    return transactions
      .filter((t) => t.items.length > 0)
      .map((t) => {
        const firstItem = t.items[0];
        return {
          id: t.id,
          type: t.type,
          quantity: Number(firstItem.quantity),
          notes: t.notes || undefined,
          createdAt: t.createdAt,
          warehouse: firstItem.warehouse,
          item: firstItem.item,
          user: t.user,
        };
      });
  }
}
