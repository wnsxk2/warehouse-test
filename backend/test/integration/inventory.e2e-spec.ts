import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';

describe('Inventory (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authToken: string;
  let warehouseId: string;
  let itemId: string;
  let inventoryId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);

    // Login to get auth token
    const loginResponse = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        email: 'admin@demo.com',
        password: 'password123',
      })
      .expect(200);

    authToken = loginResponse.body.accessToken;

    // Get user's company to create test data
    const account = await prisma.account.findUnique({
      where: { email: 'admin@demo.com' },
      include: { user: true },
    });
    const user = account?.user;

    // Create a test warehouse
    const warehouse = await prisma.warehouse.create({
      data: {
        name: 'Inventory Test Warehouse',
        location: 'Test Location',
        capacity: 1000,
        companyId: user!.companyId!,
      },
    });
    warehouseId = warehouse.id;

    // Create a test item
    const item = await prisma.item.create({
      data: {
        name: 'Test Item',
        sku: 'TEST-001',
        category: 'Electronics',
        unitOfMeasure: 'pcs',
        companyId: user!.companyId!,
      },
    });
    itemId = item.id;
  });

  afterAll(async () => {
    // Clean up created data
    if (inventoryId) {
      await prisma.inventory.deleteMany({ where: { id: inventoryId } });
    }
    if (itemId) {
      await prisma.item.delete({ where: { id: itemId } });
    }
    if (warehouseId) {
      await prisma.warehouse.delete({ where: { id: warehouseId } });
    }
    await app.close();
  });

  describe('POST /api/inventory', () => {
    it('should create inventory (assign item to warehouse)', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/inventory')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          warehouseId,
          itemId,
          quantity: 100,
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.warehouseId).toBe(warehouseId);
      expect(response.body.itemId).toBe(itemId);
      expect(response.body.quantity).toBe(100);

      inventoryId = response.body.id;
    });

    it('should return 401 without authentication', async () => {
      await request(app.getHttpServer())
        .post('/api/inventory')
        .send({
          warehouseId,
          itemId,
          quantity: 50,
        })
        .expect(401);
    });

    it('should return 400 with invalid data', async () => {
      await request(app.getHttpServer())
        .post('/api/inventory')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          warehouseId,
          // Missing itemId
          quantity: 50,
        })
        .expect(400);
    });

    it('should prevent exceeding warehouse capacity', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/inventory')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          warehouseId,
          itemId,
          quantity: 2000, // Exceeds capacity of 1000
        });

      expect(response.status).toBeGreaterThanOrEqual(400);
    });

    it('should prevent duplicate item in same warehouse', async () => {
      // First item already created in previous test
      const response = await request(app.getHttpServer())
        .post('/api/inventory')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          warehouseId,
          itemId, // Same item
          quantity: 50,
        });

      expect(response.status).toBeGreaterThanOrEqual(400);
    });
  });

  describe('PATCH /api/inventory/:id', () => {
    it('should update inventory quantity', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/inventory/${inventoryId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          quantity: 150,
        })
        .expect(200);

      expect(response.body.quantity).toBe(150);
    });

    it('should return 404 for non-existent inventory', async () => {
      await request(app.getHttpServer())
        .patch('/api/inventory/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          quantity: 100,
        })
        .expect(404);
    });

    it('should validate quantity constraints', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/inventory/${inventoryId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          quantity: -10, // Negative quantity
        });

      expect(response.status).toBeGreaterThanOrEqual(400);
    });
  });

  describe('GET /api/warehouses/:id/inventory', () => {
    it('should get all inventory for a warehouse', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/warehouses/${warehouseId}/inventory`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);

      const inventory = response.body[0];
      expect(inventory).toHaveProperty('id');
      expect(inventory).toHaveProperty('quantity');
      expect(inventory).toHaveProperty('item');
      expect(inventory.item).toHaveProperty('name');
      expect(inventory.item).toHaveProperty('sku');
    });

    it('should return empty array for warehouse with no inventory', async () => {
      // Create a new empty warehouse
      const account = await prisma.account.findUnique({
        where: { email: 'admin@demo.com' },
        include: { user: true },
      });
      const user = account?.user;

      const emptyWarehouse = await prisma.warehouse.create({
        data: {
          name: 'Empty Warehouse',
          location: 'Empty Location',
          capacity: 500,
          companyId: user!.companyId!,
        },
      });

      const response = await request(app.getHttpServer())
        .get(`/api/warehouses/${emptyWarehouse.id}/inventory`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(0);

      // Clean up
      await prisma.warehouse.delete({ where: { id: emptyWarehouse.id } });
    });
  });
});
