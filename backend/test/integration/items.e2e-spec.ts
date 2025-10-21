import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';
import * as bcrypt from 'bcrypt';

describe('ItemsController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authToken: string;
  let companyId: string;
  let itemId: string;

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
        name: 'Test Items Company',
        email: 'items@test.com',
        phone: '+82-2-2222-2222',
        address: 'Test Address',
        users: {
          create: {
            email: 'items@test.com',
            password: await bcrypt.hash('password123', 12),
            name: 'Items Tester',
            role: 'ADMIN',
          },
        },
      },
      include: { users: true },
    });

    companyId = company.id;

    // Login to get auth token
    const loginResponse = await request(app.getHttpServer()).post('/auth/login').send({
      email: 'items@test.com',
      password: 'password123',
    });

    authToken = loginResponse.body.accessToken;
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.item.deleteMany({ where: { companyId } });
    await prisma.user.deleteMany({ where: { companyId } });
    await prisma.company.delete({ where: { id: companyId } });

    await app.close();
  });

  describe('POST /items', () => {
    it('should create a new item', async () => {
      const response = await request(app.getHttpServer())
        .post('/items')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          sku: 'TEST-001',
          name: 'Test Item',
          category: 'Test Category',
          unitOfMeasure: 'EA',
          description: 'Test item description',
          reorderThreshold: 10,
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.sku).toBe('TEST-001');
      expect(response.body.name).toBe('Test Item');
      expect(response.body.category).toBe('Test Category');
      expect(response.body.unitOfMeasure).toBe('EA');
      expect(response.body.reorderThreshold).toBe(10);

      itemId = response.body.id;
    });

    it('should reject duplicate SKU', async () => {
      await request(app.getHttpServer())
        .post('/items')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          sku: 'TEST-001', // Same SKU
          name: 'Another Item',
          category: 'Test',
          unitOfMeasure: 'EA',
          reorderThreshold: 5,
        })
        .expect(400);
    });

    it('should reject invalid data', async () => {
      await request(app.getHttpServer())
        .post('/items')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          sku: '', // Empty SKU
          name: 'Test',
        })
        .expect(400);
    });
  });

  describe('GET /items', () => {
    it('should return list of items', async () => {
      const response = await request(app.getHttpServer())
        .get('/items')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0]).toHaveProperty('id');
      expect(response.body[0]).toHaveProperty('sku');
      expect(response.body[0]).toHaveProperty('name');
    });

    it('should support pagination', async () => {
      const response = await request(app.getHttpServer())
        .get('/items?page=1&limit=5')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeLessThanOrEqual(5);
    });

    it('should support search', async () => {
      const response = await request(app.getHttpServer())
        .get('/items?search=Test')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      response.body.forEach((item: any) => {
        const matchesSearch =
          item.name.toLowerCase().includes('test') ||
          item.sku.toLowerCase().includes('test') ||
          item.category?.toLowerCase().includes('test');
        expect(matchesSearch).toBe(true);
      });
    });

    it('should filter by category', async () => {
      const response = await request(app.getHttpServer())
        .get('/items?category=Test Category')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      response.body.forEach((item: any) => {
        expect(item.category).toBe('Test Category');
      });
    });
  });

  describe('GET /items/:id', () => {
    it('should return item details', async () => {
      const response = await request(app.getHttpServer())
        .get(`/items/${itemId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.id).toBe(itemId);
      expect(response.body.sku).toBe('TEST-001');
      expect(response.body).toHaveProperty('totalQuantity');
    });

    it('should return 404 for non-existent item', async () => {
      await request(app.getHttpServer())
        .get('/items/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('PATCH /items/:id', () => {
    it('should update item', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/items/${itemId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Updated Test Item',
          reorderThreshold: 15,
        })
        .expect(200);

      expect(response.body.name).toBe('Updated Test Item');
      expect(response.body.reorderThreshold).toBe(15);
      expect(response.body.sku).toBe('TEST-001'); // SKU unchanged
    });

    it('should not update SKU to duplicate', async () => {
      // Create another item first
      await request(app.getHttpServer())
        .post('/items')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          sku: 'TEST-002',
          name: 'Another Item',
          category: 'Test',
          unitOfMeasure: 'KG',
          reorderThreshold: 5,
        });

      // Try to update first item's SKU to duplicate
      await request(app.getHttpServer())
        .patch(`/items/${itemId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          sku: 'TEST-002',
        })
        .expect(400);
    });
  });

  describe('DELETE /items/:id', () => {
    it('should soft delete item', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/items/${itemId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('deletedAt');
      expect(response.body.deletedAt).not.toBeNull();

      // Verify item is not in list
      const listResponse = await request(app.getHttpServer())
        .get('/items')
        .set('Authorization', `Bearer ${authToken}`);

      const deletedItem = listResponse.body.find((item: any) => item.id === itemId);
      expect(deletedItem).toBeUndefined();
    });

    it('should return 404 for non-existent item', async () => {
      await request(app.getHttpServer())
        .delete('/items/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('Authentication', () => {
    it('should reject requests without auth token', async () => {
      await request(app.getHttpServer()).get('/items').expect(401);

      await request(app.getHttpServer())
        .post('/items')
        .send({
          sku: 'TEST-999',
          name: 'Test',
          category: 'Test',
          unitOfMeasure: 'EA',
          reorderThreshold: 10,
        })
        .expect(401);
    });
  });
});
