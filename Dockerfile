# Build native better-sqlite3 dependencies on the same Alpine base as runtime.
FROM node:20-alpine AS deps
RUN apk add --no-cache python3 make g++ sqlite-dev
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
# Build-time placeholder only; Render injects a separately generated runtime secret.
ENV MARHABA_SESSION_SECRET=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef
RUN npm run build

FROM node:20-alpine AS runner
RUN apk add --no-cache sqlite-libs su-exec
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=10000
ENV HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/package-lock.json ./package-lock.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/src ./src
COPY --from=builder /app/scripts ./scripts
COPY --from=builder /app/next.config.ts ./next.config.ts

RUN mkdir -p /app/data /app/public/uploads /app/backups \
  && chown -R nextjs:nodejs /app

EXPOSE 10000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- "http://127.0.0.1:${PORT}/api/v1/health" || exit 1

# The /app/data mount on Render stores SQLite, session secret, private KYC uploads,
# public listing uploads, and backups across deploys/restarts.
CMD ["sh", "-c", "mkdir -p /app/data/uploads /app/data/backups /app/data/private-uploads /app/public/uploads && rm -rf /app/public/uploads/marhaba && ln -s /app/data/uploads /app/public/uploads/marhaba && rm -rf /app/backups && ln -s /app/data/backups /app/backups && chown -R nextjs:nodejs /app/data /app/public/uploads /app/backups && exec su-exec nextjs npm run start"]
