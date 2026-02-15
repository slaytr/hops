# Build stage for model package
FROM node:22-alpine AS model-builder

WORKDIR /app/model

# Copy model package files
COPY model/package*.json ./
RUN npm ci

COPY model/ ./
RUN npm run build

# Backend build stage
FROM node:22-alpine AS backend-builder

# Copy model to /app/model (where the symlink will point)
COPY --from=model-builder /app/model /app/model

WORKDIR /app/backend

# Copy backend package files
COPY backend/package*.json ./

# Install dependencies (now the model is available at /app/model)
RUN npm ci

# Copy backend source
COPY backend/ ./

# Fix the symlink AFTER copying source - remove Windows host path and create correct Docker path
RUN rm ./node_modules/@hops/models && \
    ln -s /app/model ./node_modules/@hops/models && \
    echo "=== Fixed symlink ===" && \
    ls -la ./node_modules/@hops/models && \
    echo "=== Checking package.json ===" && \
    cat ./node_modules/@hops/models/package.json

# Build backend
RUN npm run build

# Production stage
FROM node:22-alpine

# Install wget for healthcheck
RUN apk add --no-cache wget

WORKDIR /app

# Copy model package FIRST (needed for npm ci)
COPY --from=model-builder /app/model /app/model

# Copy backend package files
COPY backend/package*.json ./

# Install production dependencies only (now the model package is available)
RUN npm ci --only=production

# Fix the symlink for production (same as build stage)
RUN rm ./node_modules/@hops/models && \
    ln -s /app/model ./node_modules/@hops/models

# Copy built backend
COPY --from=backend-builder /app/backend/dist ./dist

# Expose backend port
EXPOSE 3000

# Start the server
CMD ["node", "dist/server.js"]
