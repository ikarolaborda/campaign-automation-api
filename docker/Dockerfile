# Build stage
FROM node:22-alpine AS builder

# Install git and build dependencies
RUN apk add --no-cache git python3 make g++

WORKDIR /app

# Copy package files for backend
COPY package*.json ./
COPY tsconfig*.json ./

# Install backend dependencies
RUN npm ci --silent && npm cache clean --force

# Copy backend source code
COPY src ./src

# Build the backend
RUN npm run build

# Production stage
FROM node:22-alpine AS production

# Install git for runtime operations if needed
RUN apk add --no-cache git

# Create app directory and user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production --silent && npm cache clean --force

# Copy built backend from builder stage
COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist

# Copy any additional configuration files
COPY --chown=nestjs:nodejs .env* ./

# Switch to non-root user
USER nestjs

# Expose backend port
EXPOSE 3001

# Health check for backend
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "const http = require('http'); \
    const options = { \
      host: 'localhost', \
      port: 3001, \
      path: '/api/health', \
      timeout: 2000 \
    }; \
    const req = http.request(options, (res) => { \
      if (res.statusCode === 200) process.exit(0); \
      else process.exit(1); \
    }); \
    req.on('error', () => process.exit(1)); \
    req.end();"

# Start the backend application
CMD ["node", "dist/main.js"]