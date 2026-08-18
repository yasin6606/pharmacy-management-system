# ---------- build ----------
FROM node:22.14-alpine AS builder
WORKDIR /app

# Install from package.json (do not require a perfect lockfile in the image build)
COPY package.json ./
RUN npm install --no-audit --no-fund

COPY . .
RUN npm run build

# ---------- runtime ----------
FROM node:22.14-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001

RUN apk add --no-cache wget

COPY package.json ./
RUN npm install --omit=dev --no-audit --no-fund \
    && npm cache clean --force

COPY --from=builder /app/dist ./dist

RUN addgroup -S app && adduser -S app -G app \
    && chown -R app:app /app
USER app

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=25s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3001/health || exit 1

CMD ["node", "dist/server.js"]
