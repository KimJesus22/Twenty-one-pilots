#!/bin/bash

# Twenty One Pilots - Monitoring Health Check
# Verifies that all monitoring services are running and healthy

set -e

echo "🏥 Checking Monitoring System Health..."

SERVICES=(
    "Prometheus:http://localhost:9090/-/ready"
    "Grafana:http://localhost:3001/api/health"
    "Alertmanager:http://localhost:9093/-/ready"
    "Pushgateway:http://localhost:9091/-/ready"
)

ALL_HEALTHY=true

for service in "${SERVICES[@]}"; do
    NAME=$(echo $service | cut -d: -f1)
    URL=$(echo $service | cut -d: -f2)

    echo -n "🔍 Checking $NAME... "

    if curl -f -s "$URL" > /dev/null 2>&1; then
        echo "✅ Healthy"
    else
        echo "❌ Unhealthy"
        ALL_HEALTHY=false
    fi
done

echo ""
echo "📊 Checking Application Metrics Endpoint..."

if curl -f -s "http://localhost:5000/api/metrics/prometheus" > /dev/null 2>&1; then
    echo "✅ Backend metrics endpoint healthy"
else
    echo "❌ Backend metrics endpoint unhealthy"
    ALL_HEALTHY=false
fi

echo ""
echo "📈 Checking Active Alerts..."

ALERTS_COUNT=$(curl -s "http://localhost:9090/api/v1/alerts" | jq '.data.alerts | length' 2>/dev/null || echo "0")

if [ "$ALERTS_COUNT" -gt 0 ]; then
    echo "🚨 $ALERTS_COUNT active alerts found"
    curl -s "http://localhost:9090/api/v1/alerts" | jq '.data.alerts[] | {alertname: .labels.alertname, severity: .labels.severity, state: .state}'
else
    echo "✅ No active alerts"
fi

echo ""
if [ "$ALL_HEALTHY" = true ]; then
    echo "🎉 All monitoring services are healthy!"
    exit 0
else
    echo "⚠️  Some services are unhealthy. Check the output above."
    exit 1
fi