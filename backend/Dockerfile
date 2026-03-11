# Build stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build

# Production stage
FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/scripts ./scripts
RUN mkdir -p data logs models backups
RUN sed -i 's/\r//' scripts/docker-entrypoint.sh && chmod +x scripts/docker-entrypoint.sh
EXPOSE 3000
ENTRYPOINT ["scripts/docker-entrypoint.sh"]
CMD ["node", "dist/main.js"]
