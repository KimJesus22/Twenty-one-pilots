# Multi-stage build for Twenty One Pilots Frontend
FROM node:22-alpine AS base

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json package-lock.json ./

# =============================================================================
# Dependencies stage
# =============================================================================
FROM base AS dependencies

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# =============================================================================
# Build stage
# =============================================================================
FROM base AS build

# Install all dependencies (including dev dependencies)
RUN npm install --legacy-peer-deps

# Copy source code
COPY . .

# Build application
RUN npm run build

# =============================================================================
# Production stage
# =============================================================================
FROM docker.io/library/nginx:alpine AS production

# Install dumb-init
RUN apk add --no-cache dumb-init

# Copy built application from build stage
COPY --from=build /app/build /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /usr/share/nginx/html && \
    chown -R nodejs:nodejs /var/cache/nginx && \
    chown -R nodejs:nodejs /var/log/nginx && \
    chown -R nodejs:nodejs /etc/nginx/conf.d && \
    touch /var/run/nginx.pid && \
    chown -R nodejs:nodejs /var/run/nginx.pid

USER nodejs

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost/health || exit 1

# Start nginx
CMD ["dumb-init", "nginx", "-g", "daemon off;"]

# =============================================================================
# Labels for container metadata
# =============================================================================
LABEL org.opencontainers.image.title="Twenty One Pilots Frontend" \
      org.opencontainers.image.description="Frontend React application for Twenty One Pilots with PWA support" \
      org.opencontainers.image.vendor="Twenty One Pilots Team" \
      org.opencontainers.image.version="2.0.0" \
      org.opencontainers.image.source="https://github.com/twentyonepilots/app" \
      org.opencontainers.image.licenses="MIT"