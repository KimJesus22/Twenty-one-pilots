#!/bin/bash

# Twenty One Pilots - MFA Validation for Deployments
# Validates 2FA token before allowing critical deployments

set -e

# Configuration
API_BASE_URL=${API_BASE_URL:-"https://api.yourdomain.com"}
DEPLOYMENT_TYPE=${DEPLOYMENT_TYPE:-"production"}
REQUIRED_ROLE=${REQUIRED_ROLE:-"deployer"}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

# Logging functions
log_info() {
    echo -e "${BLUE}[MFA-VALIDATION]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[MFA-VALIDATION]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[MFA-VALIDATION]${NC} $1"
}

log_error() {
    echo -e "${RED}[MFA-VALIDATION]${NC} $1"
}

log_critical() {
    echo -e "${PURPLE}[MFA-VALIDATION]${NC} $1"
}

# Validate required environment variables
validate_environment() {
    local required_vars=("DEPLOYMENT_USER" "DEPLOYMENT_TOKEN" "MFA_TOKEN")

    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ]; then
            log_error "Required environment variable $var is not set"
            exit 1
        fi
    done

    log_success "Environment validation passed"
}

# Validate deployment user permissions
validate_user_permissions() {
    log_info "Validating deployment user permissions..."

    local response
    response=$(curl -s -w "\n%{http_code}" \
        -H "Authorization: Bearer $DEPLOYMENT_TOKEN" \
        -H "Content-Type: application/json" \
        "$API_BASE_URL/api/auth/verify")

    local http_code=$(echo "$response" | tail -n1)
    local body=$(echo "$response" | head -n -1)

    if [ "$http_code" -ne 200 ]; then
        log_error "Failed to validate deployment token (HTTP $http_code)"
        log_error "Response: $body"
        exit 1
    fi

    # Extract user role from response
    local user_role
    user_role=$(echo "$body" | jq -r '.data.user.role // empty')

    if [ -z "$user_role" ]; then
        log_error "Could not extract user role from validation response"
        exit 1
    fi

    # Check if user has required role
    case $REQUIRED_ROLE in
        "deployer")
            if [[ "$user_role" != "deployer" && "$user_role" != "admin" ]]; then
                log_error "User role '$user_role' does not have deployment permissions"
                log_error "Required role: $REQUIRED_ROLE or admin"
                exit 1
            fi
            ;;
        "admin")
            if [ "$user_role" != "admin" ]; then
                log_error "User role '$user_role' does not have admin permissions"
                exit 1
            fi
            ;;
        *)
            log_error "Unknown required role: $REQUIRED_ROLE"
            exit 1
            ;;
    esac

    log_success "User permissions validated (Role: $user_role)"
}

# Validate MFA token
validate_mfa_token() {
    log_info "Validating MFA token for deployment..."

    # First, check if user has 2FA enabled
    local user_check_response
    user_check_response=$(curl -s -w "\n%{http_code}" \
        -H "Authorization: Bearer $DEPLOYMENT_TOKEN" \
        -H "Content-Type: application/json" \
        "$API_BASE_URL/api/auth/profile")

    local user_check_code=$(echo "$user_check_response" | tail -n1)
    local user_check_body=$(echo "$user_check_response" | head -n -1)

    if [ "$user_check_code" -ne 200 ]; then
        log_error "Failed to check user 2FA status (HTTP $user_check_code)"
        exit 1
    fi

    local two_factor_enabled
    two_factor_enabled=$(echo "$user_check_body" | jq -r '.data.user.twoFactorEnabled // false')

    if [ "$two_factor_enabled" != "true" ]; then
        log_warning "User does not have 2FA enabled - MFA validation skipped"
        return 0
    fi

    # User has 2FA enabled, validate the token
    local mfa_response
    mfa_response=$(curl -s -w "\n%{http_code}" \
        -H "Content-Type: application/json" \
        -d "{\"tempToken\":\"$DEPLOYMENT_TOKEN\",\"twoFactorToken\":\"$MFA_TOKEN\"}" \
        "$API_BASE_URL/api/auth/2fa/verify")

    local mfa_code=$(echo "$mfa_response" | tail -n1)
    local mfa_body=$(echo "$mfa_response" | head -n -1)

    if [ "$mfa_code" -ne 200 ]; then
        log_error "MFA token validation failed (HTTP $mfa_code)"
        log_error "Response: $mfa_body"
        log_error "This deployment requires valid 2FA authentication"
        exit 1
    fi

    log_success "MFA token validated successfully"
}

# Log deployment authorization
log_deployment_authorization() {
    log_info "Logging deployment authorization..."

    local deployment_data="{
        \"deployment_type\": \"$DEPLOYMENT_TYPE\",
        \"environment\": \"$DEPLOYMENT_TYPE\",
        \"authorized_by\": \"$DEPLOYMENT_USER\",
        \"timestamp\": \"$(date -Iseconds)\",
        \"pipeline\": \"${GITHUB_RUN_ID:-unknown}\",
        \"repository\": \"${GITHUB_REPOSITORY:-unknown}\",
        \"commit\": \"${GITHUB_SHA:-unknown}\"
    }"

    # This would typically send to an audit endpoint
    # For now, just log it
    log_info "Deployment authorized: $deployment_data"
}

# Main validation function
main() {
    log_info "Starting MFA validation for $DEPLOYMENT_TYPE deployment"
    log_info "Required role: $REQUIRED_ROLE"

    # Validate environment
    validate_environment

    # Validate user permissions
    validate_user_permissions

    # Validate MFA token
    validate_mfa_token

    # Log authorization
    log_deployment_authorization

    log_success "✅ MFA validation completed successfully"
    log_success "🚀 Deployment authorized for $DEPLOYMENT_TYPE environment"

    # Export validation result for CI/CD pipeline
    echo "MFA_VALIDATION_PASSED=true" >> $GITHUB_ENV
    echo "DEPLOYMENT_AUTHORIZED=true" >> $GITHUB_ENV
    echo "AUTHORIZED_USER=$DEPLOYMENT_USER" >> $GITHUB_ENV
    echo "AUTHORIZED_ROLE=$REQUIRED_ROLE" >> $GITHUB_ENV
}

# Handle script interruption
trap 'log_error "MFA validation interrupted"; exit 1' INT TERM

# Run main function
main "$@"