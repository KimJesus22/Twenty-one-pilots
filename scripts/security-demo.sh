#!/bin/bash

# Twenty One Pilots - Security System Demo
# Demonstrates the implemented MFA and RBAC security features

set -e

# Configuration
API_BASE_URL=${API_BASE_URL:-"http://localhost:5000"}
ADMIN_EMAIL=${ADMIN_EMAIL:-"admin@twentyonepilots.com"}
ADMIN_PASSWORD=${ADMIN_PASSWORD:-"SecurePass123!"}

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

# Demo functions
log_demo() {
    echo -e "${CYAN}[DEMO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

# Wait for API to be ready
wait_for_api() {
    log_demo "Waiting for API to be ready..."
    for i in {1..30}; do
        if curl -s -f "$API_BASE_URL/health" > /dev/null 2>&1; then
            log_success "API is ready!"
            return 0
        fi
        echo -n "."
        sleep 2
    done
    log_error "API failed to start within 60 seconds"
    exit 1
}

# Demo 1: User Registration with Security Features
demo_user_registration() {
    log_demo "=== DEMO 1: User Registration with Security ==="

    # Register a new user
    log_info "Registering new user with secure password requirements..."
    REGISTER_RESPONSE=$(curl -s -X POST "$API_BASE_URL/api/auth/register" \
        -H "Content-Type: application/json" \
        -d '{
            "username": "demouser",
            "email": "demo@twentyonepilots.com",
            "password": "SecureDemo123!"
        }')

    if echo "$REGISTER_RESPONSE" | jq -e '.success' > /dev/null 2>&1; then
        log_success "User registered successfully"
        echo "$REGISTER_RESPONSE" | jq '.data.user'
    else
        log_error "User registration failed"
        echo "$REGISTER_RESPONSE"
        return 1
    fi
}

# Demo 2: Failed Login Attempts and Account Locking
demo_account_locking() {
    log_demo "=== DEMO 2: Account Locking on Failed Attempts ==="

    log_info "Attempting multiple failed logins to trigger account locking..."

    for i in {1..6}; do
        log_info "Login attempt $i/6"
        LOGIN_RESPONSE=$(curl -s -X POST "$API_BASE_URL/api/auth/login" \
            -H "Content-Type: application/json" \
            -d '{
                "email": "demo@twentyonepilots.com",
                "password": "WrongPassword123!"
            }')

        if echo "$LOGIN_RESPONSE" | jq -e '.message | contains("bloqueada")' > /dev/null 2>&1; then
            log_success "Account locked after $i failed attempts!"
            break
        fi

        sleep 1
    done
}

# Demo 3: 2FA Setup Process
demo_2fa_setup() {
    log_demo "=== DEMO 3: 2FA Setup Process ==="

    # First, login successfully (assuming account is not locked)
    log_info "Logging in with correct credentials..."
    LOGIN_RESPONSE=$(curl -s -X POST "$API_BASE_URL/api/auth/login" \
        -H "Content-Type: application/json" \
        -d '{
            "email": "demo@twentyonepilots.com",
            "password": "SecureDemo123!"
        }')

    if echo "$LOGIN_RESPONSE" | jq -e '.success' > /dev/null 2>&1; then
        log_success "Login successful"

        # Extract token
        TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.data.token')

        if [ "$TOKEN" != "null" ] && [ "$TOKEN" != "" ]; then
            log_info "Setting up 2FA for user..."

            # Setup 2FA
            SETUP_RESPONSE=$(curl -s -X POST "$API_BASE_URL/api/auth/2fa/setup" \
                -H "Authorization: Bearer $TOKEN" \
                -H "Content-Type: application/json")

            if echo "$SETUP_RESPONSE" | jq -e '.success' > /dev/null 2>&1; then
                log_success "2FA setup initiated"
                echo "QR Code URL:"
                echo "$SETUP_RESPONSE" | jq -r '.data.qrCode'
                echo ""
                echo "Secret for manual entry:"
                echo "$SETUP_RESPONSE" | jq -r '.data.secret'
            else
                log_error "2FA setup failed"
                echo "$SETUP_RESPONSE"
            fi
        else
            log_info "2FA required for login - this is expected behavior!"
            echo "$LOGIN_RESPONSE" | jq '.'
        fi
    else
        log_error "Login failed - account might be locked"
        echo "$LOGIN_RESPONSE"
    fi
}

# Demo 4: RBAC Permission Management
demo_rbac_permissions() {
    log_demo "=== DEMO 4: RBAC Permission Management ==="

    # This would require admin token - showing the concept
    log_info "RBAC system includes the following permission levels:"
    echo "- user: Basic application access"
    echo "- moderator: Content moderation capabilities"
    echo "- deployer: Deployment and infrastructure access"
    echo "- admin: Full system administration"

    log_info "Permissions are granular and resource-based:"
    echo "- users:read, users:write, users:admin"
    echo "- content:create, content:read, content:update, content:delete"
    echo "- deployment:staging, deployment:production"
    echo "- audit:read, audit:admin"
}

# Demo 5: Security Audit Logging
demo_audit_logging() {
    log_demo "=== DEMO 5: Security Audit Logging ==="

    log_info "All security events are automatically logged:"
    echo "- LOGIN_SUCCESS/FAILURE"
    echo "- 2FA_ENABLED/DISABLED/VERIFICATION"
    echo "- PERMISSION_GRANTED/REVOKED"
    echo "- ROLE_CHANGED"
    echo "- DEPLOYMENT_START/SUCCESS/FAILURE"
    echo "- SECURITY_ALERT"
    echo "- ACCOUNT_LOCKED/UNLOCKED"

    log_info "Audit logs include:"
    echo "- Timestamp and user information"
    echo "- IP address and User-Agent"
    echo "- Action details and severity"
    echo "- Compliance-ready export formats (JSON/CSV)"
}

# Demo 6: Deployment Security
demo_deployment_security() {
    log_demo "=== DEMO 6: Deployment Security ==="

    log_info "Deployment security features:"
    echo "- MFA validation before production deployments"
    echo "- RBAC-based deployment permissions"
    echo "- Audit logging of all deployment activities"
    echo "- Rollback capabilities with authorization"

    log_info "To test deployment security:"
    echo "1. Set up deployment user with RBAC permissions"
    echo "2. Configure MFA for deployment accounts"
    echo "3. Run deployment validation script"
    echo "4. Monitor deployment audit logs"
}

# Demo 7: Security Monitoring Dashboard
demo_security_monitoring() {
    log_demo "=== DEMO 7: Security Monitoring Dashboard ==="

    log_info "Security monitoring includes:"
    echo "- Real-time authentication trends"
    echo "- 2FA verification rates"
    echo "- Failed login attempts by IP"
    echo "- RBAC permission changes"
    echo "- Admin action timelines"
    echo "- Security score calculation"
    echo "- Account lockout monitoring"

    log_info "Grafana dashboards provide:"
    echo "- Interactive security metrics"
    echo "- Alert-based monitoring"
    echo "- Historical trend analysis"
    echo "- Compliance reporting"
}

# Main demo function
main() {
    echo ""
    echo -e "${PURPLE}🔒 Twenty One Pilots - Security System Demo${NC}"
    echo -e "${PURPLE}=============================================${NC}"
    echo ""

    # Check if jq is installed
    if ! command -v jq &> /dev/null; then
        log_error "jq is required for this demo. Please install jq:"
        echo "  Ubuntu/Debian: sudo apt-get install jq"
        echo "  macOS: brew install jq"
        echo "  Windows: choco install jq"
        exit 1
    fi

    # Wait for API
    wait_for_api

    # Run demos
    demo_user_registration
    echo ""

    demo_account_locking
    echo ""

    demo_2fa_setup
    echo ""

    demo_rbac_permissions
    echo ""

    demo_audit_logging
    echo ""

    demo_deployment_security
    echo ""

    demo_security_monitoring
    echo ""

    log_success "Security demo completed!"
    echo ""
    echo -e "${CYAN}For production deployment:${NC}"
    echo "1. Configure environment variables"
    echo "2. Set up SSL certificates"
    echo "3. Configure Grafana and Prometheus"
    echo "4. Set up deployment users with RBAC"
    echo "5. Enable MFA for all accounts"
    echo ""
    echo -e "${CYAN}Security Documentation:${NC} SECURITY.md"
    echo -e "${CYAN}Deployment Guide:${NC} DEPLOYMENT.md"
}

# Handle script interruption
trap 'echo -e "\n${YELLOW}Demo interrupted${NC}"; exit 1' INT TERM

# Run main demo
main "$@"