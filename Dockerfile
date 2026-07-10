# syntax=docker/dockerfile:1

# ===== Base (alpine + pnpm) =====
FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat
RUN corepack enable && corepack prepare pnpm@10.29.3 --activate
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

# ===== Deps (lockfile 고정, 레이어 캐시) =====
FROM base AS deps
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# ===== Builder (전체 소스 + 빌드) =====
# next.config.ts 의 output:"standalone" 이 .next/standalone/server.js 를 생성한다.
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm build

# ===== Runner (최소 프로덕션 이미지, devDeps 제외, non-root) =====
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 nextjs

# standalone 서버 + 정적 자산만 복사 (소스·.next 전체·devDeps 미포함)
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
