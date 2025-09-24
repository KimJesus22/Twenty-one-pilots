#!/bin/bash

# Deploy frontend with legacy Node.js support
# For servers with Node.js < 14

set -e

echo "Building frontend for legacy Node.js..."

# Check Node version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 14 ]; then
    echo "Warning: Node.js version $NODE_VERSION detected. Some features may not work."
    echo "Consider upgrading to Node.js 18+ for full compatibility."
fi

# Set production environment variables
export REACT_APP_API_URL="https://34.51.90.100/api"
export NODE_OPTIONS="--max-old-space-size=2048"

# Navigate to frontend directory
cd /home/adrianceron5852/Twenty-one-pilots/frontend

# Clean and reinstall with legacy peer deps
echo "Cleaning node_modules..."
rm -rf node_modules package-lock.json

echo "Installing dependencies with legacy peer deps..."
npm install --legacy-peer-deps

# Build with minimal features
echo "Building frontend..."
DISABLE_ESLINT_PLUGIN=true npm run build

# Copy build files
echo "Copying build files..."
sudo cp -r build/* /home/adrianceron5852/Twenty-one-pilots/frontend/build/

# Reload nginx
echo "Reloading nginx..."
sudo systemctl reload nginx

echo "Frontend deployed successfully!"
echo "API URL configured as: $REACT_APP_API_URL"
echo ""
echo "Note: Due to Node.js version limitations, some modern features may not be available."
echo "Consider upgrading Node.js to 18+ for better compatibility."