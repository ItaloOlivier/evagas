# EVADMS - EVA Gas Depot Management System

## Project Overview

An ISO-ready LPG depot management system for EVA Gas, supporting operational workflows, quality/safety management, inventory tracking, dispatch reliability, and compliance.

## Architecture

This is a Turborepo monorepo with the following structure:

```
evadms/
├── apps/
│   ├── api/          # NestJS REST API (port 3000)
│   ├── web/          # Next.js Admin Dashboard (port 3001)
│   └── mobile/       # Next.js PWA for Drivers (port 3002)
├── packages/
│   ├── database/     # Prisma schema and migrations
│   └── shared/       # Shared types, constants, utilities
├── docker-compose.yml
├── railway.json
└── turbo.json
```

## Tech Stack

- **Backend**: NestJS, Prisma, PostgreSQL
- **Frontend**: Next.js 14, React, TailwindCSS, shadcn/ui
- **Mobile**: Next.js PWA with offline support
- **Auth**: JWT with refresh token rotation
- **Deployment**: Docker, Railway

## Key Modules

### Backend API

| Module | Description |
|--------|-------------|
| Auth | JWT authentication, refresh tokens, RBAC |
| Users | User management with role-based permissions |
| Customers | Customer and site management |
| Products | Products with tiered pricing |
| Quotes | Quote lifecycle (draft→sent→accepted→converted) |
| Orders | Order workflow state machine |
| Schedule | Vehicles, drivers, delivery runs |
| Inventory | Cylinder stock, movements ledger, refill batches, tanks |
| Checklists | Templates, responses, workflow blocking |
| POD | Proof of delivery capture |
| Reports | Sales, delivery, inventory, compliance reports |
| Audit | Immutable event log with hash chain |

### State Machines

**Quote Status Flow:**
```
draft → sent → accepted → converted
              ↓
           rejected
```

**Order Status Flow:**
```
created → scheduled → prepared → loading → dispatched → in_transit → arrived → delivered → closed
                                                                     ↓
                                                              partial_delivery/failed
```

**Refill Batch Flow:**
```
created → inspecting → filling → qc → passed → stocked
```

## Development

```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with your database credentials

# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:migrate

# Seed database
npm run db:seed

# Start all apps in development
npm run dev
```

## Environment Variables

### API (.env)
```
DATABASE_URL=postgresql://user:password@localhost:5432/evadms
JWT_SECRET=your-jwt-secret
JWT_REFRESH_SECRET=your-refresh-secret
```

### Web/Mobile (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:3000
```

## Database

The database uses PostgreSQL with Prisma ORM. Key entities:

- **Users/Roles**: Authentication and RBAC
- **Customers/Sites**: Customer management
- **Products/PricingTiers**: Product catalog with pricing
- **Quotes/QuoteLines**: Quote management
- **Orders/OrderLines**: Order processing
- **Vehicles/Drivers/ScheduleRuns**: Dispatch management
- **CylinderStock/CylinderMovements**: Inventory tracking
- **RefillBatches**: Cylinder refilling workflow
- **BulkTanks/TankReadings**: Bulk storage tracking
- **ChecklistTemplates/Responses**: Safety checklists
- **POD**: Proof of delivery
- **AuditEvents**: Immutable audit trail

## Deployment

### Docker Compose (Local)
```bash
docker-compose up -d
```

### Railway (Production)

**Services:**
- **API**: `https://evagas-production.up.railway.app`
- **Web Dashboard**: `https://web-production-30c2e.up.railway.app`

#### API Service Environment Variables:
| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string (auto-injected by Railway) |
| `JWT_SECRET` | Secret key for JWT signing (use `openssl rand -hex 32`) |
| `JWT_ACCESS_EXPIRY` | Access token expiry (default: `15m`) |
| `JWT_REFRESH_EXPIRY` | Refresh token expiry (default: `7d`) |
| `CORS_ORIGINS` | **Required**: Comma-separated allowed origins (e.g., `https://web-production-30c2e.up.railway.app`) |

#### Web Service Environment Variables:
| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_API_URL` | **Required**: API base URL (e.g., `https://evagas-production.up.railway.app`) |

**API Endpoints:**
- Health check: `/health`
- API root: `/`
- API v1: `/api/v1/*`
- Swagger docs: `/api/docs`

**Deployment Steps:**
1. Create Railway project with PostgreSQL database
2. Add API service with environment variables (JWT_SECRET, CORS_ORIGINS required)
3. Add Web service with environment variables (NEXT_PUBLIC_API_URL required)
4. Push to main branch - Railway auto-deploys
5. Run database seed: `npm run db:seed`

**Default Admin Credentials (after seeding):**
- Email: `admin@evagas.co.za`
- Password: `admin123!`

## Security

- **No public registration**: Users can only be created by admins via `/api/v1/users`
- **JWT authentication**: All protected endpoints require Bearer token
- **Role-based access control**: Admin, Depot Manager, Dispatcher, Driver, Sales, Yard Operator, QC Inspector
- **Refresh token rotation**: Tokens are rotated on each refresh for security

## API Documentation

When running, Swagger docs are available at:
- `http://localhost:3000/api/docs`

## Permissions Matrix

| Role | Permissions |
|------|-------------|
| Admin | Full access |
| Depot Manager | All operations except user management |
| Dispatcher | Schedule, orders, runs |
| Driver | Own runs, checklists, POD |
| Sales | Customers, quotes, orders |
| Yard Operator | Inventory, refill batches |
| QC Inspector | Checklists, refill QC |

## Error Handling System

The web app includes comprehensive error handling:

### API Error Class (`lib/api.ts`)
```typescript
ApiError {
  status: number;      // HTTP status code
  statusText: string;  // HTTP status text
  endpoint: string;    // API endpoint that failed
  method: string;      // HTTP method (GET, POST, etc.)
  requestData?: any;   // Request payload
  responseData?: any;  // Error response from server
  timestamp: string;   // ISO timestamp
}
```

### Error Utilities (`lib/error-utils.ts`)
- `getErrorMessage(error)` - Extract user-friendly error message
- `formatErrorForDisplay(error)` - Format error with title, message, and details
- `showErrorToast(error, title?)` - Show error toast notification
- `isAuthError(error)` - Check if 401/403 error
- `isServerError(error)` - Check if 5xx error
- `isValidationError(error)` - Check if 400/422 error
- `isNetworkError(error)` - Check if network/connection error

### Error Components (`components/`)
- `ErrorBoundary` - React class component that catches errors in children
- `PageError` - Full page error display with retry button
- `CardError` - Section-level error display
- `ErrorDisplay` - Card-based error with expandable debug info
- `InlineError` - Form field error messages

### Global Error Handling (`components/providers.tsx`)
- QueryCache with `onError` handler for query failures
- MutationCache with `onError` handler for mutation failures
- Smart retry logic - skips retries for 4xx errors
- Toast notifications for server errors

### Using Error Handling in Pages
```typescript
const { data, isLoading, error, refetch } = useUsers();

if (error) {
  return (
    <PageError
      error={error}
      title="Failed to load users"
      onRetry={() => refetch()}
    />
  );
}
```

## Notes for Claude

- Backend follows NestJS patterns with modules, services, controllers
- State machines are implemented in service layers with transition validation
- Inventory uses append-only movements ledger for audit trail
- Checklists can block workflows when critical items fail
- Audit events include SHA-256 hash chain for tamper detection
- Mobile PWA is designed for offline-first operation
- All API errors are wrapped in `ApiError` class with detailed logging
- Console groups errors with emoji prefix (🚨) for easy identification
- ErrorBoundary wraps all page content to catch React errors
