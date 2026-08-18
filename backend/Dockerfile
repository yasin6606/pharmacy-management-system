# ---------- build ----------
FROM node:22.14-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json* ./
# Prefer a clean install when the lockfile is valid; fall back if it is missing/out of sync
RUN if [ -f package-lock.json ]; then \
      npm ci || (echo "lock out of sync — regenerating" && rm -f package-lock.json && npm install); \
    else \
      npm install; \
    fi

COPY . .
RUN npm run build

# ---------- runtime ----------
FROM node:22.14-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001

RUN apk add --no-cache wget

COPY package.json package-lock.json* ./
RUN if [ -f package-lock.json ]; then \
      npm ci --omit=dev || (rm -f package-lock.json && npm install --omit=dev); \
    else \
      npm install --omit=dev; \
    fi \
    && npm cache clean --force

COPY --from=builder /app/dist ./dist

RUN addgroup -S app && adduser -S app -G app \
    && chown -R app:app /app
USER app

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=25s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3001/health || exit 1

CMD ["node", "dist/server.js"]
