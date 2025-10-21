# Data Model: Warehouse Inventory ERP System

**Feature**: 001-warehouse-inventory-erp
**Date**: 2025-10-17
**Purpose**: Database schema and entity relationships

## Entity Relationship Overview

```
Company (1) ──< (M) User
Company (1) ──< (M) Warehouse
Company (1) ──< (M) Item
Company (1) ──< (M) Transaction

Warehouse (1) ──< (M) Inventory >── (M) Item
Warehouse (1) ──< (M) Transaction
Item (1) ──< (M) Transaction

User (1) ──< (M) Transaction (createdBy)
User (M) ──> (1) Company
```

**Multi-Tenancy**: All entities except `RefreshToken` have `companyId` foreign key for data isolation

## Entities

### Company

Represents an organization using the system. Each company's data is isolated from other companies.

**Fields**:
- `id`: String (UUID, primary key)
- `name`: String (required, company legal name)
- `email`: String (unique, contact email)
- `phone`: String (nullable, contact phone)
- `address`: String (nullable, business address)
- `createdAt`: DateTime (auto-generated)
- `updatedAt`: DateTime (auto-updated)

**Relationships**:
- `users`: One-to-many with User (company has multiple users)
- `warehouses`: One-to-many with Warehouse
- `items`: One-to-many with Item
- `transactions`: One-to-many with Transaction

**Indexes**:
- Primary key on `id`
- Unique index on `email`

**Validation Rules**:
- `name`: 2-100 characters
- `email`: Valid email format
- `phone`: Optional, E.164 format if provided

**Business Rules**:
- Cannot delete company if it has users, warehouses, items, or transactions (foreign key constraints)
- Company creation includes default admin user

---

### User

Represents an employee with access to the system. Each user belongs to exactly one company.

**Fields**:
- `id`: String (UUID, primary key)
- `email`: String (unique, login credential)
- `password`: String (bcrypt hashed, cost factor 12)
- `name`: String (required, display name)
- `role`: Enum (ADMIN, MANAGER, USER - default: USER)
- `companyId`: String (foreign key to Company, required)
- `isActive`: Boolean (default: true, for soft deactivation)
- `lastLoginAt`: DateTime (nullable, tracks last login)
- `createdAt`: DateTime (auto-generated)
- `updatedAt`: DateTime (auto-updated)

**Relationships**:
- `company`: Many-to-one with Company (user belongs to one company)
- `transactions`: One-to-many with Transaction (transactions created by this user)
- `refreshTokens`: One-to-many with RefreshToken (active session tokens)

**Indexes**:
- Primary key on `id`
- Unique index on `email` (login lookup)
- Index on `companyId` (multi-tenant filtering)
- Index on `(companyId, role)` for role-based queries

**Validation Rules**:
- `email`: Valid email format, lowercase
- `password`: Min 8 characters, stored hashed (never plain text)
- `name`: 2-100 characters
- `role`: One of [ADMIN, MANAGER, USER]

**Business Rules**:
- Email must be unique across entire system
- Password must be hashed before storing
- Cannot delete user if they created transactions (maintain audit trail)
- Deactivated users (`isActive = false`) cannot login but data preserved

**Security**:
- Password hashing: `bcrypt.hash(password, 12)`
- Password never returned in API responses (select exclude in Prisma)

---

### RefreshToken

Stores refresh tokens for JWT authentication with rotation (RTR pattern).

**Fields**:
- `id`: String (UUID, primary key)
- `token`: String (unique, hashed refresh token)
- `userId`: String (foreign key to User, required)
- `expiresAt`: DateTime (token expiration, typically 7 days)
- `isRevoked`: Boolean (default: false, manually revoked tokens)
- `createdAt`: DateTime (auto-generated)

**Relationships**:
- `user`: Many-to-one with User (token belongs to one user)

**Indexes**:
- Primary key on `id`
- Unique index on `token` (fast lookup during refresh)
- Index on `userId` (find all user tokens)
- Index on `(userId, expiresAt, isRevoked)` for cleanup queries

**Validation Rules**:
- `token`: Must be hashed before storing
- `expiresAt`: Must be future timestamp

**Business Rules**:
- Token is single-use (deleted or revoked after use)
- Expired tokens auto-deleted via cron job (daily cleanup)
- Revoked tokens remain in database for audit (30-day retention)
- User can have multiple active tokens (multi-device support)

---

### Warehouse

Represents a physical storage location. Warehouses belong to a company and store multiple items.

**Fields**:
- `id`: String (UUID, primary key)
- `name`: String (required, warehouse identifier)
- `location`: String (required, physical address or location code)
- `capacity`: Decimal (required, maximum storage capacity in cubic meters)
- `companyId`: String (foreign key to Company, required)
- `deletedAt`: DateTime (nullable, soft delete timestamp)
- `createdAt`: DateTime (auto-generated)
- `updatedAt`: DateTime (auto-updated)

**Relationships**:
- `company`: Many-to-one with Company (warehouse belongs to one company)
- `inventory`: One-to-many with Inventory (items stored in warehouse)
- `transactions`: One-to-many with Transaction (transactions at this warehouse)

**Indexes**:
- Primary key on `id`
- Index on `companyId` (multi-tenant filtering)
- Index on `(companyId, deletedAt)` for active warehouse queries

**Validation Rules**:
- `name`: 2-100 characters
- `location`: 2-200 characters
- `capacity`: Positive number, max 2 decimal places (e.g., 1000.50)

**Business Rules**:
- Cannot hard delete if warehouse has inventory or transaction history
- Soft delete sets `deletedAt` timestamp
- Capacity warnings when utilization >80% (calculated from inventory)
- Warehouse utilization = SUM(inventory.quantity * item.volumePerUnit) / capacity

**Computed Fields** (not stored, calculated on query):
- `currentUtilization`: Percentage of capacity used
- `itemCount`: Number of distinct items in warehouse
- `totalQuantity`: Sum of all item quantities

---

### Item

Represents a product or material in the master catalog. Items exist across all warehouses with different quantities.

**Fields**:
- `id`: String (UUID, primary key)
- `sku`: String (unique, stock keeping unit / product code)
- `name`: String (required, item display name)
- `category`: String (nullable, item categorization - e.g., "Electronics", "Raw Materials")
- `unitOfMeasure`: String (required, e.g., "EA", "KG", "LITER")
- `description`: Text (nullable, detailed item description)
- `reorderThreshold`: Int (nullable, low stock alert level)
- `companyId`: String (foreign key to Company, required)
- `deletedAt`: DateTime (nullable, soft delete timestamp)
- `createdAt`: DateTime (auto-generated)
- `updatedAt`: DateTime (auto-updated)

**Relationships**:
- `company`: Many-to-one with Company (item belongs to one company)
- `inventory`: One-to-many with Inventory (item stored in multiple warehouses)
- `transactions`: One-to-many with Transaction (item movement history)

**Indexes**:
- Primary key on `id`
- Unique index on `sku` (duplicate prevention, fast lookup)
- Index on `companyId` (multi-tenant filtering)
- Index on `(companyId, category)` for category filtering
- Index on `(companyId, deletedAt)` for active item queries

**Validation Rules**:
- `sku`: 2-50 characters, alphanumeric + hyphens
- `name`: 2-200 characters
- `category`: 2-50 characters if provided
- `unitOfMeasure`: One of standard UOM codes (EA, KG, LITER, METER, etc.)
- `reorderThreshold`: Non-negative integer if provided

**Business Rules**:
- SKU must be unique across entire system (not just within company)
- Cannot hard delete if item has inventory or transaction history
- Soft delete sets `deletedAt` timestamp
- Low stock alert triggered when total quantity <= reorderThreshold

**Computed Fields** (not stored, calculated on query):
- `totalQuantity`: Sum of quantities across all warehouses
- `warehouseCount`: Number of warehouses storing this item
- `lowStockWarning`: Boolean, true if totalQuantity <= reorderThreshold

---

### Inventory

Links items to warehouses with current quantity. Represents "Item X is stored in Warehouse Y with quantity Z".

**Fields**:
- `id`: String (UUID, primary key)
- `warehouseId`: String (foreign key to Warehouse, required)
- `itemId`: String (foreign key to Item, required)
- `quantity`: Decimal (required, current stock level, 2 decimal places)
- `lastRestockedAt`: DateTime (nullable, last inbound transaction timestamp)
- `updatedAt`: DateTime (auto-updated on quantity change)

**Relationships**:
- `warehouse`: Many-to-one with Warehouse (inventory in one warehouse)
- `item`: Many-to-one with Item (inventory for one item)

**Indexes**:
- Primary key on `id`
- Unique composite index on `(warehouseId, itemId)` - one entry per item per warehouse
- Index on `warehouseId` (warehouse detail page query)
- Index on `itemId` (item locations query)

**Validation Rules**:
- `quantity`: Non-negative number, max 2 decimal places
- `(warehouseId, itemId)`: Combination must be unique

**Business Rules**:
- Quantity updated automatically when transactions recorded
- Quantity cannot go negative (validated in transaction service)
- Zero quantity records may be kept or deleted (design choice: keep for history)
- Last restocked timestamp updated only on inbound transactions

**State Transitions**:
```
[Create] → quantity = 0
[Inbound Transaction] → quantity += transactionQuantity, lastRestockedAt = now
[Outbound Transaction] → quantity -= transactionQuantity
[Zero Quantity] → Optional: soft delete or keep with quantity=0
```

---

### Transaction

Immutable audit trail of inventory movements (inbound/outbound). Transactions cannot be edited or deleted after creation.

**Fields**:
- `id`: String (UUID, primary key)
- `type`: Enum (INBOUND, OUTBOUND - required)
- `warehouseId`: String (foreign key to Warehouse, required)
- `itemId`: String (foreign key to Item, required)
- `quantity`: Decimal (required, amount moved, 2 decimal places)
- `notes`: Text (nullable, optional transaction notes)
- `createdBy`: String (foreign key to User, required - who performed transaction)
- `companyId`: String (foreign key to Company, required - for multi-tenant filtering)
- `createdAt`: DateTime (auto-generated, transaction timestamp)

**Relationships**:
- `warehouse`: Many-to-one with Warehouse (transaction at one warehouse)
- `item`: Many-to-one with Item (transaction for one item)
- `user`: Many-to-one with User (transaction created by one user)
- `company`: Many-to-one with Company (transaction belongs to one company)

**Indexes**:
- Primary key on `id`
- Index on `companyId` (multi-tenant filtering)
- Index on `(companyId, type)` for filtering inbound/outbound
- Index on `(companyId, createdAt DESC)` for recent transactions (dashboard)
- Index on `(warehouseId, createdAt DESC)` for warehouse history
- Index on `(itemId, createdAt DESC)` for item movement history

**Validation Rules**:
- `type`: Must be INBOUND or OUTBOUND
- `quantity`: Positive number, max 2 decimal places
- `notes`: Max 1000 characters if provided

**Business Rules**:
- Transactions are immutable (no UPDATE or DELETE operations)
- Outbound transactions require sufficient inventory (quantity validation)
- Transaction creation triggers inventory update in same database transaction
- Audit trail preserved indefinitely (no deletion)
- All transactions include user attribution for accountability

**Transaction Processing**:
```typescript
// Inbound transaction
BEGIN TRANSACTION
  INSERT INTO Transaction (type=INBOUND, quantity=100)
  UPDATE Inventory SET quantity += 100, lastRestockedAt = NOW()
COMMIT

// Outbound transaction
BEGIN TRANSACTION
  CHECK Inventory.quantity >= 50 (prevent negative stock)
  INSERT INTO Transaction (type=OUTBOUND, quantity=50)
  UPDATE Inventory SET quantity -= 50
COMMIT
```

---

## Prisma Schema

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model Company {
  id           String        @id @default(uuid())
  name         String
  email        String        @unique
  phone        String?
  address      String?
  createdAt    DateTime      @default(now())
  updatedAt    DateTime      @updatedAt

  users        User[]
  warehouses   Warehouse[]
  items        Item[]
  transactions Transaction[]

  @@map("companies")
}

model User {
  id            String         @id @default(uuid())
  email         String         @unique
  password      String
  name          String
  role          Role           @default(USER)
  companyId     String
  isActive      Boolean        @default(true)
  lastLoginAt   DateTime?
  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt

  company       Company        @relation(fields: [companyId], references: [id])
  transactions  Transaction[]
  refreshTokens RefreshToken[]

  @@index([companyId])
  @@index([companyId, role])
  @@map("users")
}

enum Role {
  ADMIN
  MANAGER
  USER
}

model RefreshToken {
  id        String   @id @default(uuid())
  token     String   @unique
  userId    String
  expiresAt DateTime
  isRevoked Boolean  @default(false)
  createdAt DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([userId, expiresAt, isRevoked])
  @@map("refresh_tokens")
}

model Warehouse {
  id          String      @id @default(uuid())
  name        String
  location    String
  capacity    Decimal     @db.Decimal(10, 2)
  companyId   String
  deletedAt   DateTime?
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt

  company      Company       @relation(fields: [companyId], references: [id])
  inventory    Inventory[]
  transactions Transaction[]

  @@index([companyId])
  @@index([companyId, deletedAt])
  @@map("warehouses")
}

model Item {
  id               String      @id @default(uuid())
  sku              String      @unique
  name             String
  category         String?
  unitOfMeasure    String
  description      String?     @db.Text
  reorderThreshold Int?
  companyId        String
  deletedAt        DateTime?
  createdAt        DateTime    @default(now())
  updatedAt        DateTime    @updatedAt

  company      Company       @relation(fields: [companyId], references: [id])
  inventory    Inventory[]
  transactions Transaction[]

  @@index([companyId])
  @@index([companyId, category])
  @@index([companyId, deletedAt])
  @@map("items")
}

model Inventory {
  id              String    @id @default(uuid())
  warehouseId     String
  itemId          String
  quantity        Decimal   @db.Decimal(10, 2)
  lastRestockedAt DateTime?
  updatedAt       DateTime  @updatedAt

  warehouse Warehouse @relation(fields: [warehouseId], references: [id])
  item      Item      @relation(fields: [itemId], references: [id])

  @@unique([warehouseId, itemId])
  @@index([warehouseId])
  @@index([itemId])
  @@map("inventory")
}

model Transaction {
  id          String          @id @default(uuid())
  type        TransactionType
  warehouseId String
  itemId      String
  quantity    Decimal         @db.Decimal(10, 2)
  notes       String?         @db.Text
  createdBy   String
  companyId   String
  createdAt   DateTime        @default(now())

  warehouse Warehouse @relation(fields: [warehouseId], references: [id])
  item      Item      @relation(fields: [itemId], references: [id])
  user      User      @relation(fields: [createdBy], references: [id])
  company   Company   @relation(fields: [companyId], references: [id])

  @@index([companyId])
  @@index([companyId, type])
  @@index([companyId, createdAt(sort: Desc)])
  @@index([warehouseId, createdAt(sort: Desc)])
  @@index([itemId, createdAt(sort: Desc)])
  @@map("transactions")
}

enum TransactionType {
  INBOUND
  OUTBOUND
}
```

## Data Flow Diagrams

### User Login Flow

```
1. User submits email + password
2. Backend validates credentials
3. Generate access token (15min) + refresh token (7 days)
4. Store refresh token in database (hashed)
5. Return access token (JSON) + refresh token (httpOnly cookie)
6. Frontend stores access token in memory
7. All API requests include access token in Authorization header
```

### Token Refresh Flow

```
1. Access token expires (401 response)
2. Frontend automatically calls /auth/refresh with refresh token cookie
3. Backend validates refresh token
4. Generate new access token + new refresh token (rotation)
5. Revoke old refresh token in database
6. Return new tokens
7. Frontend retries original request with new access token
```

### Warehouse Creation Flow

```
1. User fills warehouse form (name, location, capacity)
2. Frontend validates with Zod schema
3. POST /warehouses with form data
4. Backend validates with class-validator
5. Insert Warehouse record with user's companyId
6. Return created warehouse
7. Frontend updates cache and shows success toast
```

### Transaction Creation Flow

```
1. User selects item, warehouse, quantity, type (inbound/outbound)
2. Frontend validates quantity > 0
3. POST /transactions with transaction data
4. Backend starts database transaction:
   a. Validate user has permission (same company)
   b. If OUTBOUND: Check inventory.quantity >= transaction.quantity
   c. Insert Transaction record
   d. Update Inventory quantity (+/- transaction.quantity)
   e. If INBOUND: Update inventory.lastRestockedAt
5. Commit database transaction
6. Return created transaction
7. Frontend invalidates inventory and transaction queries (refetch)
```

### Dashboard Data Loading

```
1. User navigates to dashboard
2. Frontend makes parallel API calls:
   - GET /dashboard/stats (aggregate data)
   - GET /dashboard/recent-transactions?limit=10
3. Backend queries:
   - Stats: Count warehouses, items, calculate total inventory value
   - Recent: Query transactions ordered by createdAt DESC limit 10
   - Low stock: Query items where totalQuantity <= reorderThreshold
4. Return JSON responses
5. Frontend renders dashboard with server data
6. TanStack Query caches data for 30 seconds
```

## Migration Strategy

### Initial Migration

```sql
-- Create enums
CREATE TYPE "Role" AS ENUM ('ADMIN', 'MANAGER', 'USER');
CREATE TYPE "TransactionType" AS ENUM ('INBOUND', 'OUTBOUND');

-- Create tables (Prisma generates full CREATE TABLE statements)
-- Tables created in order: Company → User → RefreshToken, Warehouse, Item → Inventory, Transaction

-- Create indexes (see Prisma schema @index directives)

-- Seed development data
INSERT INTO companies (id, name, email) VALUES
  ('...', 'Demo Company', 'demo@example.com');

INSERT INTO users (id, email, password, name, role, companyId) VALUES
  ('...', 'admin@example.com', '<hashed>', 'Admin User', 'ADMIN', '...');
```

### Future Migrations

Use Prisma Migrate for schema changes:

```bash
# Create migration for schema change
prisma migrate dev --name add_item_barcode_field

# Apply migration to production
prisma migrate deploy
```

**Migration Best Practices**:
- Always test migrations in staging first
- Use database backups before production migrations
- Avoid breaking changes (additive migrations preferred)
- Use `@default` for new required fields on existing tables
- Document complex migrations with SQL comments

## Data Seeding

**Development Seed** (`prisma/seed.ts`):

```typescript
// Create demo company
const company = await prisma.company.create({
  data: {
    name: 'Demo Warehouse Inc',
    email: 'demo@warehouse.com',
    users: {
      create: {
        email: 'admin@demo.com',
        password: await bcrypt.hash('password123', 12),
        name: 'Demo Admin',
        role: 'ADMIN'
      }
    },
    warehouses: {
      create: [
        { name: 'Main Warehouse', location: 'Seoul', capacity: 1000 },
        { name: 'Secondary Storage', location: 'Busan', capacity: 500 }
      ]
    },
    items: {
      create: [
        { sku: 'ITEM-001', name: 'Widget A', unitOfMeasure: 'EA', category: 'Parts' },
        { sku: 'ITEM-002', name: 'Component B', unitOfMeasure: 'KG', category: 'Raw Materials' }
      ]
    }
  }
});

// Create inventory records
// Create sample transactions
```

## Performance Considerations

### Query Optimization

**N+1 Query Prevention**:
- Use Prisma `include` for eager loading relationships
- Example: Load warehouse with inventory in single query
```typescript
const warehouse = await prisma.warehouse.findUnique({
  where: { id },
  include: {
    inventory: {
      include: { item: true }
    }
  }
});
```

**Pagination**:
- Cursor-based pagination for large datasets
- Limit default: 20 items per page
```typescript
const items = await prisma.item.findMany({
  take: 20,
  skip: (page - 1) * 20,
  where: { companyId },
  orderBy: { createdAt: 'desc' }
});
```

**Aggregations**:
- Use Prisma aggregate functions for dashboard stats
```typescript
const stats = await prisma.item.aggregate({
  where: { companyId },
  _count: true,
  _sum: { quantity: true }
});
```

### Index Usage

**Critical Indexes**:
- All foreign keys indexed for JOIN performance
- `(companyId, deletedAt)` composite indexes for active record queries
- `createdAt DESC` indexes for sorting transactions
- Unique indexes on `email`, `sku` for constraint enforcement

**Index Monitoring**:
- Use `EXPLAIN ANALYZE` on slow queries
- PostgreSQL query planner shows index usage
- Add indexes if sequential scans detected on large tables

## Data Validation

### Frontend Validation (Zod Schemas)

```typescript
const warehouseSchema = z.object({
  name: z.string().min(2).max(100),
  location: z.string().min(2).max(200),
  capacity: z.number().positive().multipleOf(0.01)
});

const transactionSchema = z.object({
  type: z.enum(['INBOUND', 'OUTBOUND']),
  warehouseId: z.string().uuid(),
  itemId: z.string().uuid(),
  quantity: z.number().positive().multipleOf(0.01),
  notes: z.string().max(1000).optional()
});
```

### Backend Validation (class-validator DTOs)

```typescript
export class CreateWarehouseDto {
  @IsString()
  @Length(2, 100)
  name: string;

  @IsString()
  @Length(2, 200)
  location: string;

  @IsNumber()
  @Min(0.01)
  capacity: number;
}

export class CreateTransactionDto {
  @IsEnum(TransactionType)
  type: TransactionType;

  @IsUUID()
  warehouseId: string;

  @IsUUID()
  itemId: string;

  @IsNumber()
  @Min(0.01)
  quantity: number;

  @IsString()
  @MaxLength(1000)
  @IsOptional()
  notes?: string;
}
```

## Backup and Recovery

**Backup Strategy**:
- Daily automated PostgreSQL dumps (pg_dump)
- 30-day retention policy
- Point-in-time recovery (PITR) enabled
- Backup verification via restore test (weekly)

**Disaster Recovery**:
- RTO (Recovery Time Objective): <4 hours
- RPO (Recovery Point Objective): <24 hours
- Recovery procedure documented in runbook

## Data Privacy and Compliance

**Multi-Tenancy Isolation**:
- Every query filtered by `companyId`
- Prisma middleware enforces company context
- No cross-company data leakage possible

**Audit Trail**:
- Transaction history immutable (regulatory compliance)
- User attribution on all transactions
- Soft deletes preserve historical data

**Data Retention**:
- Active data: Indefinite retention
- Deleted records: Soft delete with `deletedAt` timestamp
- Refresh tokens: 30-day retention after revocation
- Transaction logs: Permanent retention (audit requirements)
