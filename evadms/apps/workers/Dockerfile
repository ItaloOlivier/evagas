# Base stage
FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies
FROM base AS deps
COPY package.json ./
COPY apps/workers/package.json ./apps/workers/
COPY packages/shared/package.json ./packages/shared/
RUN npm install

# Build stage
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set environment for build
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Build the workers PWA
RUN npm run build --workspace=@evadms/workers

# Production stage
FROM base AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
USER nextjs

# Copy standalone output
COPY --from=builder --chown=nextjs:nodejs /app/apps/workers/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/workers/.next/static ./apps/workers/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/workers/public ./apps/workers/public

EXPOSE 3003

ENV PORT=3003
ENV HOSTNAME="0.0.0.0"

CMD ["node", "apps/workers/server.js"]
