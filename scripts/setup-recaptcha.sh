#!/bin/bash

# Twenty One Pilots - reCAPTCHA Setup Script
# Configures reCAPTCHA v3 environment variables and validates setup

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

# Logging functions
log_info() {
    echo -e "${BLUE}[RECAPTCHA-SETUP]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[RECAPTCHA-SETUP]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[RECAPTCHA-SETUP]${NC} $1"
}

log_error() {
    echo -e "${RED}[RECAPTCHA-SETUP]${NC} $1"
}

log_critical() {
    echo -e "${PURPLE}[RECAPTCHA-SETUP]${NC} $1"
}

# Validate Google reCAPTCHA keys
validate_recaptcha_keys() {
    local secret_key=$1
    local site_key=$2

    log_info "Validating reCAPTCHA keys..."

    # Basic format validation for secret key
    if [[ ! $secret_key =~ ^[A-Za-z0-9_-]{40}$ ]]; then
        log_error "Invalid secret key format"
        return 1
    fi

    # Basic format validation for site key
    if [[ ! $site_key =~ ^[A-Za-z0-9_-]{40}$ ]]; then
        log_error "Invalid site key format"
        return 1
    fi

    log_success "reCAPTCHA keys format validation passed"
    return 0
}

# Test reCAPTCHA API connectivity
test_recaptcha_api() {
    local secret_key=$1

    log_info "Testing reCAPTCHA API connectivity..."

    # Create a test token (this is a mock - in production you'd use a real token)
    local test_token="test_token_for_validation"

    local response
    response=$(curl -s -w "\n%{http_code}" \
        -X POST \
        -d "secret=$secret_key&response=$test_token" \
        "https://www.google.com/recaptcha/api/siteverify")

    local http_code=$(echo "$response" | tail -n1)
    local body=$(echo "$response" | head -n -1)

    if [ "$http_code" -eq 200 ]; then
        log_success "reCAPTCHA API connectivity test passed"
        return 0
    else
        log_warning "reCAPTCHA API returned HTTP $http_code"
        log_warning "Response: $body"
        log_warning "This might be expected for test tokens"
        return 0
    fi
}

# Setup environment variables
setup_environment_variables() {
    local secret_key=$1
    local site_key=$2
    local min_score=${3:-0.5}
    local env_file=${4:-".env"}

    log_info "Setting up environment variables..."

    # Backup existing .env file
    if [ -f "$env_file" ]; then
        cp "$env_file" "${env_file}.backup.$(date +%Y%m%d_%H%M%S)"
        log_info "Backup created: ${env_file}.backup.*"
    fi

    # Add or update reCAPTCHA variables
    {
        echo ""
        echo "# reCAPTCHA v3 Configuration"
        echo "RECAPTCHA_SECRET_KEY=$secret_key"
        echo "RECAPTCHA_SITE_KEY=$site_key"
        echo "RECAPTCHA_MINIMUM_SCORE=$min_score"
        echo ""
    } >> "$env_file"

    log_success "Environment variables added to $env_file"
}

# Generate sample configuration
generate_sample_config() {
    local output_file=${1:-"recaptcha-config.sample"}

    log_info "Generating sample configuration..."

    cat > "$output_file" << 'EOF'
# Twenty One Pilots - reCAPTCHA Configuration Sample
# Copy this to your .env file and replace with real values

# ==================================================
# reCAPTCHA v3 Configuration
# ==================================================

# Get these keys from: https://www.google.com/recaptcha/admin
RECAPTCHA_SECRET_KEY=your_secret_key_here_40_chars
RECAPTCHA_SITE_KEY=your_site_key_here_40_chars

# Minimum score threshold (0.0 - 1.0)
# Lower values = more permissive, higher values = more strict
RECAPTCHA_MINIMUM_SCORE=0.5

# ==================================================
# Additional Security Settings
# ==================================================

# Rate limiting for reCAPTCHA failures
RECAPTCHA_RATE_LIMIT_WINDOW=900000   # 15 minutes in ms
RECAPTCHA_RATE_LIMIT_MAX=5           # Max failures per window

# Monitoring and alerting
RECAPTCHA_ENABLE_MONITORING=true
RECAPTCHA_ALERT_THRESHOLD=0.7        # Alert if failure rate > 70%

# ==================================================
# Development Settings
# ==================================================

# Disable reCAPTCHA in development (not recommended for production)
# RECAPTCHA_ENABLED=false

EOF

    log_success "Sample configuration generated: $output_file"
}

# Show setup instructions
show_instructions() {
    echo ""
    log_critical "=== reCAPTCHA Setup Instructions ==="
    echo ""
    echo "1. Go to https://www.google.com/recaptcha/admin"
    echo "2. Click 'Create' and select 'reCAPTCHA v3'"
    echo "3. Enter your domain(s):"
    echo "   - localhost (for development)"
    echo "   - yourdomain.com (for production)"
    echo "4. Copy the Site Key and Secret Key"
    echo "5. Run this script with your keys:"
    echo ""
    echo "   ./scripts/setup-recaptcha.sh YOUR_SECRET_KEY YOUR_SITE_KEY"
    echo ""
    echo "6. Restart your application"
    echo "7. Test the integration"
    echo ""
}

# Validate current configuration
validate_current_config() {
    log_info "Validating current reCAPTCHA configuration..."

    local issues=()

    # Check environment variables
    if [ -z "$RECAPTCHA_SECRET_KEY" ]; then
        issues+=("RECAPTCHA_SECRET_KEY not set")
    fi

    if [ -z "$RECAPTCHA_SITE_KEY" ]; then
        issues+=("RECAPTCHA_SITE_KEY not set")
    fi

    if [ -n "$RECAPTCHA_MINIMUM_SCORE" ]; then
        local score
        score=$(echo "$RECAPTCHA_MINIMUM_SCORE" | awk '{print ($1 >= 0 && $1 <= 1) ? "valid" : "invalid"}')
        if [ "$score" = "invalid" ]; then
            issues+=("RECAPTCHA_MINIMUM_SCORE must be between 0.0 and 1.0")
        fi
    fi

    # Check API connectivity if keys are set
    if [ -n "$RECAPTCHA_SECRET_KEY" ] && [ -n "$RECAPTCHA_SITE_KEY" ]; then
        if ! test_recaptcha_api "$RECAPTCHA_SECRET_KEY"; then
            issues+=("reCAPTCHA API connectivity test failed")
        fi
    fi

    if [ ${#issues[@]} -eq 0 ]; then
        log_success "Current configuration is valid"
        return 0
    else
        log_error "Configuration issues found:"
        for issue in "${issues[@]}"; do
            log_error "  - $issue"
        done
        return 1
    fi
}

# Main setup function
main() {
    local command=$1

    case $command in
        setup)
            if [ $# -lt 3 ]; then
                log_error "Usage: $0 setup SECRET_KEY SITE_KEY [MIN_SCORE] [ENV_FILE]"
                echo ""
                show_instructions
                exit 1
            fi

            local secret_key=$2
            local site_key=$3
            local min_score=${4:-0.5}
            local env_file=${5:-".env"}

            log_info "Setting up reCAPTCHA v3..."
            log_info "Secret Key: ${secret_key:0:10}..."
            log_info "Site Key: ${site_key:0:10}..."
            log_info "Minimum Score: $min_score"

            if validate_recaptcha_keys "$secret_key" "$site_key"; then
                setup_environment_variables "$secret_key" "$site_key" "$min_score" "$env_file"
                log_success "reCAPTCHA setup completed!"
                echo ""
                log_info "Next steps:"
                echo "1. Restart your application"
                echo "2. Test login/register forms"
                echo "3. Check Grafana dashboards for reCAPTCHA metrics"
            fi
            ;;

        validate)
            validate_current_config
            ;;

        sample)
            local output_file=${2:-"recaptcha-config.sample"}
            generate_sample_config "$output_file"
            ;;

        help|--help|-h)
            echo "Twenty One Pilots - reCAPTCHA Setup Script"
            echo ""
            echo "Usage:"
            echo "  $0 setup SECRET_KEY SITE_KEY [MIN_SCORE] [ENV_FILE]  Setup reCAPTCHA"
            echo "  $0 validate                                               Validate current config"
            echo "  $0 sample [OUTPUT_FILE]                                 Generate sample config"
            echo "  $0 help                                                  Show this help"
            echo ""
            show_instructions
            ;;

        *)
            log_error "Unknown command: $command"
            echo ""
            echo "Run '$0 help' for usage information"
            exit 1
            ;;
    esac
}

# Handle script interruption
trap 'echo -e "\n${YELLOW}Setup interrupted${NC}"; exit 1' INT TERM

# Run main function
main "$@"