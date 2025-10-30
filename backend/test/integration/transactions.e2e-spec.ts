import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';
import * as bcrypt from 'bcrypt';

describe('TransactionsController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authToken: string;
  let companyId: string;
  let warehouseId: string;
  let itemId: string;
  let inventoryId: string;
  let transactionId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);

    // Create test company with user
    const company = await prisma.company.create({
      data: {
        name: 'Test Transaction Company',
        email: 'transaction@test.com',
        phone: '+82-2-1111-1111',
        address: 'Test Address',
        users: {
          create: {
            name: 'Transaction Tester',
            role: 'ADMIN',
            account: {
              create: {
                email: 'transaction@test.com',
                password: await bcrypt.hash('password123', 12),
              },
            },
          },
        },
      },
      include: { users: true },
    });

    companyId = company.id;

    // Login to get auth token
    const loginResponse = await request(app.getHttpServer()).post('/auth/login').send({
      email: 'transaction@test.com',
      password: 'password123',
    });

    authToken = loginResponse.body.accessToken;

    // Create warehouse
    const warehouse = await prisma.warehouse.create({
      data: {
        name: 'Transaction Test Warehouse',
        location: 'Test Location',
        capacity: 1000,
        companyId,
      },
    });

    warehouseId = warehouse.id;

    // Create item
    const item = await prisma.item.create({
      data: {
        sku: 'TX-001',
        name: 'Transaction Test Item',
        unitOfMeasure: 'EA',
        category: 'Test',
        description: 'Test item for transactions',
        reorderThreshold: 10,
        companyId,
        purchasePriceCurrencyId: 1,
        salePriceCurrencyId: 1,
      },
    });

    itemId = item.id;

    // Create inventory with initial stock
    const inventory = await prisma.inventory.create({
      data: {
        warehouseId,
        itemId,
        quantity: 100,
        lastRestockedAt: new Date(),
      },
    });

    inventoryId = inventory.id;
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.transaction.deleteMany({ where: { companyId } });
    await prisma.inventory.deleteMany({ where: { warehouseId } });
    await prisma.item.deleteMany({ where: { companyId } });
    await prisma.warehouse.deleteMany({ where: { companyId } });
    await prisma.user.deleteMany({ where: { companyId } });
    await prisma.company.delete({ where: { id: companyId } });

    await app.close();
  });

  describe('POST /transactions', () => {
    it('should create an INBOUND transaction', async () => {
      const response = await request(app.getHttpServer())
        .post('/transactions')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          type: 'INBOUND',
          warehouseId,
          itemId,
          quantity: 50,
          notes: 'Inbound test transaction',
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.type).toBe('INBOUND');
      expect(response.body.quantity).toBe(50);
      expect(response.body.warehouseId).toBe(warehouseId);
      expect(response.body.itemId).toBe(itemId);

      transactionId = response.body.id;

      // Verify inventory was updated
      const updatedInventory = await prisma.inventory.findUnique({
        where: { id: inventoryId },
      });
      expect(Number(updatedInventory!.quantity)).toBe(150); // 100 + 50
    });

    it('should create an OUTBOUND transaction', async () => {
      const response = await request(app.getHttpServer())
        .post('/transactions')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          type: 'OUTBOUND',
          warehouseId,
          itemId,
          quantity: 30,
          notes: 'Outbound test transaction',
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.type).toBe('OUTBOUND');
      expect(response.body.quantity).toBe(30);

      // Verify inventory was updated
      const updatedInventory = await prisma.inventory.findUnique({
        where: { id: inventoryId },
      });
      expect(Number(updatedInventory!.quantity)).toBe(120); // 150 - 30
    });

    it('should reject OUTBOUND transaction if insufficient stock', async () => {
      await request(app.getHttpServer())
        .post('/transactions')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          type: 'OUTBOUND',
          warehouseId,
          itemId,
          quantity: 500, // More than available
          notes: 'Should fail',
        })
        .expect(400);
    });

    it('should reject transaction with invalid type', async () => {
      await request(app.getHttpServer())
        .post('/transactions')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          type: 'INVALID',
          warehouseId,
          itemId,
          quantity: 10,
        })
        .expect(400);
    });
  });

  describe('GET /transactions', () => {
    it('should return list of transactions', async () => {
      const response = await request(app.getHttpServer())
        .get('/transactions')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0]).toHaveProperty('id');
      expect(response.body[0]).toHaveProperty('type');
      expect(response.body[0]).toHaveProperty('warehouse');
      expect(response.body[0]).toHaveProperty('item');
    });

    it('should filter transactions by type', async () => {
      const response = await request(app.getHttpServer())
        .get('/transactions?type=INBOUND')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      response.body.forEach((transaction: any) => {
        expect(transaction.type).toBe('INBOUND');
      });
    });

    it('should filter transactions by warehouseId', async () => {
      const response = await request(app.getHttpServer())
        .get(`/transactions?warehouseId=${warehouseId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      response.body.forEach((transaction: any) => {
        expect(transaction.warehouseId).toBe(warehouseId);
      });
    });

    it('should filter transactions by itemId', async () => {
      const response = await request(app.getHttpServer())
        .get(`/transactions?itemId=${itemId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      response.body.forEach((transaction: any) => {
        expect(transaction.itemId).toBe(itemId);
      });
    });
  });

  describe('GET /transactions/:id', () => {
    it('should return transaction details', async () => {
      const response = await request(app.getHttpServer())
        .get(`/transactions/${transactionId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.id).toBe(transactionId);
      expect(response.body).toHaveProperty('warehouse');
      expect(response.body).toHaveProperty('item');
      expect(response.body).toHaveProperty('user');
      expect(response.body.warehouse.name).toBe('Transaction Test Warehouse');
      expect(response.body.item.name).toBe('Transaction Test Item');
    });

    it('should return 404 for non-existent transaction', async () => {
      await request(app.getHttpServer())
        .get('/transactions/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('Authentication', () => {
    it('should reject requests without auth token', async () => {
      await request(app.getHttpServer()).get('/transactions').expect(401);

      await request(app.getHttpServer())
        .post('/transactions')
        .send({
          type: 'INBOUND',
          warehouseId,
          itemId,
          quantity: 10,
        })
        .expect(401);
    });
  });
});
