# API Contracts

**Feature**: Warehouse Inventory ERP System
**API Version**: 1.0.0
**Specification Format**: OpenAPI 3.0.3

## Overview

This directory contains the API contract specifications for the Warehouse Inventory ERP system. The API follows RESTful conventions and uses JWT-based authentication with refresh token rotation.

## Files

- **api.yaml**: Complete OpenAPI 3.0 specification with all endpoints, schemas, and examples

## Base URLs

- **Development**: `http://localhost:3001/api`
- **Production**: `https://api.warehouse-erp.com/api`

## Authentication

All endpoints except `/auth/login` and `/auth/refresh` require authentication via JWT bearer token.

### Authentication Flow

1. **Login**: POST `/auth/login` with email + password
   - Returns: Access token (JSON) + Refresh token (httpOnly cookie)
   - Access token expires: 15 minutes
   - Refresh token expires: 7 days

2. **Authenticated Requests**: Include access token in Authorization header
   ```
   Authorization: Bearer <access-token>
   ```

3. **Token Refresh**: When access token expires (401 response)
   - POST `/auth/refresh` automatically sends refresh token cookie
   - Returns: New access token + New refresh token (RTR pattern)
   - Frontend should retry failed request with new token

4. **Logout**: POST `/auth/logout` revokes refresh token

### Security Features

- **RTR (Refresh Token Rotation)**: Each refresh generates new token, old token revoked
- **HttpOnly Cookies**: Refresh token stored in secure httpOnly cookie (XSS protection)
- **Token Expiry**: Short-lived access tokens minimize exposure window
- **Multi-Device**: Each device gets unique refresh token

## API Resources

### Warehouses

- `GET /warehouses` - List all warehouses (paginated)
- `POST /warehouses` - Create new warehouse
- `GET /warehouses/:id` - Get warehouse details
- `PATCH /warehouses/:id` - Update warehouse
- `DELETE /warehouses/:id` - Soft delete warehouse
- `GET /warehouses/:id/inventory` - Get warehouse inventory

### Items

- `GET /items` - List all items (paginated, filterable by category)
- `POST /items` - Create new item
- `GET /items/:id` - Get item details with total quantity
- `PATCH /items/:id` - Update item
- `DELETE /items/:id` - Soft delete item

### Inventory

- `POST /inventory` - Assign item to warehouse with quantity
- `PATCH /inventory/:id` - Update inventory quantity (manual adjustment)

### Transactions

- `GET /transactions` - List transactions (filterable by type, warehouse, item, date range)
- `POST /transactions` - Create inbound/outbound transaction
- `GET /transactions/:id` - Get transaction details

### Dashboard

- `GET /dashboard/stats` - Aggregated statistics (warehouse count, item count, low stock, utilization)
- `GET /dashboard/recent-transactions` - Recent transactions (default: 10)

## Common Patterns

### Pagination

All list endpoints support pagination via query parameters:

```
GET /items?page=1&limit=20
```

Response format:
```json
{
  "data": [...],
  "meta": {
    "total": 100,
    "page": 1,
    "limit": 20,
    "totalPages": 5
  }
}
```

### Filtering

Endpoints support filtering via query parameters:

```
GET /transactions?type=INBOUND&warehouseId=<uuid>&startDate=2025-01-01&endDate=2025-01-31
```

### Searching

List endpoints support search via `search` query parameter:

```
GET /warehouses?search=Seoul
GET /items?search=widget
```

### Error Responses

All errors follow consistent format:

```json
{
  "statusCode": 400,
  "message": "Warehouse capacity must be positive",
  "error": "Bad Request",
  "timestamp": "2025-10-17T12:00:00Z",
  "path": "/api/warehouses"
}
```

**HTTP Status Codes**:
- `200 OK` - Success (GET, PATCH)
- `201 Created` - Resource created (POST)
- `204 No Content` - Success with no response body (DELETE)
- `400 Bad Request` - Validation error
- `401 Unauthorized` - Missing or invalid authentication
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `409 Conflict` - Business logic conflict (e.g., duplicate SKU, insufficient inventory)
- `500 Internal Server Error` - Server error

## Data Validation

### Frontend (Zod)

Zod schemas validate form inputs before API calls:

```typescript
const warehouseSchema = z.object({
  name: z.string().min(2).max(100),
  location: z.string().min(2).max(200),
  capacity: z.number().positive().multipleOf(0.01)
});
```

### Backend (class-validator)

DTOs validate incoming requests:

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
```

## Multi-Tenancy

All resources are isolated by company. The API automatically filters data based on authenticated user's `companyId`:

- Users can only access their company's warehouses, items, transactions
- Cross-company data access is prevented at database query level
- No `companyId` parameter needed in requests (derived from JWT)

## Business Rules

### Warehouse Capacity

- Capacity must be positive number
- Utilization calculated as: `SUM(inventory.quantity) / warehouse.capacity * 100`
- Warning displayed when utilization >80%

### Item SKU

- SKU must be unique across entire system (not just within company)
- Duplicate SKU returns 409 Conflict error
- SKU format: Alphanumeric + hyphens (e.g., `ITEM-001`)

### Inventory Transactions

**Inbound Transaction**:
- Adds to inventory quantity
- Updates `lastRestockedAt` timestamp
- No quantity validation required

**Outbound Transaction**:
- Subtracts from inventory quantity
- Validates sufficient quantity available
- Returns 400 Bad Request if insufficient inventory
- Prevents negative inventory

**Transaction Immutability**:
- Transactions cannot be edited or deleted (audit trail)
- Manual inventory adjustments create audit transaction

## Testing

### Contract Testing

Use OpenAPI spec for contract testing:

```bash
# Validate API responses against spec
npm run test:contract
```

### Integration Testing

Example test using Supertest:

```typescript
describe('POST /warehouses', () => {
  it('creates warehouse with valid data', async () => {
    const response = await request(app)
      .post('/api/warehouses')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: 'Test Warehouse',
        location: 'Seoul',
        capacity: 1000
      })
      .expect(201);

    expect(response.body).toMatchObject({
      name: 'Test Warehouse',
      location: 'Seoul',
      capacity: 1000
    });
  });

  it('rejects invalid capacity', async () => {
    await request(app)
      .post('/api/warehouses')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: 'Test Warehouse',
        location: 'Seoul',
        capacity: -100
      })
      .expect(400);
  });
});
```

## API Documentation

### Viewing the Spec

**Swagger UI** (recommended for interactive exploration):

```bash
# Install Swagger UI Express
npm install swagger-ui-express

# View at http://localhost:3001/api-docs
```

**Redoc** (alternative, cleaner documentation):

```bash
npx @redocly/cli preview-docs contracts/api.yaml
```

### Generating Client SDKs

Generate TypeScript client from OpenAPI spec:

```bash
npx @openapitools/openapi-generator-cli generate \
  -i contracts/api.yaml \
  -g typescript-axios \
  -o src/lib/api/generated
```

## Changelog

### Version 1.0.0 (2025-10-17)

- Initial API specification
- Authentication endpoints with JWT + RTR
- Warehouse CRUD operations
- Item master data management
- Inventory management
- Transaction tracking (inbound/outbound)
- Dashboard statistics and recent transactions

## Support

For API issues or questions:
- **Email**: support@warehouse-erp.com
- **Documentation**: See [quickstart.md](../quickstart.md) for development guide
- **Data Model**: See [data-model.md](../data-model.md) for entity relationships
