# syntax=docker/dockerfile:1

# -----------------------------------------------------------
# Stage 1: Build Client (React + Vite + Tailwind CSS)
# -----------------------------------------------------------
FROM node:22-alpine AS client-builder
WORKDIR /app/client

# Install frontend dependencies
COPY client/package*.json ./
RUN npm ci

# Copy frontend source and build static bundle
COPY client/ ./
RUN npm run build

# -----------------------------------------------------------
# Stage 2: Build Server (Express + TypeScript)
# -----------------------------------------------------------
FROM node:22-alpine AS server-builder
WORKDIR /app/server

# Install backend dependencies
COPY server/package*.json ./
RUN npm ci

# Copy backend source and compile TypeScript
COPY server/ ./
RUN npm run build

# -----------------------------------------------------------
# Stage 3: Minimal Production Runtime
# -----------------------------------------------------------
FROM node:22-alpine AS runner
WORKDIR /app

# Configure production environment variables
ENV NODE_ENV=production \
    PORT=3000 \
    DATA_DIR=/app/data \
    CLIENT_DIST_PATH=/app/client/dist

# Install production dependencies only for the backend
WORKDIR /app/server
COPY server/package*.json ./
RUN npm ci --omit=dev --no-audit --no-fund

# Copy compiled backend code
COPY --from=server-builder /app/server/dist ./dist

# Copy compiled frontend assets
COPY --from=client-builder /app/client/dist /app/client/dist

# Copy default seed data
COPY server/data /app/data-default

# Prepare persistent data directory and permissions
WORKDIR /app
RUN mkdir -p /app/data && chown -R node:node /app

# Switch to non-privileged user for security
USER node

# Expose web application port
EXPOSE 3000

# Persistent storage volume for songs and playlists
VOLUME ["/app/data"]

# Run the unified Express + Static frontend server
CMD ["node", "server/dist/index.js"]
