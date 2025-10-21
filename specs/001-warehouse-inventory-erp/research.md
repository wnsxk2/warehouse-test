# Research: Warehouse Inventory ERP System

**Feature**: 001-warehouse-inventory-erp
**Date**: 2025-10-17
**Purpose**: Technology selection rationale and architectural decisions

## Technology Stack Decisions

### Frontend Framework: Next.js 15 with App Router

**Decision**: Use Next.js 15 with App Router for frontend development

**Rationale**:
- **React 19 Support**: Latest React features including improved Suspense and Server Components
- **Server-Side Rendering**: Improves initial page load performance for dashboard (SC-001: <3s load time)
- **App Router Benefits**: Built-in loading states, error boundaries, and layouts reduce boilerplate
- **Route Groups**: Clean separation between authenticated and public routes
- **TypeScript Support**: First-class TypeScript integration for type safety (Constitution I)
- **Performance**: Automatic code splitting, image optimization, font optimization, improved caching
- **Turbopack**: Faster build times in development mode
- **Partial Prerendering**: Better performance with mixed static/dynamic content

**Alternatives Considered**:
- **Create React App**: Rejected - deprecated, no SSR, manual routing setup required
- **Vite + React**: Considered - faster dev experience but lacks SSR and routing conventions
- **SPA Only**: Rejected - slower initial loads, doesn't meet <3s dashboard requirement

### UI Component Library: Shadcn UI

**Decision**: Use Shadcn UI component library with Radix UI primitives

**Rationale**:
- **Accessibility**: Built on Radix UI with WCAG 2.1 AA compliance (Constitution III)
- **Customization**: Copy-paste components into project, full control over styling
- **TypeScript**: Full type safety for component props
- **Tailwind CSS**: Consistent with modern utility-first CSS approach
- **Modal Components**: Excellent Dialog/Sheet components for CRUD modals (US2, US3, US5)
- **Table Components**: Built-in table components with sorting/filtering support (US4)

**Alternatives Considered**:
- **Material-UI**: Rejected - heavier bundle size, less customization freedom
- **Ant Design**: Considered - good for ERP but opinionated styling hard to customize
- **Headless UI**: Considered - requires more manual styling work

### Backend Framework: NestJS

**Decision**: Use NestJS as backend API framework

**Rationale**:
- **TypeScript Native**: Full TypeScript support with decorators and type inference
- **Modular Architecture**: Aligns with Single Responsibility principle (Constitution I)
- **Dependency Injection**: Clean service layer architecture
- **Built-in Guards**: Perfect for JWT auth and role-based access control (FR-001)
- **Validation**: class-validator and class-transformer for robust input validation
- **Testing**: Jest integration, dependency injection makes testing easier
- **OpenAPI**: @nestjs/swagger generates API documentation automatically

**Alternatives Considered**:
- **Express.js**: Rejected - too minimal, requires manual structure setup
- **Fastify**: Considered - faster performance but less ecosystem maturity
- **tRPC**: Rejected - requires React Query on frontend, less REST-standard

### ORM: Prisma 5

**Decision**: Use Prisma as database ORM

**Rationale**:
- **Type Safety**: Generates TypeScript types from schema (Constitution I)
- **Migrations**: Built-in migration system with version control
- **Query Performance**: Optimized queries, connection pooling for <200ms API latency
- **Relations**: Clean syntax for joins (warehouse → items → inventory)
- **Multi-Tenancy**: Easy to implement company-based data isolation (FR-001)
- **Developer Experience**: Auto-completion, type checking at development time
- **Testing**: Prisma Test Environment for isolated test databases

**Alternatives Considered**:
- **TypeORM**: Rejected - less type-safe, more configuration required
- **Sequelize**: Rejected - older ORM, weaker TypeScript support
- **Raw SQL**: Rejected - loses type safety, more boilerplate code

### Database: PostgreSQL 15+

**Decision**: Use PostgreSQL as primary database

**Rationale**:
- **ACID Compliance**: Critical for transaction integrity (SC-004: 100% accuracy)
- **Concurrent Users**: Excellent MVCC for 50+ concurrent users (SC-009)
- **Complex Queries**: Supports aggregations for dashboard statistics (US1)
- **JSON Support**: Optional JSON columns for flexible metadata
- **Indexing**: B-tree indexes for foreign keys, partial indexes for queries
- **Transaction Isolation**: Prevents concurrent update conflicts (edge case handling)
- **Prisma Integration**: Best ORM support for PostgreSQL

**Alternatives Considered**:
- **MySQL**: Considered - but PostgreSQL has better JSON support and MVCC
- **MongoDB**: Rejected - relational data model better fits inventory tracking
- **SQLite**: Rejected - not suitable for multi-user concurrent access

### Authentication: JWT with RTR (Refresh Token Rotation)

**Decision**: Implement JWT with access/refresh token rotation

**Rationale**:
- **Security**: RTR prevents token replay attacks (refresh tokens single-use)
- **Stateless**: Access tokens don't require database lookup (scalability)
- **Performance**: Fast authentication for API requests
- **User Experience**: Long-lived refresh tokens (7-30 days), short access tokens (15min)
- **Multi-Device**: Each device gets unique refresh token
- **NestJS Integration**: Passport JWT strategy built-in

**Implementation Details**:
- Access Token: 15 minutes, stored in memory (not localStorage)
- Refresh Token: 7 days, httpOnly cookie, rotated on each use
- Token Blacklist: Store invalidated refresh tokens in database
- Automatic Refresh: Frontend intercepts 401, refreshes token, retries request

**Alternatives Considered**:
- **Session-Based**: Rejected - requires Redis/database for session storage
- **JWT Only**: Rejected - no refresh mechanism, security risk if stolen
- **OAuth2**: Rejected - overkill for internal ERP system

### State Management: TanStack Query (React Query)

**Decision**: Use TanStack Query for server state management

**Rationale**:
- **Caching**: Reduces API calls, improves performance (SC-001)
- **Optimistic Updates**: UI responds immediately while API processes (UX)
- **Automatic Refetching**: Keeps data fresh when user returns to tab
- **Loading States**: Built-in loading/error/success states (Constitution III)
- **Pagination**: Built-in support for paginated queries (warehouses, items, transactions)
- **DevTools**: Query inspector for debugging

**Client State**: useState/useReducer for form state, modal open/close

**Alternatives Considered**:
- **Redux Toolkit**: Rejected - overkill for mostly server state
- **Zustand**: Considered - lightweight but doesn't handle server state caching
- **SWR**: Considered - similar to React Query but less feature-complete

### Form Management: React Hook Form + Zod

**Decision**: Use React Hook Form with Zod validation

**Rationale**:
- **Performance**: Uncontrolled components, minimal re-renders
- **Validation**: Zod provides runtime validation + TypeScript types
- **Shadcn Integration**: Works seamlessly with Shadcn Form component
- **Error Handling**: Clear inline error messages (Constitution III)
- **Type Safety**: Zod schema infers TypeScript types automatically

**Alternatives Considered**:
- **Formik**: Rejected - controlled components, more re-renders
- **Yup**: Considered - but Zod has better TypeScript integration

### Testing Strategy

**Frontend**:
- **Unit Tests**: Vitest (faster than Jest, Vite-compatible)
- **Component Tests**: React Testing Library (user-centric testing)
- **E2E Tests**: Playwright (multi-browser, visual regression)

**Backend**:
- **Unit Tests**: Jest (NestJS default, excellent DI mocking)
- **Integration Tests**: Supertest + Prisma Test Environment
- **Contract Tests**: OpenAPI validation against actual API responses

**Why These Choices**:
- Vitest: 10x faster than Jest for Vite projects
- Playwright: Better than Cypress for multi-page workflows (warehouse → detail → transaction)
- Prisma Test: Isolated database per test prevents test pollution

## Architecture Patterns

### Multi-Tenancy Pattern

**Decision**: Row-Level Security via companyId foreign key

**Implementation**:
- Every entity (Warehouse, Item, Transaction, User) has `companyId` field
- Prisma middleware automatically filters queries by current user's company
- Guards prevent cross-company data access
- Database indexes on companyId for query performance

**Alternatives Considered**:
- **Schema-per-Tenant**: Rejected - complex migrations, harder to manage
- **Database-per-Tenant**: Rejected - overkill for scale (10-50 companies)

### API Design Pattern

**Decision**: RESTful API with resource-based routes

**Endpoints**:
```
POST   /auth/login
POST   /auth/refresh
POST   /auth/logout

GET    /warehouses
POST   /warehouses
GET    /warehouses/:id
PATCH  /warehouses/:id
DELETE /warehouses/:id
GET    /warehouses/:id/inventory

GET    /items
POST   /items
GET    /items/:id
PATCH  /items/:id

POST   /inventory (assign item to warehouse)
PATCH  /inventory/:id (update quantity)

GET    /transactions
POST   /transactions (create inbound/outbound)
GET    /transactions/:id

GET    /dashboard/stats
GET    /dashboard/recent-transactions
```

**Alternatives Considered**:
- **GraphQL**: Rejected - REST simpler for CRUD operations, better caching
- **tRPC**: Rejected - less standard, requires React Query coupling

### Error Handling Pattern

**Frontend**:
- React Error Boundaries for component errors
- TanStack Query error handling for API errors
- Toast notifications for user feedback
- Form validation errors inline

**Backend**:
- NestJS Exception Filters for consistent error format
- HTTP status codes: 400 (validation), 401 (auth), 403 (forbidden), 404 (not found), 409 (conflict)
- Error response format:
```json
{
  "statusCode": 400,
  "message": "Warehouse capacity must be positive",
  "error": "Bad Request",
  "timestamp": "2025-10-17T12:00:00Z",
  "path": "/warehouses"
}
```

## Performance Optimizations

### Database Indexing Strategy

**Indexes to Create**:
- `Company.id` (primary key, auto-indexed)
- `User.email` (unique index for login)
- `User.companyId` (foreign key index)
- `Warehouse.companyId` (multi-tenant filtering)
- `Item.sku` (unique index for duplicate prevention)
- `Item.companyId` (multi-tenant filtering)
- `Inventory(warehouseId, itemId)` (composite index for joins)
- `Transaction.companyId` (multi-tenant filtering)
- `Transaction.createdAt` (sorting/filtering)
- `Transaction.type` (filtering inbound/outbound)

### Query Optimization

**Dashboard Aggregations**:
- Use Prisma `aggregate` and `groupBy` for statistics
- Cache dashboard data for 30 seconds (TanStack Query staleTime)
- Paginate recent transactions (10 items default)

**Warehouse List**:
- Eager load item count via Prisma `include` with `_count`
- Paginate results (20 per page)

**Transaction History**:
- Database-side filtering and pagination
- Composite index on (companyId, type, createdAt)

### Frontend Performance

**Code Splitting**:
- Next.js automatic route-based splitting
- Dynamic imports for modals (loaded on demand)

**Image Optimization**:
- Next.js Image component with WebP format
- Lazy loading for below-fold images

**Bundle Size**:
- Target: <500KB initial bundle
- Tree-shaking via ESM imports
- Bundle analyzer to monitor size

## Security Considerations

### Authentication Security

- **Password Hashing**: bcrypt with cost factor 12
- **Token Storage**: Access token in memory, refresh token in httpOnly cookie
- **CSRF Protection**: SameSite cookie attribute
- **Rate Limiting**: 5 login attempts per 15 minutes
- **Token Expiry**: Access 15min, Refresh 7 days

### Authorization Security

- **Role-Based Access**: Guards check user role (admin, manager, user)
- **Company Isolation**: Middleware filters all queries by companyId
- **Input Validation**: class-validator on all DTOs
- **SQL Injection**: Prisma parameterized queries prevent SQL injection
- **XSS Protection**: React auto-escapes JSX, Content-Security-Policy headers

### Data Security

- **Audit Trail**: Transactions immutable (no DELETE endpoint)
- **Soft Deletes**: Warehouses/Items soft-deleted (deletedAt timestamp)
- **Encryption**: HTTPS for transit, PostgreSQL encryption at rest
- **Backup**: Daily automated backups with 30-day retention

## Development Workflow

### Environment Setup

**Required Tools**:
- Node.js 20 LTS
- PostgreSQL 15+
- pnpm (preferred over npm for monorepo performance)
- Docker (optional, for local PostgreSQL)

**Environment Variables**:
```
DATABASE_URL=postgresql://user:password@localhost:5432/warehouse_erp
JWT_ACCESS_SECRET=<generate-secure-secret>
JWT_REFRESH_SECRET=<generate-secure-secret>
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### Development Commands

**Backend**:
```bash
pnpm install
pnpm prisma generate      # Generate Prisma client
pnpm prisma migrate dev   # Run migrations
pnpm prisma db seed       # Seed development data
pnpm test                 # Run tests
pnpm start:dev            # Start dev server
```

**Frontend**:
```bash
pnpm install
pnpm dev                  # Start Next.js dev server
pnpm test                 # Run Vitest tests
pnpm test:e2e             # Run Playwright tests
pnpm lint                 # Run ESLint
```

### Git Workflow

- Feature branches from `main`
- PR requires: tests passing, Lighthouse >90, no TypeScript errors
- Husky pre-commit: lint, format, type-check
- Husky pre-push: run test suite

## Deployment Strategy

### Production Environment

**Infrastructure**:
- Frontend: Vercel (Next.js optimized, edge caching)
- Backend: Railway/Render (Node.js hosting with auto-scaling)
- Database: Managed PostgreSQL (AWS RDS, Railway, or Supabase)

**CI/CD Pipeline**:
1. Push to main triggers deployment
2. Run test suite (unit + integration)
3. Build frontend and backend
4. Run Prisma migrations
5. Deploy to production
6. Run smoke tests

**Monitoring**:
- Frontend: Vercel Analytics (Core Web Vitals)
- Backend: NestJS Logger + CloudWatch/Datadog
- Database: PostgreSQL slow query log
- Errors: Sentry for error tracking

### Scalability Plan

**Horizontal Scaling**:
- Stateless API enables multiple backend instances
- Load balancer distributes traffic
- Database connection pool per instance

**Vertical Scaling**:
- Increase Postgres resources as data grows
- Add read replicas for reporting queries

**Caching Strategy** (future):
- Redis for frequently accessed data (dashboard stats)
- CDN for static assets (already handled by Vercel)

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Concurrent inventory updates | Data inconsistency | PostgreSQL transactions, optimistic locking |
| Slow dashboard load | Poor UX (SC-001 violation) | SSR, query optimization, caching |
| Token theft | Security breach | RTR, httpOnly cookies, short expiry |
| Database migration failure | Downtime | Test migrations in staging, backup before deploy |
| Third-party dependency vulnerability | Security risk | Automated dependency scanning (Dependabot) |
| Exceeded 50 concurrent users | Performance degradation | Load testing, horizontal scaling plan |

## Open Questions

None - all technical decisions resolved based on specified stack (Next.js, Shadcn, NestJS, Prisma, JWT/RTR, PostgreSQL)
