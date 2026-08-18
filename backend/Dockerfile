# ---------- build ----------
FROM node:22.14-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json* ./
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

COPY . .
RUN npm run build

# ---------- runtime ----------
FROM node:22.14-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001

# wget used by HEALTHCHECK
RUN apk add --no-cache wget

COPY package.json package-lock.json* ./
RUN if [ -f package-lock.json ]; then npm ci --omit=dev; else npm install --omit=dev; fi \
    && npm cache clean --force

COPY --from=builder /app/dist ./dist

RUN addgroup -S app && adduser -S app -G app \
    && chown -R app:app /app
USER app

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=25s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3001/health || exit 1

# Configuration is injected by Compose / k8s — no .env file baked into the image
CMD ["node", "dist/server.js"]
