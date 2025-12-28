# EVADMS Railway Deployment Guide

## Prerequisites

- Railway account (https://railway.app)
- GitHub repository connected to Railway

## Deployment Steps

### 1. Create Railway Project

1. Go to Railway dashboard and create a new project
2. Add a PostgreSQL database service
3. Note: Railway will auto-inject `DATABASE_URL` into your services

### 2. Deploy API Service

1. Add a new service from GitHub repo
2. Set root directory: `evadms/apps/api`
3. Add environment variables:
   ```
   JWT_SECRET=ctlGgQhtkSOQYXPw1U86b/gRPL1N9rORc48VUSgcfvtNGVbFU4hri09TQ6RJnjDDjL+mIlliX5XORksZALbKhw==
   JWT_REFRESH_SECRET=ARv4rOgxUsooUGDrvRUJTdp2mgePaG4H9Y/5tKjDeoc2kPL4kdz4+9ICthro3YRairYaPN2KeRKaPcqzhzynGw==
   JWT_EXPIRES_IN=15m
   JWT_REFRESH_EXPIRES_IN=7d
   NODE_ENV=production
   CORS_ORIGINS=<your-web-url>,<your-mobile-url>
   ```
4. Link the PostgreSQL database (this auto-sets DATABASE_URL)
5. Generate a domain or use custom domain

### 3. Deploy Web Dashboard

1. Add a new service from GitHub repo
2. Set root directory: `evadms/apps/web`
3. Add environment variables:
   ```
   NEXT_PUBLIC_API_URL=https://<your-api-domain>
   NEXT_PUBLIC_APP_URL=https://<your-web-domain>
   ```
4. Generate a domain

### 4. Deploy Mobile PWA

1. Add a new service from GitHub repo
2. Set root directory: `evadms/apps/mobile`
3. Add environment variables:
   ```
   NEXT_PUBLIC_API_URL=https://<your-api-domain>
   NEXT_PUBLIC_APP_URL=https://<your-mobile-domain>
   ```
4. Generate a domain

### 5. Update CORS Origins

After all services are deployed, go back to the API service and update:
```
CORS_ORIGINS=https://your-web.up.railway.app,https://your-mobile.up.railway.app
```

### 6. Update Landing Page

Update the login redirect in `/script.js` on the main EVAGas website to point to the deployed web dashboard.

## Service Ports

- API: 3000
- Web: 3001
- Mobile: 3002

## Health Checks

- API: `/api/health`
- Web: `/`
- Mobile: `/`

## Database Migrations

Migrations run automatically on API startup via `npx prisma migrate deploy`.

## Troubleshooting

1. **Build fails**: Check that all dependencies are in package.json
2. **Database connection fails**: Ensure PostgreSQL is linked to the API service
3. **CORS errors**: Update CORS_ORIGINS with the correct Railway domains
4. **Auth not working**: Verify JWT secrets are set correctly
