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

The API is deployed to Railway at: `https://evagas-production.up.railway.app`

**Required Environment Variables:**
| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string (auto-injected by Railway) |
| `JWT_SECRET` | Secret key for JWT signing (use `openssl rand -hex 32`) |
| `JWT_ACCESS_EXPIRY` | Access token expiry (default: `15m`) |
| `JWT_REFRESH_EXPIRY` | Refresh token expiry (default: `7d`) |
| `CORS_ORIGINS` | Comma-separated allowed origins |

**Endpoints:**
- Health check: `/health`
- API root: `/`
- API v1: `/api/v1/*`
- Swagger docs: `/api/docs`

**Deployment Steps:**
1. Create Railway project with PostgreSQL database
2. Add environment variables (JWT_SECRET is required)
3. Push to main branch - Railway auto-deploys
4. Run database seed: `npm run db:seed`

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

## Notes for Claude

- Backend follows NestJS patterns with modules, services, controllers
- State machines are implemented in service layers with transition validation
- Inventory uses append-only movements ledger for audit trail
- Checklists can block workflows when critical items fail
- Audit events include SHA-256 hash chain for tamper detection
- Mobile PWA is designed for offline-first operation
