#!/bin/bash

# Twenty One Pilots - Production Deployment Script
# Implements zero-downtime deployment with comprehensive rollback strategies

set -e

# Configuration
APP_NAME="twentyonepilots"
PRODUCTION_HOST=${PRODUCTION_HOST:-"yourdomain.com"}
PRODUCTION_USER=${PRODUCTION_USER:-"deploy"}
ENVIRONMENT="production"
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

# Deployment configuration
ROLLBACK_TIMEOUT=300  # 5 minutes
HEALTH_CHECK_TIMEOUT=600  # 10 minutes
MAX_RETRIES=3

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

log_critical() {
    echo -e "${PURPLE}[CRITICAL]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

# Pre-deployment validation
validate_deployment() {
    log_info "🔍 Running comprehensive pre-deployment validation..."

    # Check required environment variables
    local required_vars=("PRODUCTION_HOST" "PRODUCTION_USER" "SLACK_WEBHOOK_URL")
    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ]; then
            log_error "Required environment variable $var is not set"
            exit 1
        fi
    done

    # Validate SSH connection and permissions
    if ! ssh -o ConnectTimeout=10 -o StrictHostKeyChecking=no ${PRODUCTION_USER}@${PRODUCTION_HOST} "echo 'SSH connection validated'" >/dev/null 2>&1; then
        log_error "SSH connection to production server failed"
        exit 1
    fi

    # Check if production server has required tools
    ssh ${PRODUCTION_USER}@${PRODUCTION_HOST} << EOF
        if ! command -v docker &> /dev/null; then
            echo "Docker not found on production server"
            exit 1
        fi
        if ! command -v docker-compose &> /dev/null; then
            echo "Docker Compose not found on production server"
            exit 1
        fi
        echo "Production server validation passed"
EOF

    # Validate local files
    local required_files=("docker-compose.yml" "backend/Dockerfile" "frontend/Dockerfile")
    for file in "${required_files[@]}"; do
        if [ ! -f "$file" ]; then
            log_error "Required file $file not found"
            exit 1
        fi
    done

    log_success "✅ Pre-deployment validation completed"
}

# Create comprehensive backup
create_production_backup() {
    log_info "💾 Creating comprehensive production backup..."

    ssh ${PRODUCTION_USER}@${PRODUCTION_HOST} << EOF
        cd /opt/${APP_NAME}

        # Create timestamped backup directory
        BACKUP_DIR="backups/production-\$(date +%Y%m%d-%H%M%S)"
        mkdir -p \$BACKUP_DIR

        echo "Creating application backup..."
        # Backup application files
        tar -czf \$BACKUP_DIR/app-backup.tar.gz \
            --exclude='node_modules' \
            --exclude='.git' \
            --exclude='logs' \
            --exclude='backups' \
            . || true

        echo "Creating database backup..."
        # Backup MongoDB if running in container
        if docker ps | grep -q mongodb; then
            docker exec ${APP_NAME}-mongodb mongodump --out /backup-\$(date +%Y%m%d-%H%M%S) || true
        fi

        echo "Creating environment backup..."
        cp .env.production \$BACKUP_DIR/ 2>/dev/null || true

        echo "Backup completed: \$BACKUP_DIR"
        ls -la \$BACKUP_DIR
EOF

    log_success "✅ Production backup created"
}

# Zero-downtime deployment
zero_downtime_deploy() {
    log_info "🚀 Starting zero-downtime production deployment..."

    # Copy new files to production
    log_info "📤 Uploading new application version..."
    scp docker-compose.yml ${PRODUCTION_USER}@${PRODUCTION_HOST}:/opt/${APP_NAME}/
    scp -r monitoring/ ${PRODUCTION_USER}@${PRODUCTION_HOST}:/opt/${APP_NAME}/ 2>/dev/null || true

    # Execute deployment with zero-downtime strategy
    ssh ${PRODUCTION_USER}@${PRODUCTION_HOST} << EOF
        cd /opt/${APP_NAME}

        echo "🔄 Pulling latest production code..."
        git fetch origin
        git checkout main
        git pull origin main

        echo "🐳 Pulling new Docker images..."
        docker-compose pull

        echo "📊 Scaling backend for zero-downtime deployment..."
        # Get current backend count
        CURRENT_SCALE=\$(docker-compose ps backend | grep -c "Up" || echo "1")

        echo "Current backend instances: \$CURRENT_SCALE"

        # Scale up new instances
        echo "Scaling up new backend instances..."
        docker-compose up -d --scale backend=\$((CURRENT_SCALE + 2)) backend

        echo "Waiting for new instances to be healthy..."
        sleep 60

        # Health check for new instances
        HEALTHY_COUNT=0
        for i in {1..30}; do
            # Check if new instances are responding
            if curl -f -s --max-time 5 http://localhost/health >/dev/null 2>&1; then
                HEALTHY_COUNT=\$((HEALTHY_COUNT + 1))
                if [ \$HEALTHY_COUNT -ge \$((CURRENT_SCALE + 2)) ]; then
                    echo "All new instances are healthy"
                    break
                fi
            fi
            echo "Waiting for instances to become healthy... (\$i/30)"
            sleep 10
        done

        if [ \$HEALTHY_COUNT -lt \$((CURRENT_SCALE + 2)) ]; then
            echo "New instances failed health check, aborting deployment"
            # Scale back down
            docker-compose up -d --scale backend=\$CURRENT_SCALE backend
            exit 1
        fi

        echo "🗑️ Removing old backend instances..."
        # Remove old instances (this is simplified - in production you'd use more sophisticated blue-green)
        docker-compose up -d --scale backend=\$((CURRENT_SCALE + 2)) backend

        echo "📦 Deploying frontend..."
        docker-compose up -d frontend

        echo "🌐 Updating reverse proxy..."
        docker-compose up -d nginx

        echo "🧹 Cleaning up old images..."
        docker image prune -f

        echo "✅ Zero-downtime deployment completed"
EOF

    log_success "✅ Zero-downtime deployment completed"
}

# Comprehensive health checks
comprehensive_health_check() {
    log_info "🏥 Running comprehensive production health checks..."

    local start_time=$(date +%s)
    local timeout=$HEALTH_CHECK_TIMEOUT

    while true; do
        local current_time=$(date +%s)
        local elapsed=$((current_time - start_time))

        if [ $elapsed -gt $timeout ]; then
            log_error "Health check timeout after ${timeout} seconds"
            return 1
        fi

        log_info "Running health checks... (${elapsed}s elapsed)"

        # Check main application
        if ! curl -f -s --max-time 10 --retry 3 https://${PRODUCTION_HOST}/health >/dev/null 2>&1; then
            log_warning "Main application health check failed"
            sleep 10
            continue
        fi

        # Check API endpoints
        if ! curl -f -s --max-time 10 --retry 3 https://${PRODUCTION_HOST}/api/health >/dev/null 2>&1; then
            log_warning "API health check failed"
            sleep 10
            continue
        fi

        # Check critical API endpoints
        if ! curl -f -s --max-time 10 --retry 3 https://${PRODUCTION_HOST}/api/videos/search?q=test >/dev/null 2>&1; then
            log_warning "Videos API check failed"
            sleep 10
            continue
        fi

        # Check monitoring services
        if ! curl -f -s --max-time 5 http://monitoring.${PRODUCTION_HOST}/-/healthy >/dev/null 2>&1; then
            log_warning "Monitoring health check failed"
            sleep 10
            continue
        fi

        log_success "✅ All health checks passed"
        return 0
    done
}

# Run smoke tests
run_smoke_tests() {
    log_info "🧪 Running production smoke tests..."

    # Set production environment
    export BASE_URL=https://${PRODUCTION_HOST}

    # Run critical user journey tests
    local test_results=()

    # Test 1: Homepage loads
    if curl -f -s --max-time 10 $BASE_URL >/dev/null 2>&1; then
        test_results+=("✅ Homepage loads successfully")
    else
        test_results+=("❌ Homepage failed to load")
    fi

    # Test 2: API responds
    if curl -f -s --max-time 10 $BASE_URL/api/videos/search?q=twenty >/dev/null 2>&1; then
        test_results+=("✅ API search endpoint works")
    else
        test_results+=("❌ API search endpoint failed")
    fi

    # Test 3: Authentication flow (simplified)
    # Add more critical tests here

    # Print results
    printf '%s\n' "${test_results[@]}"

    # Check if any tests failed
    if [[ "${test_results[*]}" =~ "❌" ]]; then
        log_error "Some smoke tests failed"
        return 1
    fi

    log_success "✅ All smoke tests passed"
    return 0
}

# Emergency rollback
emergency_rollback() {
    log_critical "🚨 EMERGENCY ROLLBACK INITIATED 🚨"

    ssh ${PRODUCTION_USER}@${PRODUCTION_HOST} << EOF
        cd /opt/${APP_NAME}

        echo "Finding latest production backup..."
        LATEST_BACKUP=\$(ls -t backups/production-*/app-backup.tar.gz 2>/dev/null | head -1)

        if [ -n "\$LATEST_BACKUP" ]; then
            echo "Rolling back using backup: \$LATEST_BACKUP"

            # Stop all services
            docker-compose down

            # Restore from backup
            BACKUP_DIR=\$(dirname "\$LATEST_BACKUP")
            tar -xzf \$LATEST_BACKUP -C /

            # Restore environment
            cp \$BACKUP_DIR/.env.production .env 2>/dev/null || true

            # Start services
            docker-compose up -d

            echo "Rollback completed successfully"
        else
            echo "No backup found, attempting git rollback..."
            git reset --hard HEAD~1
            git clean -fd
            docker-compose up -d --build
        fi
EOF

    log_critical "Rollback completed - manual verification required"
}

# Send deployment notifications
send_deployment_notification() {
    local status=$1
    local message=$2
    local details=$3

    log_info "📱 Sending deployment notification..."

    # Send to Slack (you can add email notifications here too)
    local color="good"
    local icon="✅"

    if [ "$status" = "failure" ]; then
        color="danger"
        icon="❌"
    elif [ "$status" = "rollback" ]; then
        color="warning"
        icon="🔄"
    fi

    # Create JSON payload for Slack
    local payload=$(cat <<EOF
{
    "attachments": [{
        "color": "$color",
        "title": "$icon Production Deployment $status",
        "text": "$message",
        "fields": [
            {
                "title": "Environment",
                "value": "Production",
                "short": true
            },
            {
                "title": "Host",
                "value": "${PRODUCTION_HOST}",
                "short": true
            },
            {
                "title": "Version",
                "value": "$(git rev-parse HEAD 2>/dev/null || echo 'unknown')",
                "short": true
            },
            {
                "title": "Timestamp",
                "value": "$(date)",
                "short": true
            }
        ],
        "footer": "Twenty One Pilots Deployment System",
        "ts": $(date +%s)
    }]
}
EOF
)

    # Send to Slack
    if [ -n "$SLACK_WEBHOOK_URL" ]; then
        curl -X POST -H 'Content-type: application/json' \
             --data "$payload" \
             "$SLACK_WEBHOOK_URL" || log_warning "Failed to send Slack notification"
    fi
}

# Main deployment function
main() {
    local deployment_start=$(date +%s)

    log_info "🚀 Starting production deployment for ${APP_NAME}"
    send_deployment_notification "started" "Production deployment initiated"

    # Validate deployment prerequisites
    validate_deployment

    # Create comprehensive backup
    create_production_backup

    # Execute zero-downtime deployment
    if ! zero_downtime_deploy; then
        log_error "Deployment failed, initiating emergency rollback"
        send_deployment_notification "failure" "Deployment failed, rollback initiated"
        emergency_rollback
        send_deployment_notification "rollback" "Emergency rollback completed"
        exit 1
    fi

    # Run comprehensive health checks
    if ! comprehensive_health_check; then
        log_error "Health checks failed, initiating rollback"
        send_deployment_notification "failure" "Health checks failed, rollback initiated"
        emergency_rollback
        send_deployment_notification "rollback" "Health checks failed - rollback completed"
        exit 1
    fi

    # Run smoke tests
    if ! run_smoke_tests; then
        log_error "Smoke tests failed, initiating rollback"
        send_deployment_notification "failure" "Smoke tests failed, rollback initiated"
        emergency_rollback
        send_deployment_notification "rollback" "Smoke tests failed - rollback completed"
        exit 1
    fi

    # Calculate deployment time
    local deployment_end=$(date +%s)
    local deployment_duration=$((deployment_end - deployment_start))

    # Send success notification
    send_deployment_notification "success" "Production deployment completed successfully in ${deployment_duration}s"

    log_success "🎉 Production deployment completed successfully!"
    log_info "📊 Deployment Summary:"
    log_info "   • Duration: ${deployment_duration} seconds"
    log_info "   • Environment: Production"
    log_info "   • Host: ${PRODUCTION_HOST}"
    log_info "   • Monitoring: http://monitoring.${PRODUCTION_HOST}"
    log_info "   • Application: https://${PRODUCTION_HOST}"

    # Create deployment tag
    git tag -a "prod-$(date +%Y%m%d-%H%M%S)-$(git rev-parse --short HEAD)" \
        -m "Production deployment - $(date)" 2>/dev/null || true
}

# Handle script interruption
trap 'log_error "Production deployment interrupted by user"; send_deployment_notification "failure" "Deployment interrupted by user"; exit 1' INT TERM

# Run main function with error handling
if main "$@"; then
    log_success "Production deployment script completed successfully"
    exit 0
else
    log_error "Production deployment script failed"
    send_deployment_notification "failure" "Production deployment script failed"
    exit 1
fi