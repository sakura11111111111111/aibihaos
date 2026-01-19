# Build Stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy root package.json for frontend dependencies
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Build frontend
RUN npm run build

# Production Stage
FROM node:18-alpine

WORKDIR /app

# Copy built frontend assets
COPY --from=builder /app/dist ./dist

# Setup Backend
WORKDIR /app/server
COPY server/package*.json ./
RUN npm install --production

# Copy backend source code
COPY server/ .

# Expose port
EXPOSE 3000

# Start server
CMD ["node", "server.js"]