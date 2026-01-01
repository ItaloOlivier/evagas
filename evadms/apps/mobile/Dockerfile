# Base stage
FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat

# Install dependencies
FROM base AS deps
WORKDIR /app
COPY evadms/package.json ./
COPY evadms/apps/mobile/package.json ./apps/mobile/
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

# Build-time argument for API URL (Next.js bakes NEXT_PUBLIC_* at build time)
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

RUN npm run build --workspace=@evadms/mobile

# Production stage
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3002
ENV HOSTNAME="0.0.0.0"

RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs

# Copy the entire standalone output first
COPY --from=builder /app/apps/mobile/.next/standalone ./

# Static files at the correct location relative to server.js location
COPY --from=builder /app/apps/mobile/.next/static ./apps/mobile/.next/static

# Public files at the correct location relative to server.js
COPY --from=builder /app/apps/mobile/public ./apps/mobile/public

RUN chown -R nextjs:nodejs /app
USER nextjs

EXPOSE 3002

# server.js is at apps/mobile/server.js within the standalone output
CMD ["node", "apps/mobile/server.js"]
