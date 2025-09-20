# Multi-stage build for Twenty One Pilots Backend
FROM node:18-alpine AS base

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# =============================================================================
# Development stage
# =============================================================================
FROM base AS development

# Install all dependencies (including dev dependencies)
RUN npm ci

# Copy source code
COPY . .

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Change ownership of app directory
RUN chown -R nodejs:nodejs /app
USER nodejs

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/health', (res) => { \
    process.exit(res.statusCode === 200 ? 0 : 1) \
  }).on('error', () => process.exit(1))"

# Start application
CMD ["dumb-init", "npm", "run", "dev"]

# =============================================================================
# Build stage
# =============================================================================
FROM base AS build

# Install all dependencies
RUN npm ci

# Copy source code
COPY . .

# Build application (if needed)
RUN npm run build 2>/dev/null || echo "No build script found, skipping"

# =============================================================================
# Production stage
# =============================================================================
FROM base AS production

# Install only production dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy built application from build stage
COPY --from=build /app .

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Create necessary directories with proper permissions
RUN mkdir -p /app/logs && \
    chown -R nodejs:nodejs /app

USER nodejs

# Environment variables
ENV NODE_ENV=production
ENV PORT=5000

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD node -e "require('http').get('http://localhost:' + (process.env.PORT || 5000) + '/health', (res) => { \
    process.exit(res.statusCode === 200 ? 0 : 1) \
  }).on('error', () => process.exit(1))"

# Start application
CMD ["dumb-init", "node", "server.js"]

# =============================================================================
# Production with SSL stage
# =============================================================================
FROM production AS production-ssl

# Copy SSL certificates (if needed)
# COPY --chown=nodejs:nodejs ssl/ /app/ssl/

# Additional SSL configuration can be added here

# =============================================================================
# Labels for container metadata
# =============================================================================
LABEL org.opencontainers.image.title="Twenty One Pilots Backend" \
      org.opencontainers.image.description="Backend API for Twenty One Pilots application with advanced security and scalability" \
      org.opencontainers.image.vendor="Twenty One Pilots Team" \
      org.opencontainers.image.version="2.0.0" \
      org.opencontainers.image.source="https://github.com/twentyonepilots/app" \
      org.opencontainers.image.licenses="MIT"