import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding...');

  // Create super admin account and user (no company association)
  const superAdminAccount = await prisma.account.create({
    data: {
      email: 'superadmin@system.com',
      password: await bcrypt.hash('admin123', 12),
      user: {
        create: {
          name: 'Super Administrator',
          role: 'SUPER_ADMIN',
          companyId: null,
        },
      },
    },
    include: {
      user: true,
    },
  });

  console.log('Created super admin:', superAdminAccount.email);

  // Create demo company with admin user
  const company = await prisma.company.create({
    data: {
      name: 'Demo Warehouse Inc',
      email: 'demo@warehouse.com',
      phone: '+82-2-1234-5678',
      address: 'Seoul, South Korea',
      users: {
        create: {
          name: 'Demo Admin',
          role: 'ADMIN',
          account: {
            create: {
              email: 'admin@demo.com',
              password: await bcrypt.hash('password123', 12),
            },
          },
        },
      },
      warehouses: {
        create: [
          {
            name: 'Main Warehouse',
            location: 'Seoul',
            capacity: 1000,
          },
          {
            name: 'Secondary Storage',
            location: 'Busan',
            capacity: 500,
          },
        ],
      },
      items: {
        create: [
          {
            sku: 'ITEM-001',
            name: 'Widget A',
            unitOfMeasure: 'EA',
            category: 'Parts',
            description: 'Standard widget for assembly',
            reorderThreshold: 50,
          },
          {
            sku: 'ITEM-002',
            name: 'Component B',
            unitOfMeasure: 'KG',
            category: 'Raw Materials',
            description: 'High-grade component material',
            reorderThreshold: 100,
          },
          {
            sku: 'ITEM-003',
            name: 'Product C',
            unitOfMeasure: 'EA',
            category: 'Finished Goods',
            description: 'Finished product ready for shipment',
            reorderThreshold: 20,
          },
        ],
      },
    },
    include: {
      warehouses: true,
      items: true,
      users: true,
    },
  });

  console.log('Created company:', company.name);

  // Create inventory records
  const mainWarehouse = company.warehouses.find((w) => w.name === 'Main Warehouse');
  const secondaryWarehouse = company.warehouses.find((w) => w.name === 'Secondary Storage');
  const items = company.items;

  if (mainWarehouse && secondaryWarehouse && items.length > 0) {
    await prisma.inventory.createMany({
      data: [
        {
          warehouseId: mainWarehouse.id,
          itemId: items[0].id,
          quantity: 150,
          lastRestockedAt: new Date(),
        },
        {
          warehouseId: mainWarehouse.id,
          itemId: items[1].id,
          quantity: 200,
          lastRestockedAt: new Date(),
        },
        {
          warehouseId: secondaryWarehouse.id,
          itemId: items[2].id,
          quantity: 75,
          lastRestockedAt: new Date(),
        },
      ],
    });

    console.log('Created inventory records');

    // Create sample transactions
    const adminUser = company.users[0];

    await prisma.transaction.createMany({
      data: [
        {
          type: 'INBOUND',
          warehouseId: mainWarehouse.id,
          itemId: items[0].id,
          quantity: 150,
          notes: 'Initial stock',
          createdBy: adminUser.id,
          companyId: company.id,
          createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        },
        {
          type: 'INBOUND',
          warehouseId: mainWarehouse.id,
          itemId: items[1].id,
          quantity: 200,
          notes: 'Initial stock',
          createdBy: adminUser.id,
          companyId: company.id,
          createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
        },
        {
          type: 'INBOUND',
          warehouseId: secondaryWarehouse.id,
          itemId: items[2].id,
          quantity: 100,
          notes: 'Initial stock',
          createdBy: adminUser.id,
          companyId: company.id,
          createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        },
        {
          type: 'OUTBOUND',
          warehouseId: secondaryWarehouse.id,
          itemId: items[2].id,
          quantity: 25,
          notes: 'Shipped to customer',
          createdBy: adminUser.id,
          companyId: company.id,
          createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        },
      ],
    });

    console.log('Created sample transactions');
  }

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
