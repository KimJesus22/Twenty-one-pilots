#!/bin/bash

# Twenty One Pilots - Monitoring Startup Script
# This script starts all monitoring services with proper configuration

set -e

echo "🚀 Starting Twenty One Pilots Monitoring System..."

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "⚠️  .env file not found. Copying from .env.example..."
    cp .env.example .env
    echo "✅ Please edit .env file with your configuration before continuing."
    echo "   Required variables:"
    echo "   - SMTP_USER, SMTP_PASS for email alerts"
    echo "   - SLACK_WEBHOOK_URL for Slack notifications"
    echo "   - ALERT_EMAIL for email recipients"
    exit 1
fi

# Load environment variables
set -a
source .env
set +a

echo "📋 Loaded configuration from .env"

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p ../monitoring/grafana/dashboards

# Copy dashboard files
echo "📊 Setting up Grafana dashboards..."
cp twentyonepilots-overview.json ../monitoring/grafana/dashboards/

# Start monitoring services
echo "🐳 Starting Docker services..."
cd ..
docker-compose --profile monitoring up -d

echo "⏳ Waiting for services to be ready..."

# Wait for Prometheus
echo "📊 Waiting for Prometheus..."
timeout 60 bash -c 'until curl -f http://localhost:9090/-/ready; do sleep 2; done' || {
    echo "❌ Prometheus failed to start"
    exit 1
}

# Wait for Grafana
echo "📈 Waiting for Grafana..."
timeout 60 bash -c 'until curl -f http://localhost:3001/api/health; do sleep 2; done' || {
    echo "❌ Grafana failed to start"
    exit 1
}

# Wait for Alertmanager
echo "🚨 Waiting for Alertmanager..."
timeout 30 bash -c 'until curl -f http://localhost:9093/-/ready; do sleep 2; done' || {
    echo "❌ Alertmanager failed to start"
    exit 1
}

# Wait for Pushgateway
echo "📤 Waiting for Pushgateway..."
timeout 30 bash -c 'until curl -f http://localhost:9091/-/ready; do sleep 2; done' || {
    echo "❌ Pushgateway failed to start"
    exit 1
}

echo ""
echo "🎉 Monitoring system started successfully!"
echo ""
echo "📊 Access URLs:"
echo "   Prometheus:     http://localhost:9090"
echo "   Grafana:        http://localhost:3001 (admin/admin)"
echo "   Alertmanager:   http://localhost:9093"
echo "   Pushgateway:    http://localhost:9091"
echo ""
echo "📋 Next steps:"
echo "   1. Configure Grafana data sources (automatically provisioned)"
echo "   2. Import dashboards (automatically provisioned)"
echo "   3. Test alerts by triggering high error rates"
echo "   4. Run E2E tests to see metrics in action"
echo ""
echo "🛑 To stop monitoring: docker-compose --profile monitoring down"
echo "📝 View logs: docker-compose --profile monitoring logs -f"