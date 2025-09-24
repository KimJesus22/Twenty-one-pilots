#!/bin/bash

# Twenty One Pilots - Deployment RBAC Setup Script
# Configures RBAC permissions for deployment users and roles

set -e

# Configuration
API_BASE_URL=${API_BASE_URL:-"https://api.yourdomain.com"}
ADMIN_TOKEN=${ADMIN_TOKEN:-""}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

# Logging functions
log_info() {
    echo -e "${BLUE}[RBAC-SETUP]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[RBAC-SETUP]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[RBAC-SETUP]${NC} $1"
}

log_error() {
    echo -e "${RED}[RBAC-SETUP]${NC} $1"
}

log_critical() {
    echo -e "${PURPLE}[RBAC-SETUP]${NC} $1"
}

# Validate admin token
validate_admin_token() {
    log_info "Validating admin token..."

    if [ -z "$ADMIN_TOKEN" ]; then
        log_error "ADMIN_TOKEN environment variable is required"
        exit 1
    fi

    local response
    response=$(curl -s -w "\n%{http_code}" \
        -H "Authorization: Bearer $ADMIN_TOKEN" \
        -H "Content-Type: application/json" \
        "$API_BASE_URL/api/auth/verify")

    local http_code=$(echo "$response" | tail -n1)
    local body=$(echo "$response" | head -n -1)

    if [ "$http_code" -ne 200 ]; then
        log_error "Invalid admin token (HTTP $http_code)"
        exit 1
    fi

    local user_role
    user_role=$(echo "$body" | jq -r '.data.user.role // empty')

    if [ "$user_role" != "admin" ]; then
        log_error "Token does not have admin privileges (Role: $user_role)"
        exit 1
    fi

    log_success "Admin token validated"
}

# Create deployment user
create_deployment_user() {
    local username=$1
    local email=$2
    local password=$3

    log_info "Creating deployment user: $username"

    local user_data="{
        \"username\": \"$username\",
        \"email\": \"$email\",
        \"password\": \"$password\"
    }"

    local response
    response=$(curl -s -w "\n%{http_code}" \
        -H "Content-Type: application/json" \
        -d "$user_data" \
        "$API_BASE_URL/api/auth/register")

    local http_code=$(echo "$response" | tail -n1)
    local body=$(echo "$response" | head -n -1)

    if [ "$http_code" -ne 201 ]; then
        log_error "Failed to create user $username (HTTP $http_code)"
        log_error "Response: $body"
        return 1
    fi

    log_success "User $username created successfully"
    return 0
}

# Set user role
set_user_role() {
    local user_id=$1
    local role=$2

    log_info "Setting role $role for user $user_id"

    local role_data="{\"role\": \"$role\"}"

    local response
    response=$(curl -s -w "\n%{http_code}" \
        -H "Authorization: Bearer $ADMIN_TOKEN" \
        -H "Content-Type: application/json" \
        -X PUT \
        -d "$role_data" \
        "$API_BASE_URL/api/admin/users/$user_id/role")

    local http_code=$(echo "$response" | tail -n1)
    local body=$(echo "$response" | head -n -1)

    if [ "$http_code" -ne 200 ]; then
        log_error "Failed to set role for user $user_id (HTTP $http_code)"
        log_error "Response: $body"
        return 1
    fi

    log_success "Role $role set for user $user_id"
    return 0
}

# Grant deployment permissions
grant_deployment_permissions() {
    local user_id=$1
    local environment=$2

    log_info "Granting deployment permissions for $environment to user $user_id"

    # Grant staging deployment permission
    if [ "$environment" = "staging" ] || [ "$environment" = "all" ]; then
        local staging_perm="{\"resource\": \"deployment\", \"action\": \"staging\"}"

        local response
        response=$(curl -s -w "\n%{http_code}" \
            -H "Authorization: Bearer $ADMIN_TOKEN" \
            -H "Content-Type: application/json" \
            -X POST \
            -d "$staging_perm" \
            "$API_BASE_URL/api/admin/users/$user_id/permissions")

        local http_code=$(echo "$response" | tail -n1)
        if [ "$http_code" -ne 200 ]; then
            log_error "Failed to grant staging deployment permission"
            return 1
        fi

        log_success "Staging deployment permission granted"
    fi

    # Grant production deployment permission
    if [ "$environment" = "production" ] || [ "$environment" = "all" ]; then
        local prod_perm="{\"resource\": \"deployment\", \"action\": \"production\"}"

        local response
        response=$(curl -s -w "\n%{http_code}" \
            -H "Authorization: Bearer $ADMIN_TOKEN" \
            -H "Content-Type: application/json" \
            -X POST \
            -d "$prod_perm" \
            "$API_BASE_URL/api/admin/users/$user_id/permissions")

        local http_code=$(echo "$response" | tail -n1)
        if [ "$http_code" -ne 200 ]; then
            log_error "Failed to grant production deployment permission"
            return 1
        fi

        log_success "Production deployment permission granted"
    fi

    return 0
}

# Setup deployment user with full permissions
setup_deployment_user() {
    local username=$1
    local email=$2
    local password=$3
    local environment=${4:-"all"}

    log_info "Setting up deployment user: $username for $environment environment"

    # Create user
    if ! create_deployment_user "$username" "$email" "$password"; then
        log_error "Failed to create deployment user"
        return 1
    fi

    # Get user ID (this is a simplified approach - in production you'd search by email)
    log_warning "Note: In production, implement user lookup by email"
    log_warning "For now, manually provide the user ID to continue setup"

    echo ""
    echo "Deployment user created successfully!"
    echo "To complete setup, run the following commands with the user ID:"
    echo ""
    echo "# Set role to deployer"
    echo "curl -X PUT $API_BASE_URL/api/admin/users/{USER_ID}/role \\"
    echo "  -H 'Authorization: Bearer $ADMIN_TOKEN' \\"
    echo "  -H 'Content-Type: application/json' \\"
    echo "  -d '{\"role\": \"deployer\"}'"
    echo ""
    echo "# Grant deployment permissions"
    echo "curl -X POST $API_BASE_URL/api/admin/users/{USER_ID}/permissions \\"
    echo "  -H 'Authorization: Bearer $ADMIN_TOKEN' \\"
    echo "  -H 'Content-Type: application/json' \\"
    echo "  -d '{\"resource\": \"deployment\", \"action\": \"$environment\"}'"
}

# List deployment users
list_deployment_users() {
    log_info "Listing deployment users..."

    local response
    response=$(curl -s -w "\n%{http_code}" \
        -H "Authorization: Bearer $ADMIN_TOKEN" \
        "$API_BASE_URL/api/admin/users")

    local http_code=$(echo "$response" | tail -n1)
    local body=$(echo "$response" | head -n -1)

    if [ "$http_code" -ne 200 ]; then
        log_error "Failed to list users (HTTP $http_code)"
        return 1
    fi

    echo "Deployment Users:"
    echo "$body" | jq -r '.data.users[] | select(.role == "deployer" or .permissions[]?.resource == "deployment") | "\(.username) (\(.email)) - Role: \(.role) - Permissions: \(.permissions | map("\(.resource):\(.actions[])") | join(", "))"'
}

# Show usage
usage() {
    echo "Usage: $0 [COMMAND] [OPTIONS]"
    echo ""
    echo "Commands:"
    echo "  setup USERNAME EMAIL PASSWORD [ENVIRONMENT]  Setup deployment user"
    echo "  list                                          List deployment users"
    echo "  help                                          Show this help"
    echo ""
    echo "Environments:"
    echo "  staging    Grant staging deployment permissions"
    echo "  production Grant production deployment permissions"
    echo "  all        Grant all deployment permissions (default)"
    echo ""
    echo "Environment Variables:"
    echo "  API_BASE_URL    API base URL (default: https://api.yourdomain.com)"
    echo "  ADMIN_TOKEN     Admin JWT token (required)"
    echo ""
    echo "Examples:"
    echo "  $0 setup deployer-ci ci@yourdomain.com securepass123 production"
    echo "  $0 list"
}

# Main function
main() {
    local command=$1

    case $command in
        setup)
            if [ $# -lt 4 ]; then
                log_error "Usage: $0 setup USERNAME EMAIL PASSWORD [ENVIRONMENT]"
                exit 1
            fi
            validate_admin_token
            setup_deployment_user "$2" "$3" "$4" "${5:-all}"
            ;;
        list)
            validate_admin_token
            list_deployment_users
            ;;
        help|--help|-h)
            usage
            ;;
        *)
            log_error "Unknown command: $command"
            echo ""
            usage
            exit 1
            ;;
    esac
}

# Run main function
main "$@"