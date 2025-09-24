#!/bin/bash

# Twenty One Pilots - Staging Deployment Script
# Automates the deployment process to staging environment

set -e

# Configuration
APP_NAME="twentyonepilots"
STAGING_HOST=${STAGING_HOST:-"staging.yourdomain.com"}
STAGING_USER=${STAGING_USER:-"deploy"}
ENVIRONMENT="staging"
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Pre-deployment checks
pre_deployment_checks() {
    log_info "Running pre-deployment checks..."

    # Check if required environment variables are set
    required_vars=("STAGING_HOST" "STAGING_USER")
    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ]; then
            log_error "Required environment variable $var is not set"
            exit 1
        fi
    done

    # Check if SSH key exists
    if [ ! -f ~/.ssh/id_rsa ]; then
        log_error "SSH private key not found at ~/.ssh/id_rsa"
        log_info "Please ensure your SSH key is configured for deployment"
        exit 1
    fi

    # Check if we're in the correct directory
    if [ ! -f "docker-compose.yml" ]; then
        log_error "docker-compose.yml not found. Are you in the project root?"
        exit 1
    fi

    log_success "Pre-deployment checks passed"
}

# Setup SSH connection
setup_ssh() {
    log_info "Setting up SSH connection to staging server..."

    # Add host to known_hosts if not already there
    ssh-keyscan -H $STAGING_HOST >> ~/.ssh/known_hosts 2>/dev/null || true

    # Test SSH connection
    if ! ssh -o ConnectTimeout=10 -o StrictHostKeyChecking=no ${STAGING_USER}@${STAGING_HOST} "echo 'SSH connection successful'" >/dev/null 2>&1; then
        log_error "Cannot connect to staging server via SSH"
        exit 1
    fi

    log_success "SSH connection established"
}

# Create deployment backup
create_backup() {
    log_info "Creating deployment backup on staging server..."

    ssh ${STAGING_USER}@${STAGING_HOST} << EOF
        cd /opt/${APP_NAME}
        echo "Creating backup..."
        mkdir -p backups
        BACKUP_FILE="backups/pre-deploy-staging-\$(date +%Y%m%d-%H%M%S).tar.gz"
        tar -czf \$BACKUP_FILE \
            docker-compose.yml \
            .env.staging \
            nginx/ \
            monitoring/ \
            --exclude='backups/*' \
            --exclude='logs/*' \
            2>/dev/null || true
        echo "Backup created: \$BACKUP_FILE"
EOF

    log_success "Backup created successfully"
}

# Deploy application
deploy_application() {
    log_info "Starting deployment to staging..."

    # Copy docker-compose and configuration files
    scp docker-compose.yml ${STAGING_USER}@${STAGING_HOST}:/opt/${APP_NAME}/
    scp -r monitoring/ ${STAGING_USER}@${STAGING_HOST}:/opt/${APP_NAME}/ 2>/dev/null || true

    # Execute deployment on remote server
    ssh ${STAGING_USER}@${STAGING_HOST} << EOF
        cd /opt/${APP_NAME}
        echo "Pulling latest changes..."
        git fetch origin
        git checkout develop
        git pull origin develop

        echo "Pulling Docker images..."
        docker-compose pull

        echo "Starting services..."
        docker-compose up -d --build

        echo "Waiting for services to be healthy..."
        sleep 30

        echo "Checking service health..."
        if docker-compose ps | grep -q "Up"; then
            echo "Services are running"
        else
            echo "Some services failed to start"
            docker-compose logs
            exit 1
        fi
EOF

    log_success "Application deployed successfully"
}

# Health checks
run_health_checks() {
    log_info "Running health checks..."

    local max_attempts=30
    local attempt=1

    while [ $attempt -le $max_attempts ]; do
        log_info "Health check attempt $attempt/$max_attempts"

        # Test main application
        if curl -f -s --max-time 10 http://${STAGING_HOST}/health >/dev/null 2>&1; then
            log_success "Application health check passed"
            return 0
        fi

        # Test API
        if curl -f -s --max-time 10 http://${STAGING_HOST}/api/health >/dev/null 2>&1; then
            log_success "API health check passed"
            return 0
        fi

        log_warning "Health check failed, retrying in 10 seconds..."
        sleep 10
        ((attempt++))
    done

    log_error "Health checks failed after $max_attempts attempts"
    return 1
}

# Run E2E tests
run_e2e_tests() {
    log_info "Running E2E tests on staging..."

    # Set environment for E2E tests
    export BASE_URL=http://${STAGING_HOST}

    # Run tests
    if cd frontend && npm run test:e2e; then
        log_success "E2E tests passed"
        return 0
    else
        log_error "E2E tests failed"
        return 1
    fi
}

# Send notifications
send_notification() {
    local status=$1
    local message=$2

    log_info "Sending deployment notification..."

    # Here you would integrate with your notification system
    # For example: Slack, email, etc.

    if [ "$status" = "success" ]; then
        log_success "$message"
    else
        log_error "$message"
    fi
}

# Rollback on failure
rollback_deployment() {
    log_error "Deployment failed, initiating rollback..."

    ssh ${STAGING_USER}@${STAGING_HOST} << EOF
        cd /opt/${APP_NAME}
        echo "Finding latest backup..."
        LATEST_BACKUP=\$(ls -t backups/pre-deploy-staging-*.tar.gz 2>/dev/null | head -1)

        if [ -n "\$LATEST_BACKUP" ]; then
            echo "Rolling back using backup: \$LATEST_BACKUP"
            docker-compose down
            tar -xzf \$LATEST_BACKUP -C /
            docker-compose up -d
            echo "Rollback completed"
        else
            echo "No backup found, attempting git rollback..."
            git reset --hard HEAD~1
            docker-compose up -d --build
        fi
EOF

    send_notification "failure" "Staging deployment failed and rollback completed"
    exit 1
}

# Main deployment function
main() {
    log_info "Starting staging deployment for ${APP_NAME}"

    # Run pre-deployment checks
    pre_deployment_checks

    # Setup SSH
    setup_ssh

    # Create backup
    create_backup

    # Deploy application
    if ! deploy_application; then
        rollback_deployment
    fi

    # Run health checks
    if ! run_health_checks; then
        log_error "Health checks failed"
        rollback_deployment
    fi

    # Run E2E tests
    if ! run_e2e_tests; then
        log_error "E2E tests failed"
        rollback_deployment
    fi

    # Send success notification
    send_notification "success" "Staging deployment completed successfully"

    log_success "🎉 Staging deployment completed successfully!"
    log_info "Application is available at: http://${STAGING_HOST}"
    log_info "Monitoring: http://monitoring.${STAGING_HOST}"
}

# Handle script interruption
trap 'log_error "Deployment interrupted by user"; exit 1' INT TERM

# Run main function
main "$@"