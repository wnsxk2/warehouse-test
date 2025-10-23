import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient, Prisma } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
    this.registerHistoryMiddleware();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  private registerHistoryMiddleware() {
    // Middleware for UPDATE operations
    this.$use(async (params, next) => {
      const historyModels = ['item', 'warehouse', 'user', 'account', 'company'];

      if (params.model && historyModels.includes(params.model.toLowerCase()) && params.action === 'update') {
        // Fetch current data before update
        const modelName = params.model.toLowerCase();
        const currentData = await (this as any)[modelName].findUnique({
          where: params.args.where,
        });

        if (currentData) {
          // Record history
          await this.saveHistory(params.model, currentData, 'UPDATE');
        }
      }

      return next(params);
    });

    // Middleware for DELETE operations
    this.$use(async (params, next) => {
      const historyModels = ['item', 'warehouse', 'user', 'account', 'company'];

      if (params.model && historyModels.includes(params.model.toLowerCase()) &&
          (params.action === 'delete' || params.action === 'deleteMany')) {
        const modelName = params.model.toLowerCase();

        // For single delete
        if (params.action === 'delete') {
          const currentData = await (this as any)[modelName].findUnique({
            where: params.args.where,
          });

          if (currentData) {
            await this.saveHistory(params.model, currentData, 'DELETE');
          }
        }

        // For deleteMany
        if (params.action === 'deleteMany') {
          const records = await (this as any)[modelName].findMany({
            where: params.args.where,
          });

          for (const record of records) {
            await this.saveHistory(params.model, record, 'DELETE');
          }
        }
      }

      return next(params);
    });
  }

  private async saveHistory(modelName: string, data: any, operation: 'CREATE' | 'UPDATE' | 'DELETE') {
    const historyModelMap: Record<string, string> = {
      Item: 'itemHistory',
      Warehouse: 'warehouseHistory',
      User: 'userHistory',
      Account: 'accountHistory',
      Company: 'companyHistory',
    };

    const historyModel = historyModelMap[modelName];
    if (!historyModel) return;

    try {
      const historyData: any = {
        originalId: data.id,
        operation,
        changedAt: new Date(),
      };

      // Copy all fields except internal ones
      switch (modelName) {
        case 'Item':
          historyData.sku = data.sku;
          historyData.name = data.name;
          historyData.category = data.category;
          historyData.unitOfMeasure = data.unitOfMeasure;
          historyData.description = data.description;
          historyData.reorderThreshold = data.reorderThreshold;
          historyData.companyId = data.companyId;
          break;

        case 'Warehouse':
          historyData.name = data.name;
          historyData.location = data.location;
          historyData.capacity = data.capacity;
          historyData.companyId = data.companyId;
          break;

        case 'User':
          historyData.accountId = data.accountId;
          historyData.name = data.name;
          historyData.role = data.role;
          historyData.companyId = data.companyId;
          break;

        case 'Account':
          historyData.email = data.email;
          historyData.isActive = data.isActive;
          historyData.lastLoginAt = data.lastLoginAt;
          break;

        case 'Company':
          historyData.name = data.name;
          historyData.email = data.email;
          historyData.phone = data.phone;
          historyData.address = data.address;
          historyData.maxUsers = data.maxUsers;
          break;
      }

      await (this as any)[historyModel].create({
        data: historyData,
      });
    } catch (error) {
      console.error(`Failed to save history for ${modelName}:`, error);
    }
  }
}
