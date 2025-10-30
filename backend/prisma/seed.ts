import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding...');

  // Clean existing data (optional - for development)
  console.log('Cleaning existing data...');
  await prisma.transaction.deleteMany();
  await prisma.inventory.deleteMany();
  await prisma.notificationRead.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.item.deleteMany();
  await prisma.warehouse.deleteMany();
  await prisma.inviteCode.deleteMany();
  await prisma.user.deleteMany();
  await prisma.company.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.account.deleteMany();
  await prisma.currency.deleteMany();
  console.log('Cleaned existing data');

  // Create currencies
  const currencies = await prisma.$transaction([
    prisma.currency.create({ data: { code: 'KRW', name: 'South Korean Won', symbol: '₩' } }),
    prisma.currency.create({ data: { code: 'USD', name: 'US Dollar', symbol: '$' } }),
    prisma.currency.create({ data: { code: 'EUR', name: 'Euro', symbol: '€' } }),
    prisma.currency.create({ data: { code: 'JPY', name: 'Japanese Yen', symbol: '¥' } }),
    prisma.currency.create({ data: { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' } }),
    prisma.currency.create({ data: { code: 'GBP', name: 'British Pound', symbol: '£' } }),
  ]);

  console.log('Created currencies:', currencies.length);

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

  // Create demo company
  const company = await prisma.company.create({
    data: {
      name: 'Demo Warehouse Inc',
      email: 'demo@warehouse.com',
      phone: '+82-2-1234-5678',
      address: 'Seoul, South Korea',
      maxUsers: 50,
    },
  });

  console.log('Created company:', company.name);

  // Create admin account and user for the company
  const adminAccount = await prisma.account.create({
    data: {
      email: 'admin@demo.com',
      password: await bcrypt.hash('password123', 12),
      user: {
        create: {
          name: 'Demo Admin',
          role: 'ADMIN',
          companyId: company.id,
        },
      },
    },
    include: {
      user: true,
    },
  });

  console.log('Created admin user:', adminAccount.email);

  // Create additional demo users
  const managerAccount = await prisma.account.create({
    data: {
      email: 'manager@demo.com',
      password: await bcrypt.hash('password123', 12),
      user: {
        create: {
          name: 'Demo Manager',
          role: 'MANAGER',
          companyId: company.id,
        },
      },
    },
    include: {
      user: true,
    },
  });

  console.log('Created manager user:', managerAccount.email);

  const userAccount = await prisma.account.create({
    data: {
      email: 'user@demo.com',
      password: await bcrypt.hash('password123', 12),
      user: {
        create: {
          name: 'Demo User',
          role: 'USER',
          companyId: company.id,
        },
      },
    },
    include: {
      user: true,
    },
  });

  console.log('Created regular user:', userAccount.email);

  // Create warehouses
  const mainWarehouse = await prisma.warehouse.create({
    data: {
      name: 'Main Warehouse',
      location: 'Seoul',
      capacity: 1000,
      companyId: company.id,
    },
  });

  const secondaryWarehouse = await prisma.warehouse.create({
    data: {
      name: 'Secondary Storage',
      location: 'Busan',
      capacity: 500,
      companyId: company.id,
    },
  });

  console.log('Created warehouses');

  // Create items
  // Currency IDs are auto-incremented: KRW=1, USD=2, EUR=3, JPY=4, CNY=5, GBP=6
  const krwCurrencyId = currencies.find(c => c.code === 'KRW')!.id;
  const usdCurrencyId = currencies.find(c => c.code === 'USD')!.id;

  const items = await prisma.$transaction([
    prisma.item.create({
      data: {
        sku: 'ITEM-001',
        name: 'Widget A',
        unitOfMeasure: 'EA',
        category: 'Parts',
        description: 'Standard widget for assembly',
        purchasePrice: 10000,
        purchasePriceCurrencyId: krwCurrencyId,
        salePrice: 15000,
        salePriceCurrencyId: krwCurrencyId,
        reorderThreshold: 50,
        companyId: company.id,
      },
    }),
    prisma.item.create({
      data: {
        sku: 'ITEM-002',
        name: 'Component B',
        unitOfMeasure: 'KG',
        category: 'Raw Materials',
        description: 'High-grade component material',
        purchasePrice: 50,
        purchasePriceCurrencyId: usdCurrencyId,
        salePrice: 75,
        salePriceCurrencyId: usdCurrencyId,
        reorderThreshold: 100,
        companyId: company.id,
      },
    }),
    prisma.item.create({
      data: {
        sku: 'ITEM-003',
        name: 'Product C',
        unitOfMeasure: 'EA',
        category: 'Finished Goods',
        description: 'Finished product ready for shipment',
        purchasePrice: 100000,
        purchasePriceCurrencyId: krwCurrencyId,
        salePrice: 150000,
        salePriceCurrencyId: krwCurrencyId,
        reorderThreshold: 20,
        companyId: company.id,
      },
    }),
  ]);

  console.log('Created items:', items.length);

  // Create inventory records
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
  const adminUser = adminAccount.user;
  if (!adminUser) {
    throw new Error('Admin user not created properly');
  }

  // Create transactions with nested items
  // Single-item transaction example
  await prisma.transaction.create({
    data: {
      type: 'INBOUND',
      notes: 'Initial stock - Widget A',
      createdBy: adminUser.id,
      companyId: company.id,
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
      items: {
        create: {
          warehouseId: mainWarehouse.id,
          itemId: items[0].id,
          quantity: 150,
        },
      },
    },
  });

  // Single-item transaction example
  await prisma.transaction.create({
    data: {
      type: 'INBOUND',
      notes: 'Initial stock - Component B',
      createdBy: adminUser.id,
      companyId: company.id,
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
      items: {
        create: {
          warehouseId: mainWarehouse.id,
          itemId: items[1].id,
          quantity: 200,
        },
      },
    },
  });

  // Multi-item transaction example - receiving multiple items at once
  await prisma.transaction.create({
    data: {
      type: 'INBOUND',
      notes: 'Bulk delivery from supplier',
      createdBy: adminUser.id,
      companyId: company.id,
      createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), // 4 days ago
      items: {
        create: [
          {
            warehouseId: mainWarehouse.id,
            itemId: items[0].id,
            quantity: 50,
          },
          {
            warehouseId: mainWarehouse.id,
            itemId: items[1].id,
            quantity: 100,
          },
          {
            warehouseId: secondaryWarehouse.id,
            itemId: items[2].id,
            quantity: 100,
          },
        ],
      },
    },
  });

  // Single-item transaction example
  await prisma.transaction.create({
    data: {
      type: 'OUTBOUND',
      notes: 'Shipped to customer',
      createdBy: adminUser.id,
      companyId: company.id,
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      items: {
        create: {
          warehouseId: secondaryWarehouse.id,
          itemId: items[2].id,
          quantity: 25,
        },
      },
    },
  });

  // Multi-item transaction example - shipping multiple items to different locations
  await prisma.transaction.create({
    data: {
      type: 'OUTBOUND',
      notes: 'Multiple orders fulfilled',
      createdBy: adminUser.id,
      companyId: company.id,
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      items: {
        create: [
          {
            warehouseId: mainWarehouse.id,
            itemId: items[0].id,
            quantity: 20,
          },
          {
            warehouseId: mainWarehouse.id,
            itemId: items[1].id,
            quantity: 30,
          },
        ],
      },
    },
  });

  console.log('Created sample transactions');

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
