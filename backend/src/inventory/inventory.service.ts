import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInventoryDto } from './dto/create-inventory.dto';
import { UpdateInventoryDto } from './dto/update-inventory.dto';

@Injectable()
export class InventoryService {
  constructor(private prisma: PrismaService) {}

  async create(createInventoryDto: CreateInventoryDto, companyId: string) {
    const { warehouseId, itemId, quantity } = createInventoryDto;

    // Verify warehouse exists and belongs to company
    const warehouse = await this.prisma.warehouse.findFirst({
      where: {
        id: warehouseId,
        companyId,
        
      },
      include: {
        inventory: true,
      },
    });

    if (!warehouse) {
      throw new NotFoundException(`Warehouse with ID ${warehouseId} not found`);
    }

    // Verify item exists and belongs to company
    const item = await this.prisma.item.findFirst({
      where: {
        id: itemId,
        companyId,
        
      },
    });

    if (!item) {
      throw new NotFoundException(`Item with ID ${itemId} not found`);
    }

    // Check if item already assigned to this warehouse
    const existingInventory = await this.prisma.inventory.findFirst({
      where: {
        warehouseId,
        itemId,
      },
    });

    if (existingInventory) {
      throw new ConflictException('Item is already assigned to this warehouse');
    }

    // Check warehouse capacity
    const currentTotalQuantity = warehouse.inventory.reduce(
      (sum, inv) => sum + Number(inv.quantity),
      0,
    );

    const warehouseCapacity = Number(warehouse.capacity);

    if (currentTotalQuantity + quantity > warehouseCapacity) {
      throw new BadRequestException(
        `Adding ${quantity} items would exceed warehouse capacity of ${warehouseCapacity}`,
      );
    }

    // Create inventory
    const inventory = await this.prisma.inventory.create({
      data: {
        warehouseId,
        itemId,
        quantity,
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
        warehouse: {
          select: {
            id: true,
            name: true,
            location: true,
          },
        },
      },
    });

    return inventory;
  }

  async update(id: string, updateInventoryDto: UpdateInventoryDto, companyId: string) {
    // Get inventory with warehouse and item info
    const inventory = await this.prisma.inventory.findFirst({
      where: { id },
      include: {
        warehouse: true,
        item: true,
      },
    });

    if (!inventory) {
      throw new NotFoundException(`Inventory with ID ${id} not found`);
    }

    // Verify warehouse belongs to company
    if (inventory.warehouse.companyId !== companyId) {
      throw new NotFoundException(`Inventory with ID ${id} not found`);
    }

    const { quantity } = updateInventoryDto;

    // If quantity is being updated, check warehouse capacity
    const currentQuantity = Number(inventory.quantity);
    if (quantity !== undefined && quantity !== currentQuantity) {
      const warehouse = await this.prisma.warehouse.findUnique({
        where: { id: inventory.warehouseId },
        include: {
          inventory: true,
        },
      });

      const otherInventoryQuantity = warehouse!.inventory
        .filter((inv) => inv.id !== id)
        .reduce((sum, inv) => sum + Number(inv.quantity), 0);

      const warehouseCapacity = Number(warehouse!.capacity);

      if (otherInventoryQuantity + quantity > warehouseCapacity) {
        throw new BadRequestException(
          `Updating quantity to ${quantity} would exceed warehouse capacity of ${warehouseCapacity}`,
        );
      }
    }

    // Validate quantity is not negative
    if (quantity !== undefined && quantity < 0) {
      throw new BadRequestException('Quantity cannot be negative');
    }

    // Update inventory
    const updatedInventory = await this.prisma.inventory.update({
      where: { id },
      data: {
        quantity,
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
        warehouse: {
          select: {
            id: true,
            name: true,
            location: true,
          },
        },
      },
    });

    return updatedInventory;
  }

  async findByWarehouse(warehouseId: string, companyId: string) {
    // Verify warehouse exists and belongs to company
    const warehouse = await this.prisma.warehouse.findFirst({
      where: {
        id: warehouseId,
        companyId,
        
      },
    });

    if (!warehouse) {
      throw new NotFoundException(`Warehouse with ID ${warehouseId} not found`);
    }

    // Get all inventory for the warehouse
    const inventory = await this.prisma.inventory.findMany({
      where: {
        warehouseId,
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
