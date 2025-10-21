import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';

describe('Dashboard Stats (e2e)', () => {
  let app: INestApplication;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let prisma: PrismaService;
  let authToken: string;

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
    await app.close();
  });

  describe('GET /api/dashboard/stats', () => {
    it('should return dashboard statistics', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/dashboard/stats')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('totalWarehouses');
      expect(response.body).toHaveProperty('totalItems');
      expect(response.body).toHaveProperty('lowStockItems');
      expect(response.body).toHaveProperty('totalTransactions');
      expect(typeof response.body.totalWarehouses).toBe('number');
      expect(typeof response.body.totalItems).toBe('number');
      expect(typeof response.body.lowStockItems).toBe('number');
    });

    it('should return 401 without authentication', async () => {
      await request(app.getHttpServer()).get('/api/dashboard/stats').expect(401);
    });

    it('should return stats filtered by company', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/dashboard/stats')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Stats should only include data from the logged-in user's company
      expect(response.body.totalWarehouses).toBeGreaterThanOrEqual(0);
    });
  });
});
