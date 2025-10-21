# Implementation Plan: Warehouse Inventory ERP System

**Branch**: `001-warehouse-inventory-erp` | **Date**: 2025-10-17 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `specs/001-warehouse-inventory-erp/spec.md`

## Summary

Multi-tenant warehouse inventory management system enabling companies to track items across multiple warehouses, record inbound/outbound transactions, and monitor inventory levels in real-time. The system provides a dashboard for at-a-glance inventory status, warehouse management with capacity tracking, transaction history with filtering, and master item catalog management.

**Technical Approach**: Full-stack web application using Next.js 15 with App Router for frontend, NestJS for backend API, Prisma ORM with PostgreSQL for data persistence, JWT-based authentication with access/refresh token rotation (RTR), and Shadcn UI component library for consistent user interface.

## Technical Context

**Language/Version**: TypeScript 5.3+ (frontend and backend)
**Primary Dependencies**:
- Frontend: Next.js 15, React 19, Shadcn UI, TanStack Query, Zod, React Hook Form
- Backend: NestJS 10, Prisma 5, Passport JWT, class-validator, class-transformer

**Storage**: PostgreSQL 15+ with Prisma ORM
**Testing**:
- Frontend: Vitest, React Testing Library, Playwright (E2E)
- Backend: Jest, Supertest (integration), Prisma Test Environment

**Target Platform**: Modern web browsers (Chrome, Firefox, Safari, Edge - last 2 versions), Node.js 20 LTS server environment
**Project Type**: Web application (frontend + backend)
**Performance Goals**:
- API response time <200ms (p95) for data queries
- Dashboard load <3s on 3G connection
- Support 50+ concurrent users
- UI interactions <100ms response time

**Constraints**:
- <200ms p95 API latency
- WCAG 2.1 AA accessibility compliance
- Mobile-responsive (320px - 1920px viewport)
- Token refresh rotation for security
- PostgreSQL transaction isolation for data integrity

**Scale/Scope**:
- Target: 50-100 concurrent users per company
- Data: ~10,000 items, ~50 warehouses per company, ~100,000 transactions/year
- Multi-tenant: 10-50 companies on shared infrastructure

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### I. Code Quality

✅ **Single Responsibility**:
- Frontend: Page components handle routing, feature components handle business logic, UI components handle presentation
- Backend: Controllers handle HTTP, services handle business logic, repositories handle data access

✅ **DRY Principle**:
- Shared types between frontend/backend via generated Prisma Client types
- Reusable UI components via Shadcn
- Common validation schemas via Zod (frontend) and class-validator (backend)

✅ **Self-Documenting Code**:
- TypeScript provides type documentation
- Descriptive naming: `getWarehouseWithInventory()` not `getData()`
- JSDoc for complex business logic

✅ **Consistent Style**:
- ESLint + Prettier for both frontend and backend
- Airbnb TypeScript style guide base
- Automated formatting on commit via Husky

✅ **Type Safety**:
- Full TypeScript strict mode enabled
- Prisma generates type-safe database client
- Zod runtime validation + type inference
- No `any` types except for explicitly dynamic data

### II. Testing Standards

✅ **Test-First Development**: TDD mandatory for business logic (services, controllers)

✅ **Coverage Requirements**:
- Unit tests: Target 80% coverage (services, utilities, components)
- Integration tests: Target 70% coverage (API endpoints, database operations)

✅ **Test Independence**:
- Backend: Prisma Test Environment with isolated database per test
- Frontend: Mock API calls, no shared state between tests

✅ **Meaningful Assertions**:
- Test behaviors: "creates warehouse with valid data" not "calls createWarehouse"
- Verify outcomes: Check database state, API responses, UI rendering

✅ **Contract Testing**:
- OpenAPI spec for all REST endpoints
- Supertest integration tests verify API contracts
- Frontend integration tests verify API consumption

### III. User Experience Consistency

✅ **Accessibility First**:
- Shadcn components built with Radix UI (WCAG 2.1 AA compliant)
- Semantic HTML, ARIA labels, keyboard navigation
- Automated accessibility testing with axe-core

✅ **Responsive Design**:
- Mobile-first approach with Tailwind CSS
- Breakpoints: mobile (320px), tablet (768px), desktop (1024px)
- Touch-friendly targets (min 44x44px)

✅ **Error Handling**:
- Form validation with clear inline messages
- API errors mapped to user-friendly messages
- Toast notifications for success/error feedback

✅ **Loading States**:
- Skeleton loaders for data fetching
- Optimistic UI updates with rollback on error
- Progress indicators for long operations

✅ **Consistent Patterns**:
- All CRUD modals follow same structure (modal → form → validation → submit → close)
- Consistent table layouts across all list views
- Uniform navigation structure

### IV. Performance Requirements

✅ **Response Time**:
- API: <200ms p95 target via efficient Prisma queries
- UI: <100ms interactions via optimistic updates
- Dashboard: Server-side rendering for initial load

✅ **Resource Efficiency**:
- Database connection pooling via Prisma
- React memo() for expensive renders
- Image optimization via Next.js Image component

✅ **Scalability**:
- Horizontal scaling via stateless API design
- Database indexing on foreign keys and query columns
- Pagination for large datasets (warehouses, items, transactions)

✅ **Optimization Required**:
- Lighthouse CI in pipeline (min score: 90 performance)
- Database query analysis with Prisma query log
- Bundle size monitoring (target: <500KB initial load)

✅ **Monitoring**:
- Next.js instrumentation for frontend vitals
- NestJS logger for API request/response times
- PostgreSQL slow query log enabled

**GATE STATUS**: ✅ PASSED - All constitution principles can be satisfied with chosen architecture

## Project Structure

### Documentation (this feature)

```
specs/001-warehouse-inventory-erp/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
│   ├── api.yaml        # OpenAPI 3.0 specification
│   └── README.md       # Contract documentation
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```
backend/
├── src/
│   ├── auth/               # Authentication module (JWT, guards, strategies)
│   ├── users/              # User management (entity, service, controller)
│   ├── companies/          # Company management (multi-tenancy)
│   ├── warehouses/         # Warehouse CRUD operations
│   ├── items/              # Item master data management
│   ├── inventory/          # Inventory linking items to warehouses
│   ├── transactions/       # Inbound/outbound transaction tracking
│   ├── dashboard/          # Dashboard aggregations and statistics
│   ├── common/             # Shared utilities, decorators, filters
│   │   ├── decorators/    # Custom decorators (GetUser, Roles, etc.)
│   │   ├── filters/       # Exception filters
│   │   ├── guards/        # Auth guards, role guards
│   │   ├── interceptors/  # Logging, transformation interceptors
│   │   └── pipes/         # Validation pipes
│   ├── prisma/            # Prisma client and services
│   └── main.ts            # Application entry point
├── prisma/
│   ├── schema.prisma      # Database schema
│   ├── migrations/        # Prisma migrations
│   └── seed.ts            # Database seeding for development
├── test/
│   ├── integration/       # API integration tests
│   └── e2e/              # End-to-end tests
└── package.json

frontend/
├── src/
│   ├── app/                      # Next.js 14 App Router
│   │   ├── (auth)/              # Auth route group
│   │   │   ├── login/
│   │   │   └── layout.tsx
│   │   ├── (dashboard)/         # Protected route group
│   │   │   ├── dashboard/       # Dashboard page
│   │   │   ├── warehouses/      # Warehouse list + detail pages
│   │   │   ├── items/           # Item management pages
│   │   │   ├── transactions/    # Transaction history pages
│   │   │   └── layout.tsx       # Shared navigation layout
│   │   ├── layout.tsx           # Root layout
│   │   └── page.tsx             # Root page (redirect to dashboard)
│   ├── components/
│   │   ├── ui/                  # Shadcn UI components
│   │   ├── features/            # Feature-specific components
│   │   │   ├── warehouse/
│   │   │   ├── item/
│   │   │   ├── transaction/
│   │   │   └── dashboard/
│   │   ├── layout/              # Layout components (nav, sidebar)
│   │   └── shared/              # Shared components (modals, tables)
│   ├── lib/
│   │   ├── api/                 # API client functions
│   │   ├── hooks/               # Custom React hooks
│   │   ├── utils/               # Utility functions
│   │   └── validations/         # Zod schemas
│   ├── types/                   # TypeScript type definitions
│   └── store/                   # State management (if needed)
├── public/                      # Static assets
├── tests/
│   ├── unit/                    # Component unit tests
│   ├── integration/             # Feature integration tests
│   └── e2e/                     # Playwright E2E tests
└── package.json

shared/                           # Optional: Shared types between FE/BE
└── types/                       # Common type definitions
```

**Structure Decision**: Web application structure (Option 2) selected based on Next.js frontend + NestJS backend architecture. Frontend uses Next.js 14 App Router with route groups for auth and protected routes. Backend uses NestJS modular architecture with feature-based modules (auth, warehouses, items, etc.). Prisma schema defines database structure and generates type-safe client used by both frontend and backend. Tests are colocated with source code following framework conventions (backend/test, frontend/tests).

## Complexity Tracking

*No constitution violations - complexity tracking not required*
