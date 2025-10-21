import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';

describe('Warehouses (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authToken: string;
  let warehouseId: string;

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
  });

  afterAll(async () => {
    // Clean up created warehouses
    if (warehouseId) {
      await prisma.warehouse.deleteMany({
        where: { id: warehouseId },
      });
    }
    await app.close();
  });

  describe('POST /api/warehouses', () => {
    it('should create a new warehouse', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/warehouses')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Warehouse',
          location: 'Seoul, Korea',
          capacity: 1000,
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe('Test Warehouse');
      expect(response.body.location).toBe('Seoul, Korea');
      expect(response.body.capacity).toBe(1000);
      expect(response.body).toHaveProperty('companyId');

      warehouseId = response.body.id;
    });

    it('should return 401 without authentication', async () => {
      await request(app.getHttpServer())
        .post('/api/warehouses')
        .send({
          name: 'Unauthorized Warehouse',
          location: 'Seoul',
          capacity: 500,
        })
        .expect(401);
    });

    it('should return 400 with invalid data', async () => {
      await request(app.getHttpServer())
        .post('/api/warehouses')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: '', // Empty name
          location: 'Seoul',
        })
        .expect(400);
    });
  });

  describe('GET /api/warehouses', () => {
    it('should return list of warehouses', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/warehouses')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      if (response.body.length > 0) {
        const warehouse = response.body[0];
        expect(warehouse).toHaveProperty('id');
        expect(warehouse).toHaveProperty('name');
        expect(warehouse).toHaveProperty('location');
        expect(warehouse).toHaveProperty('capacity');
      }
    });

    it('should return 401 without authentication', async () => {
      await request(app.getHttpServer()).get('/api/warehouses').expect(401);
    });

    it('should support pagination', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/warehouses?page=1&limit=10')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('GET /api/warehouses/:id', () => {
    it('should return warehouse by id', async () => {
      // First create a warehouse
      const createResponse = await request(app.getHttpServer())
        .post('/api/warehouses')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Detail Test Warehouse',
          location: 'Busan, Korea',
          capacity: 2000,
        })
        .expect(201);

      const testWarehouseId = createResponse.body.id;

      // Then get it by ID
      const response = await request(app.getHttpServer())
        .get(`/api/warehouses/${testWarehouseId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.id).toBe(testWarehouseId);
      expect(response.body.name).toBe('Detail Test Warehouse');
      expect(response.body).toHaveProperty('location');
      expect(response.body).toHaveProperty('capacity');
      expect(response.body).toHaveProperty('_count');

      // Clean up
      await prisma.warehouse.delete({ where: { id: testWarehouseId } });
    });

    it('should return 404 for non-existent warehouse', async () => {
      await request(app.getHttpServer())
        .get('/api/warehouses/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('PATCH /api/warehouses/:id', () => {
    it('should update warehouse', async () => {
      // First create a warehouse
      const createResponse = await request(app.getHttpServer())
        .post('/api/warehouses')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Update Test Warehouse',
          location: 'Incheon, Korea',
          capacity: 1500,
        })
        .expect(201);

      const testWarehouseId = createResponse.body.id;

      // Then update it
      const response = await request(app.getHttpServer())
        .patch(`/api/warehouses/${testWarehouseId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Updated Warehouse Name',
          capacity: 2500,
        })
        .expect(200);

      expect(response.body.name).toBe('Updated Warehouse Name');
      expect(response.body.capacity).toBe(2500);
      expect(response.body.location).toBe('Incheon, Korea'); // Should remain unchanged

      // Clean up
      await prisma.warehouse.delete({ where: { id: testWarehouseId } });
    });

    it('should return 404 for non-existent warehouse', async () => {
      await request(app.getHttpServer())
        .patch('/api/warehouses/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Should Fail',
        })
        .expect(404);
    });
  });

  describe('DELETE /api/warehouses/:id', () => {
    it('should soft delete warehouse', async () => {
      // First create a warehouse
      const createResponse = await request(app.getHttpServer())
        .post('/api/warehouses')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Delete Test Warehouse',
          location: 'Daegu, Korea',
          capacity: 800,
        })
        .expect(201);

      const testWarehouseId = createResponse.body.id;

      // Then delete it
      await request(app.getHttpServer())
        .delete(`/api/warehouses/${testWarehouseId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Verify it's soft deleted (deletedAt is set)
      const deletedWarehouse = await prisma.warehouse.findUnique({
        where: { id: testWarehouseId },
      });

      expect(deletedWarehouse).not.toBeNull();
      expect(deletedWarehouse?.deletedAt).not.toBeNull();

      // Clean up
      await prisma.warehouse.delete({ where: { id: testWarehouseId } });
    });

    it('should return 404 for non-existent warehouse', async () => {
      await request(app.getHttpServer())
        .delete('/api/warehouses/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('GET /api/warehouses/:id/inventory', () => {
    it('should return warehouse inventory', async () => {
      // First create a warehouse
      const createResponse = await request(app.getHttpServer())
        .post('/api/warehouses')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Inventory Test Warehouse',
          location: 'Gwangju, Korea',
          capacity: 1200,
        })
        .expect(201);

      const testWarehouseId = createResponse.body.id;

      // Get inventory (should be empty initially)
      const response = await request(app.getHttpServer())
        .get(`/api/warehouses/${testWarehouseId}/inventory`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(0);

      // Clean up
      await prisma.warehouse.delete({ where: { id: testWarehouseId } });
    });

    it('should return 404 for non-existent warehouse', async () => {
      await request(app.getHttpServer())
        .get('/api/warehouses/non-existent-id/inventory')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });
});
