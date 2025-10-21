# Quickstart Guide: Warehouse Inventory ERP System

**Feature**: 001-warehouse-inventory-erp
**Purpose**: Get the development environment running and start building

## Prerequisites

### Required Tools

- **Node.js**: 20 LTS or higher ([download](https://nodejs.org/))
- **pnpm**: 8.x or higher (`npm install -g pnpm`)
- **PostgreSQL**: 15 or higher ([download](https://www.postgresql.org/download/))
- **Git**: For version control
- **VS Code**: Recommended editor with extensions:
  - Prisma
  - ESLint
  - Prettier
  - Tailwind CSS IntelliSense

### Optional Tools

- **Docker**: For local PostgreSQL (alternative to native install)
- **Postman/Insomnia**: For API testing
- **pgAdmin**: For database GUI

## Initial Setup

### 1. Repository Setup

```bash
# Clone repository (if not already done)
git clone <repository-url>
cd sdd

# Checkout feature branch
git checkout 001-warehouse-inventory-erp

# Install dependencies for both frontend and backend
pnpm install
```

### 2. Database Setup

**Option A: Native PostgreSQL**

```bash
# Create database
createdb warehouse_erp_dev

# Create .env file in backend/
cat > backend/.env <<EOF
DATABASE_URL="postgresql://username:password@localhost:5432/warehouse_erp_dev"
JWT_ACCESS_SECRET="<generate-with-openssl-rand-hex-32>"
JWT_REFRESH_SECRET="<generate-with-openssl-rand-hex-32>"
NODE_ENV=development
PORT=3001
EOF
```

**Option B: Docker PostgreSQL**

```bash
# Start PostgreSQL container
docker run --name warehouse-postgres \
  -e POSTGRES_DB=warehouse_erp_dev \
  -e POSTGRES_USER=warehouse_user \
  -e POSTGRES_PASSWORD=warehouse_pass \
  -p 5432:5432 \
  -d postgres:15

# Create backend/.env
cat > backend/.env <<EOF
DATABASE_URL="postgresql://warehouse_user:warehouse_pass@localhost:5432/warehouse_erp_dev"
JWT_ACCESS_SECRET="<generate-secure-secret>"
JWT_REFRESH_SECRET="<generate-secure-secret>"
NODE_ENV=development
PORT=3001
EOF
```

**Generate Secure Secrets**:

```bash
# Generate JWT secrets
openssl rand -hex 32  # For JWT_ACCESS_SECRET
openssl rand -hex 32  # For JWT_REFRESH_SECRET
```

### 3. Backend Setup

```bash
cd backend

# Install dependencies (if not already done from root)
pnpm install

# Generate Prisma Client
pnpm prisma generate

# Run database migrations
pnpm prisma migrate dev --name init

# Seed development data (optional)
pnpm prisma db seed

# Start development server
pnpm start:dev
```

**Expected Output**:
```
[Nest] INFO [NestFactory] Starting Nest application...
[Nest] INFO [InstanceLoader] AppModule dependencies initialized
[Nest] INFO [RoutesResolver] Mapped {/api/auth/login, POST} route
[Nest] INFO [RoutesResolver] Mapped {/api/warehouses, GET} route
...
[Nest] INFO [NestApplication] Nest application successfully started
[Nest] INFO Application is running on: http://localhost:3001
```

**Verify Backend**:
```bash
curl http://localhost:3001/api/health
# Expected: {"status":"ok","timestamp":"..."}
```

### 4. Frontend Setup

```bash
# In new terminal, navigate to frontend
cd frontend

# Create .env.local file
cat > .env.local <<EOF
NEXT_PUBLIC_API_URL=http://localhost:3001/api
EOF

# Install dependencies (if not done)
pnpm install

# Start development server
pnpm dev
```

**Expected Output**:
```
  ▲ Next.js 15.0.0
  - Local:        http://localhost:3000
  - Turbopack:    enabled

 ✓ Ready in 1.8s
```

**Access Application**: Open browser to `http://localhost:3000`

## Project Structure Walkthrough

### Backend Structure (`backend/`)

```
backend/
├── src/
│   ├── auth/                      # JWT authentication
│   │   ├── auth.controller.ts    # Login, refresh, logout endpoints
│   │   ├── auth.service.ts       # Token generation, validation
│   │   ├── jwt.strategy.ts       # Passport JWT strategy
│   │   ├── jwt-auth.guard.ts     # Route protection guard
│   │   └── dto/                  # Login DTOs
│   │
│   ├── users/                     # User management
│   │   ├── users.controller.ts   # User CRUD endpoints
│   │   ├── users.service.ts      # User business logic
│   │   ├── user.entity.ts        # User entity (Prisma type)
│   │   └── dto/                  # User DTOs
│   │
│   ├── companies/                 # Company management
│   │   └── ...
│   │
│   ├── warehouses/                # Warehouse module
│   │   ├── warehouses.controller.ts
│   │   ├── warehouses.service.ts
│   │   └── dto/
│   │
│   ├── items/                     # Item master data
│   │   └── ...
│   │
│   ├── inventory/                 # Inventory management
│   │   └── ...
│   │
│   ├── transactions/              # Transaction tracking
│   │   └── ...
│   │
│   ├── dashboard/                 # Dashboard aggregations
│   │   └── ...
│   │
│   ├── prisma/                    # Prisma service
│   │   └── prisma.service.ts     # Database connection
│   │
│   ├── common/                    # Shared code
│   │   ├── decorators/
│   │   │   ├── get-user.decorator.ts    # Extract user from request
│   │   │   └── roles.decorator.ts       # Role-based access
│   │   ├── filters/
│   │   │   └── http-exception.filter.ts # Global error handling
│   │   ├── guards/
│   │   │   └── roles.guard.ts           # Role authorization
│   │   ├── interceptors/
│   │   │   └── logging.interceptor.ts   # Request logging
│   │   └── pipes/
│   │       └── validation.pipe.ts       # Global validation
│   │
│   ├── app.module.ts              # Root module
│   └── main.ts                    # Application entry point
│
├── prisma/
│   ├── schema.prisma              # Database schema
│   ├── migrations/                # Migration history
│   └── seed.ts                    # Development seed data
│
├── test/
│   ├── integration/               # API integration tests
│   └── e2e/                       # End-to-end tests
│
└── package.json
```

### Frontend Structure (`frontend/`)

```
frontend/
├── src/
│   ├── app/                                # Next.js 15 App Router
│   │   ├── (auth)/                        # Auth route group (no layout)
│   │   │   └── login/
│   │   │       └── page.tsx               # Login page
│   │   │
│   │   ├── (dashboard)/                   # Protected routes (shared layout)
│   │   │   ├── layout.tsx                 # Navigation sidebar + header
│   │   │   │
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx               # Dashboard (US1)
│   │   │   │
│   │   │   ├── warehouses/
│   │   │   │   ├── page.tsx               # Warehouse list (US2)
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx           # Warehouse detail (US3)
│   │   │   │
│   │   │   ├── items/
│   │   │   │   └── page.tsx               # Item management (US5)
│   │   │   │
│   │   │   └── transactions/
│   │   │       └── page.tsx               # Transaction history (US4)
│   │   │
│   │   ├── layout.tsx                     # Root layout (fonts, providers)
│   │   └── page.tsx                       # Root redirect to /dashboard
│   │
│   ├── components/
│   │   ├── ui/                            # Shadcn components (auto-generated)
│   │   │   ├── button.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── form.tsx
│   │   │   ├── table.tsx
│   │   │   └── ...
│   │   │
│   │   ├── features/                      # Feature-specific components
│   │   │   ├── warehouse/
│   │   │   │   ├── warehouse-list.tsx
│   │   │   │   ├── warehouse-card.tsx
│   │   │   │   ├── add-warehouse-modal.tsx
│   │   │   │   └── warehouse-stats.tsx
│   │   │   │
│   │   │   ├── item/
│   │   │   │   ├── item-list.tsx
│   │   │   │   └── register-item-modal.tsx
│   │   │   │
│   │   │   ├── transaction/
│   │   │   │   ├── transaction-list.tsx
│   │   │   │   ├── transaction-filters.tsx
│   │   │   │   └── transaction-detail-modal.tsx
│   │   │   │
│   │   │   └── dashboard/
│   │   │       ├── stats-card.tsx
│   │   │       ├── recent-transactions.tsx
│   │   │       └── low-stock-alerts.tsx
│   │   │
│   │   ├── layout/                        # Layout components
│   │   │   ├── navbar.tsx                 # Top navigation bar
│   │   │   ├── sidebar.tsx                # Side navigation menu
│   │   │   └── page-header.tsx            # Page title + actions
│   │   │
│   │   └── shared/                        # Shared components
│   │       ├── data-table.tsx             # Reusable table with sorting
│   │       ├── loading-skeleton.tsx       # Loading states
│   │       └── error-boundary.tsx         # Error handling
│   │
│   ├── lib/
│   │   ├── api/                           # API client functions
│   │   │   ├── auth.ts                    # Login, logout, refresh
│   │   │   ├── warehouses.ts              # Warehouse API calls
│   │   │   ├── items.ts
│   │   │   ├── inventory.ts
│   │   │   ├── transactions.ts
│   │   │   ├── dashboard.ts
│   │   │   └── client.ts                  # Axios instance with interceptors
│   │   │
│   │   ├── hooks/                         # Custom React hooks
│   │   │   ├── use-auth.ts                # Authentication state
│   │   │   ├── use-warehouses.ts          # Warehouse queries (TanStack Query)
│   │   │   ├── use-items.ts
│   │   │   ├── use-transactions.ts
│   │   │   └── use-dashboard.ts
│   │   │
│   │   ├── utils/                         # Utility functions
│   │   │   ├── cn.ts                      # Tailwind class merging
│   │   │   ├── format-date.ts             # Date formatting
│   │   │   └── format-number.ts           # Number formatting
│   │   │
│   │   └── validations/                   # Zod schemas
│   │       ├── warehouse.ts
│   │       ├── item.ts
│   │       ├── transaction.ts
│   │       └── auth.ts
│   │
│   ├── types/                             # TypeScript types
│   │   ├── api.ts                         # API response types
│   │   └── models.ts                      # Entity types
│   │
│   └── styles/
│       └── globals.css                    # Tailwind base styles
│
├── public/                                # Static assets
├── tests/                                 # Frontend tests
│   ├── unit/
│   ├── integration/
│   └── e2e/
│
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

## Development Workflow

### 1. Create New Feature Module

**Backend Example (Warehouses)**:

```bash
cd backend/src

# Generate NestJS module
nest g module warehouses
nest g controller warehouses
nest g service warehouses

# Create DTOs
mkdir warehouses/dto
touch warehouses/dto/create-warehouse.dto.ts
touch warehouses/dto/update-warehouse.dto.ts
```

**Frontend Example (Warehouse List Page)**:

```bash
cd frontend/src/app/(dashboard)

# Create warehouse pages
mkdir -p warehouses
touch warehouses/page.tsx

# Create warehouse components
mkdir -p ../components/features/warehouse
touch ../components/features/warehouse/warehouse-list.tsx
touch ../components/features/warehouse/add-warehouse-modal.tsx
```

### 2. Database Schema Changes

```bash
cd backend

# 1. Update prisma/schema.prisma
# Add or modify models

# 2. Create migration
pnpm prisma migrate dev --name add_warehouse_notes_field

# 3. Regenerate Prisma Client
pnpm prisma generate

# 4. Restart backend server (auto-restart if using --watch)
```

### 3. API Development (TDD)

```bash
# 1. Write integration test
# backend/test/integration/warehouses.e2e-spec.ts

describe('POST /warehouses', () => {
  it('creates warehouse with valid data', async () => {
    const response = await request(app)
      .post('/api/warehouses')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Test Warehouse',
        location: 'Seoul',
        capacity: 1000
      });

    expect(response.status).toBe(201);
    expect(response.body.name).toBe('Test Warehouse');
  });
});

# 2. Run test (should fail)
pnpm test:e2e

# 3. Implement feature in controller/service
# backend/src/warehouses/warehouses.service.ts

# 4. Run test again (should pass)
pnpm test:e2e
```

### 4. Frontend Development

```bash
cd frontend

# 1. Create API client function
# src/lib/api/warehouses.ts
export async function getWarehouses(params) {
  const response = await client.get('/warehouses', { params });
  return response.data;
}

# 2. Create TanStack Query hook
# src/lib/hooks/use-warehouses.ts
export function useWarehouses() {
  return useQuery({
    queryKey: ['warehouses'],
    queryFn: () => getWarehouses()
  });
}

# 3. Create component
# src/app/(dashboard)/warehouses/page.tsx
export default function WarehousesPage() {
  const { data, isLoading } = useWarehouses();
  // Render UI
}

# 4. Test in browser
pnpm dev
# Open http://localhost:3000/warehouses
```

### 5. UI Component Development (Shadcn)

```bash
cd frontend

# Install new Shadcn component
npx shadcn-ui@latest add dialog

# Use in modal
# src/components/features/warehouse/add-warehouse-modal.tsx
import { Dialog, DialogContent, DialogHeader } from '@/components/ui/dialog';
```

### 6. Running Tests

**Backend Tests**:

```bash
cd backend

# Unit tests
pnpm test

# Integration tests
pnpm test:e2e

# Test coverage
pnpm test:cov

# Watch mode (during development)
pnpm test:watch
```

**Frontend Tests**:

```bash
cd frontend

# Unit tests (Vitest)
pnpm test

# E2E tests (Playwright)
pnpm test:e2e

# Watch mode
pnpm test:watch
```

### 7. Code Quality

```bash
# Run linter
pnpm lint

# Fix auto-fixable issues
pnpm lint:fix

# Format code
pnpm format

# Type check (TypeScript)
pnpm typecheck
```

## Common Development Tasks

### Add New Database Entity

1. Edit `backend/prisma/schema.prisma`
2. Run `pnpm prisma migrate dev --name add_entity_name`
3. Run `pnpm prisma generate`
4. Create NestJS module/service/controller
5. Implement CRUD operations
6. Write tests
7. Update frontend types and API client

### Add New UI Page

1. Create page in `frontend/src/app/(dashboard)/page-name/page.tsx`
2. Add navigation link in `frontend/src/components/layout/sidebar.tsx`
3. Create page components in `frontend/src/components/features/page-name/`
4. Implement API hooks in `frontend/src/lib/hooks/`
5. Write component tests

### Debug Backend API

```bash
# Enable Prisma query logging
# Add to backend/.env
DEBUG=*

# Or use Prisma Studio (database GUI)
cd backend
pnpm prisma studio
# Opens http://localhost:5555
```

### Debug Frontend

```bash
# Use React DevTools browser extension
# Use TanStack Query DevTools (auto-enabled in dev)

# Check network requests
# Open browser DevTools → Network tab
# Filter by "Fetch/XHR"
```

## Troubleshooting

### Backend Won't Start

**Error**: `Error: P1001: Can't reach database server`

**Solution**:
```bash
# Check PostgreSQL is running
pg_isready
# or for Docker:
docker ps | grep postgres

# Check DATABASE_URL in backend/.env
# Ensure database exists
psql -U username -d warehouse_erp_dev
```

**Error**: `Cannot find module '@prisma/client'`

**Solution**:
```bash
cd backend
pnpm prisma generate
```

### Frontend Won't Start

**Error**: `Module not found: Can't resolve '@/components/ui/button'`

**Solution**:
```bash
# Install missing Shadcn component
cd frontend
npx shadcn-ui@latest add button
```

**Error**: `API calls returning 401 Unauthorized`

**Solution**:
- Check `NEXT_PUBLIC_API_URL` in `frontend/.env.local`
- Verify backend is running on port 3001
- Check access token is being sent in Authorization header
- Try logging in again to get fresh tokens

### Database Migration Issues

**Error**: Migration conflicts

**Solution**:
```bash
cd backend

# Reset development database (WARNING: data loss)
pnpm prisma migrate reset

# Or resolve conflicts manually
pnpm prisma migrate resolve --applied <migration-name>
```

### Build Errors

**TypeScript Errors**:
```bash
# Check TypeScript configuration
cd backend  # or frontend
pnpm typecheck

# Regenerate types
cd backend
pnpm prisma generate
```

## Environment Variables Reference

### Backend (`backend/.env`)

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/warehouse_erp_dev"

# JWT Secrets (generate with: openssl rand -hex 32)
JWT_ACCESS_SECRET="your-access-secret-here"
JWT_REFRESH_SECRET="your-refresh-secret-here"

# Server
NODE_ENV=development  # or production
PORT=3001

# Optional
LOG_LEVEL=debug  # or info, warn, error
```

### Frontend (`frontend/.env.local`)

```bash
# API URL
NEXT_PUBLIC_API_URL=http://localhost:3001/api

# Optional
NEXT_PUBLIC_APP_NAME="Warehouse ERP"
```

## Next Steps

1. **Read Architecture Documents**:
   - [data-model.md](./data-model.md) - Database schema and relationships
   - [contracts/api.yaml](./contracts/api.yaml) - API specification
   - [research.md](./research.md) - Technology decisions

2. **Start Implementing User Stories**:
   - Begin with US1 (Dashboard) as MVP
   - Follow TDD approach: tests first, implementation second
   - Use `/speckit.tasks` to generate task breakdown

3. **Review Constitution**:
   - [.specify/memory/constitution.md](../.specify/memory/constitution.md)
   - Ensure code quality, testing, UX, and performance standards

4. **Explore Example Code** (once generated):
   - Study authentication flow implementation
   - Review Prisma query patterns
   - Examine TanStack Query usage
   - Inspect Shadcn component customizations

## Additional Resources

- **Next.js Docs**: https://nextjs.org/docs
- **NestJS Docs**: https://docs.nestjs.com
- **Prisma Docs**: https://www.prisma.io/docs
- **Shadcn UI**: https://ui.shadcn.com
- **TanStack Query**: https://tanstack.com/query
- **Zod**: https://zod.dev

## Getting Help

- Check existing tests for usage examples
- Review generated API documentation at `http://localhost:3001/api-docs`
- Use Prisma Studio for database inspection: `pnpm prisma studio`
- Check browser console and Network tab for frontend issues
- Review NestJS logs for backend errors
