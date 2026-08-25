# ============================================================================
# KMS Frontend — Next.js 14 standalone
# Build stage nhận API_PROXY_TARGET=http://api:3001 để rewrites được "nướng"
# vào bản standalone; runner chỉ cần node chạy server.js.
# ============================================================================

FROM node:20-alpine AS build
WORKDIR /app
ARG NEXT_PUBLIC_APP_NAME=KMS Saigon Technology
ENV NEXT_PUBLIC_APP_NAME=${NEXT_PUBLIC_APP_NAME}
ENV API_PROXY_TARGET=http://api:3001
COPY package*.json ./
RUN npm ci --no-audit --no-fund
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
ENV NODE_ENV=production PORT=3000 HOSTNAME=0.0.0.0
WORKDIR /app
RUN apk add --no-cache wget && addgroup -S kms && adduser -S kms -G kms
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public
USER kms
EXPOSE 3000
HEALTHCHECK --interval=10s --timeout=5s --retries=12 --start-period=20s \
  CMD wget -qO- http://127.0.0.1:3000/ || exit 1
CMD ["node", "server.js"]
