FROM node:22.14-alpine AS builder
WORKDIR /app

# Build-time argument for the API URL (relative path)
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

COPY package.json ./
RUN #npm ci
COPY . .
RUN npm run build

# Production runtime stage
FROM node:22.14-alpine
WORKDIR /app
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.js ./
COPY --from=builder /app/node_modules ./node_modules

# Set the variable again for runtime (Next.js uses it on server side as well)
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
EXPOSE 3000
CMD ["npm", "start"]
