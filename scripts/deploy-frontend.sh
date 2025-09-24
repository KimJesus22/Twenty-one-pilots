#!/bin/bash

# Deploy frontend with production environment variables
# Run this on your production server

set -e

echo "Building frontend for production..."

# Set production environment variables
export REACT_APP_API_URL="https://34.51.90.100/api"
export NODE_OPTIONS="--max-old-space-size=4096"

# Navigate to frontend directory
cd /home/adrianceron5852/Twenty-one-pilots/frontend

# Install dependencies if needed
npm install

# Build the frontend
npm run build

# Copy build files to nginx directory
sudo cp -r build/* /home/adrianceron5852/Twenty-one-pilots/frontend/build/

# Reload nginx to pick up new files
sudo systemctl reload nginx

echo "Frontend deployed successfully!"
echo "API URL configured as: $REACT_APP_API_URL"