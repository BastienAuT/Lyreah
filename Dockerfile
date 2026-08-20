FROM oven/bun:1.3.14-alpine AS dependencies
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

FROM dependencies AS builder
ARG NEXT_PUBLIC_SITE_URL
ARG NEXT_PUBLIC_LEGAL_PUBLISHER_STATUS
ARG NEXT_PUBLIC_LEGAL_PUBLISHER_NAME
ARG NEXT_PUBLIC_LEGAL_PUBLISHER_ADDRESS
ARG NEXT_PUBLIC_LEGAL_CONTACT_EMAIL
ARG NEXT_PUBLIC_LEGAL_HOST_IDENTITY_CONFIRMED
ARG NEXT_PUBLIC_LEGAL_HOST_NAME
ARG NEXT_PUBLIC_LEGAL_HOST_ADDRESS
ARG NEXT_PUBLIC_LEGAL_HOST_CONTACT
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
ARG NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET=lyreah
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN bun run build

FROM node:24-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
