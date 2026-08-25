# ============================================================================
# KMS Backend — multi-stage build (Node 20 Alpine)
# Runner giữ nguyên node_modules để có sẵn Prisma CLI cho `migrate deploy`
# (đánh đổi kích thước ảnh lấy độ tin cậy clone-and-run).
# ============================================================================

FROM node:20-alpine AS build
# Prisma engine cần OpenSSL trên Alpine
RUN apk add --no-cache openssl
WORKDIR /app
COPY package*.json ./
RUN npm ci --no-audit --no-fund
COPY . .
RUN npx prisma generate && npm run build

FROM node:20-alpine AS runner
ENV NODE_ENV=production
RUN apk add --no-cache openssl
WORKDIR /app
RUN apk add --no-cache wget && addgroup -S kms && adduser -S kms -G kms
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/scripts ./scripts
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh && mkdir -p /app/uploads && chown -R kms:kms /app
USER kms
EXPOSE 3001
HEALTHCHECK --interval=10s --timeout=5s --retries=12 --start-period=40s \
  CMD wget -qO- http://127.0.0.1:3001/api/v1/healthz || exit 1
ENTRYPOINT ["docker-entrypoint.sh"]
