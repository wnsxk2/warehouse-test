import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter, AllExceptionsFilter } from './common/filters/http-exception.filter';
import { PrismaExceptionFilter } from './common/filters/prisma-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global prefix
  app.setGlobalPrefix('api');

  // CORS
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Global exception filters (order matters: most specific to least specific)
  app.useGlobalFilters(
    new PrismaExceptionFilter(),
    new HttpExceptionFilter(),
    new AllExceptionsFilter(),
  );

  // Global logging interceptor
  app.useGlobalInterceptors(new LoggingInterceptor());

  // Swagger API documentation
  const config = new DocumentBuilder()
    .setTitle('Warehouse Inventory ERP API')
    .setDescription('RESTful API for warehouse inventory management system')
    .setVersion('1.0')
    .addTag('auth', 'Authentication endpoints')
    .addTag('dashboard', 'Dashboard statistics and analytics')
    .addTag('warehouses', 'Warehouse management')
    .addTag('items', 'Item master data management')
    .addTag('inventory', 'Inventory tracking')
    .addTag('transactions', 'Transaction history')
    .addTag('companies', 'Company management')
    .addTag('users', 'User management')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
  });

  await app.listen(process.env.PORT || 3001);
  console.log(`Application is running on: http://localhost:${process.env.PORT || 3001}`);
  console.log(
    `API Documentation available at: http://localhost:${process.env.PORT || 3001}/api-docs`,
  );
}
bootstrap();
