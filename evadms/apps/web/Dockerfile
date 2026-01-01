# Base stage
FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat

# Install dependencies
FROM base AS deps
WORKDIR /app
COPY evadms/package.json ./
COPY evadms/apps/web/package.json ./apps/web/
COPY evadms/packages/shared/package.json ./packages/shared/
COPY evadms/packages/database/package.json ./packages/database/
COPY evadms/packages/database/prisma ./packages/database/prisma/
RUN npm install

# Build stage
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY evadms/ .
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
RUN npm run build --workspace=@evadms/web

# Production stage
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3001
ENV HOSTNAME="0.0.0.0"

RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs

# Copy standalone output
COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder /app/apps/web/public ./apps/web/public

# Verify files exist
RUN ls -la /app/ && ls -la /app/apps/web/ && test -f /app/apps/web/server.js

RUN chown -R nextjs:nodejs /app
USER nextjs

EXPOSE 3001

CMD ["node", "apps/web/server.js"]
