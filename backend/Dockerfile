# Build stage
FROM node:20-alpine AS builder
WORKDIR /app
ARG DATABASE_URL=postgresql://postgres:postgres@localhost:5432/task_manager
ENV DATABASE_URL=${DATABASE_URL}
COPY package*.json ./
RUN npm ci --ignore-scripts
COPY . .
RUN npm run build

# Production stage
FROM node:20-alpine
WORKDIR /app
RUN apk add --no-cache bash postgresql-client
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/scripts ./scripts
COPY --from=builder /app/tsconfig.json ./tsconfig.json
RUN mkdir -p logs backups
RUN sed -i 's/\r//' scripts/docker-entrypoint.sh && chmod +x scripts/docker-entrypoint.sh
EXPOSE 3000
ENTRYPOINT ["scripts/docker-entrypoint.sh"]
CMD ["node", "dist/main.js"]
