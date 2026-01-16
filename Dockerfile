# To use this Dockerfile, you have to set `output: 'standalone'` in your next.config.mjs file.
# From https://github.com/vercel/next.js/blob/canary/examples/with-docker/Dockerfile

FROM node:24-alpine AS base

# Install dependencies only when needed
FROM base AS deps
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* ./
RUN \
  if [ -f yarn.lock ]; then yarn --frozen-lockfile; \
  elif [ -f package-lock.json ]; then npm ci; \
  elif [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm i --frozen-lockfile; \
  else echo "Lockfile not found." && exit 1; \
  fi


FROM base AS prod-deps
WORKDIR /app
COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* ./
RUN \
  if [ -f yarn.lock ]; then yarn --frozen-lockfile --production; \
  elif [ -f package-lock.json ]; then npm ci --omit=dev; \
  elif [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm i --prod --frozen-lockfile; \
  else echo "Lockfile not found." && exit 1; \
  fi


# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Next.js collects completely anonymous telemetry data about general usage.
# Learn more here: https://nextjs.org/telemetry
# Uncomment the following line in case you want to disable telemetry during the build.
# ENV NEXT_TELEMETRY_DISABLED 1

# Accept build arguments for NEXT_PUBLIC* environment variables
ARG NEXT_PUBLIC_SITE_URL
ARG NEXT_PUBLIC_AMAZON_AFFILIATE_TAG
ARG NEXT_PUBLIC_GA_ID
ARG NEXT_PUBLIC_TWITTER_HANDLE
ARG PAYLOAD_SECRET
ARG DATABASE_URI
ARG REDIS_URL

# Set NEXT_PUBLIC* environment variables from build args
# These will be embedded in the client-side bundle
ENV NEXT_PUBLIC_SITE_URL=${NEXT_PUBLIC_SITE_URL:-http://localhost:3000}
ENV NEXT_PUBLIC_AMAZON_AFFILIATE_TAG=${NEXT_PUBLIC_AMAZON_AFFILIATE_TAG}
ENV NEXT_PUBLIC_GA_ID=${NEXT_PUBLIC_GA_ID}
ENV NEXT_PUBLIC_TWITTER_HANDLE=${NEXT_PUBLIC_TWITTER_HANDLE}
ENV PAYLOAD_SECRET=${PAYLOAD_SECRET:-390a8f3033c47ea2e2c587ba}
ENV DATABASE_URI=${DATABASE_URI:-postgres://dummy:dummy@localhost:5432/dummy}
ENV REDIS_URL=${REDIS_URL:-redis://dummy:dummy@localhost:6379}

# Disable Next.js telemetry
ENV NEXT_TELEMETRY_DISABLED=1

# Skip static page generation during build (requires runtime DB)
ENV SKIP_ENV_VALIDATION=1

RUN \
  if [ -f yarn.lock ]; then yarn run build; \
  elif [ -f package-lock.json ]; then npm run build; \
  elif [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm run build; \
  else echo "Lockfile not found." && exit 1; \
  fi

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
# Uncomment the following line in case you want to disable telemetry during runtime.
# ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Remove this line if you do not have this folder
COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=prod-deps --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/src/migrations ./src/migrations
COPY --from=builder --chown=nextjs:nodejs /app/tsconfig.json ./tsconfig.json
COPY --from=builder --chown=nextjs:nodejs /app/src/payload.config.ts ./src/payload.config.ts
COPY --from=builder --chown=nextjs:nodejs /app/src/collections ./src/collections
COPY --from=builder --chown=nextjs:nodejs /app/src/services ./src/services
COPY --from=builder --chown=nextjs:nodejs /app/src/utilities ./src/utilities
COPY --from=builder --chown=nextjs:nodejs /app/src/lib ./src/lib

USER nextjs

EXPOSE 3000

ENV PORT=3000

# server.js is created by next build from the standalone output
# https://nextjs.org/docs/pages/api-reference/next-config-js/output
CMD HOSTNAME="0.0.0.0" node server.js
