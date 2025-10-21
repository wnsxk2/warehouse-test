# Warehouse Inventory ERP System

A modern, full-stack warehouse inventory management system built with NestJS, Next.js, and PostgreSQL.

## Features

- **User Story 1: Authentication & Dashboard**
  - Secure JWT-based authentication with refresh tokens
  - Company-specific multi-tenant architecture
  - Real-time dashboard with inventory statistics and low stock alerts

- **User Story 2: Warehouse Management**
  - Create, view, update, and delete warehouses
  - Track warehouse capacity and current utilization
  - View inventory summary for each warehouse

- **User Story 3: Warehouse Detail & Item Assignment**
  - Detailed warehouse view with all stored items
  - Assign items to warehouses with initial quantities
  - Real-time capacity validation

- **User Story 4: Transaction History**
  - Complete audit trail of all inventory movements
  - Filter by transaction type (INBOUND/OUTBOUND), warehouse, item, and date range
  - Immutable transaction records for compliance

- **User Story 5: Item Master Data Management**
  - Centralized item catalog with SKU management
  - Category-based organization and search
  - Reorder threshold tracking
  - View total quantities across all warehouses

## Tech Stack

### Backend
- **Framework**: NestJS 10
- **Language**: TypeScript 5.3+
- **Database**: PostgreSQL 15+
- **ORM**: Prisma
- **Authentication**: JWT with refresh tokens
- **API Documentation**: Swagger/OpenAPI
- **Testing**: Jest (unit & integration)

### Frontend
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript 5.3+
- **UI Library**: React 19
- **Styling**: Tailwind CSS + shadcn/ui
- **State Management**: TanStack Query (React Query)
- **Forms**: React Hook Form + Zod
- **Testing**: Vitest + Playwright (E2E)

## Prerequisites

- Node.js 18+ and npm
- PostgreSQL 15+
- Git

## Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd sdd
```

### 2. Database Setup

```bash
# Create PostgreSQL database
createdb sdd_dev

# Set database connection in backend/.env
DATABASE_URL="postgresql://user:password@localhost:5432/sdd_dev"
```

### 3. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Seed database with sample data
npx prisma db seed

# Start development server
npm run start:dev
```

Backend will run on `http://localhost:3001`
API Documentation available at `http://localhost:3001/api-docs`

### 4. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Set backend API URL in .env.local
NEXT_PUBLIC_API_URL=http://localhost:3001/api

# Start development server
npm run dev
```

Frontend will run on `http://localhost:3000`

### 5. Login

Use the seeded credentials:
- Email: `admin@example.com`
- Password: `password123`

## Project Structure

```
sdd/
├── backend/               # NestJS backend application
│   ├── src/
│   │   ├── auth/         # Authentication module
│   │   ├── dashboard/    # Dashboard statistics
│   │   ├── warehouses/   # Warehouse management
│   │   ├── items/        # Item master data
│   │   ├── inventory/    # Inventory tracking
│   │   ├── transactions/ # Transaction history
│   │   ├── companies/    # Company management
│   │   ├── users/        # User management
│   │   └── common/       # Shared utilities & filters
│   ├── prisma/
│   │   ├── schema.prisma # Database schema
│   │   └── seed.ts       # Database seeding
│   └── test/             # E2E and integration tests
│
├── frontend/              # Next.js frontend application
│   ├── src/
│   │   ├── app/          # Next.js App Router pages
│   │   ├── components/   # React components
│   │   │   ├── features/ # Feature-specific components
│   │   │   ├── layout/   # Layout components
│   │   │   ├── shared/   # Shared components
│   │   │   └── ui/       # shadcn/ui components
│   │   └── lib/          # Utilities, API clients, hooks
│   └── tests/            # Component & E2E tests
│
└── specs/                # Project specifications
    └── 001-warehouse-inventory-erp/
        ├── spec.md       # User stories & requirements
        ├── plan.md       # Implementation plan
        ├── tasks.md      # Detailed task breakdown
        └── ...           # Design documents
```

## Available Scripts

### Backend

```bash
npm run start:dev    # Start development server with hot reload
npm run build        # Build for production
npm run start:prod   # Start production server
npm run lint         # Run ESLint
npm run test         # Run unit tests
npm run test:e2e     # Run E2E tests
npm run test:cov     # Run tests with coverage
```

### Frontend

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run test         # Run unit tests with Vitest
npm run test:e2e     # Run E2E tests with Playwright
npm run analyze      # Analyze bundle size
```

## Development Guidelines

### Backend Development

1. **Module Structure**: Follow NestJS module pattern (controller, service, module)
2. **DTOs**: Use class-validator for request validation
3. **Guards**: JWT authentication guard applied globally
4. **Multi-tenancy**: Always filter by `companyId` from authenticated user
5. **Soft Deletes**: Use `deletedAt` field for warehouses and items
6. **Testing**: Write E2E tests for all API endpoints

### Frontend Development

1. **Server Components**: Use Server Components by default, Client Components when needed
2. **Data Fetching**: Use TanStack Query for server state management
3. **Form Validation**: Zod schemas with React Hook Form
4. **Error Handling**: Use global error handler utility
5. **Loading States**: Use loading skeleton components
6. **Type Safety**: Strict TypeScript mode enabled

### Database Schema

- **Row-level Multi-tenancy**: All business entities scoped by `companyId`
- **Soft Deletes**: `Warehouse` and `Item` models support soft deletion
- **Decimal Types**: Use Prisma Decimal for quantities and capacities
- **Indexes**: Optimized for common query patterns (see `prisma/schema.prisma`)

## Testing

### Backend Testing

```bash
# Run all tests
npm run test

# Run E2E tests
npm run test:e2e

# Run with coverage
npm run test:cov
```

Test files are located in:
- Unit tests: `src/**/*.spec.ts`
- Integration tests: `test/integration/*.e2e-spec.ts`

### Frontend Testing

```bash
# Run component tests
npm run test

# Run E2E tests
npm run test:e2e

# Run E2E tests in UI mode
npm run test:e2e:ui
```

Test files are located in:
- Component tests: `src/**/*.test.tsx`
- E2E tests: `tests/e2e/*.spec.ts`

## API Documentation

Once the backend is running, visit `http://localhost:3001/api-docs` to view the interactive Swagger API documentation.

## Environment Variables

### Backend (.env)

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/sdd_dev"

# JWT
JWT_SECRET="your-secret-key-here"
JWT_EXPIRATION="15m"
REFRESH_TOKEN_EXPIRATION="7d"

# Server
PORT=3001
FRONTEND_URL="http://localhost:3000"
```

### Frontend (.env.local)

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

## Security Features

- JWT-based authentication with secure httpOnly cookies
- Refresh token rotation for enhanced security
- Password hashing with bcrypt
- CORS configuration for cross-origin requests
- Input validation and sanitization
- SQL injection protection via Prisma ORM
- Role-based access control (ADMIN, MANAGER, USER)

## Performance Optimizations

- Database query optimization with Prisma indexes
- React Query caching and background refetching
- Next.js automatic code splitting
- Image optimization with Next.js Image component
- Bundle size analysis with @next/bundle-analyzer
- Gzip compression for production builds

## Contributing

1. Create a feature branch from `main`
2. Make your changes following the development guidelines
3. Write tests for new features
4. Run linting and tests: `npm run lint && npm test`
5. Create a pull request

## License

MIT

## Support

For issues and questions, please create an issue in the GitHub repository.
