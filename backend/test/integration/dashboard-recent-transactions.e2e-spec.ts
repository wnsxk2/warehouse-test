import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';

describe('Dashboard Recent Transactions (e2e)', () => {
  let app: INestApplication;
  let authToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();

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

  describe('GET /api/dashboard/recent-transactions', () => {
    it('should return recent transactions', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/dashboard/recent-transactions')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeLessThanOrEqual(10);

      if (response.body.length > 0) {
        const transaction = response.body[0];
        expect(transaction).toHaveProperty('id');
        expect(transaction).toHaveProperty('type');
        expect(transaction).toHaveProperty('quantity');
        expect(transaction).toHaveProperty('createdAt');
        expect(transaction).toHaveProperty('warehouse');
        expect(transaction).toHaveProperty('item');
        expect(['INBOUND', 'OUTBOUND']).toContain(transaction.type);
      }
    });

    it('should return transactions in descending order by date', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/dashboard/recent-transactions')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      if (response.body.length > 1) {
        const dates = response.body.map((t: any) => new Date(t.createdAt).getTime());
        for (let i = 0; i < dates.length - 1; i++) {
          expect(dates[i]).toBeGreaterThanOrEqual(dates[i + 1]);
        }
      }
    });

    it('should return 401 without authentication', async () => {
      await request(app.getHttpServer()).get('/api/dashboard/recent-transactions').expect(401);
    });
  });
});
