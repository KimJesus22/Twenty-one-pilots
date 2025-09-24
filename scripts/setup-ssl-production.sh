#!/bin/bash

# Setup SSL for Twenty One Pilots production
# Run this on your production server

set -e

echo "Setting up SSL for Twenty One Pilots production..."

# Generate SSL certificates
echo "Generating SSL certificates..."
bash /home/adrianceron5852/Twenty-one-pilots/scripts/generate-ssl-certs.sh

# Backup current nginx config
echo "Backing up current nginx configuration..."
sudo cp /etc/nginx/sites-enabled/twentyonepilots /etc/nginx/sites-enabled/twentyonepilots.backup.$(date +%Y%m%d_%H%M%S)

# Copy new SSL config
echo "Installing new SSL nginx configuration..."
sudo cp /home/adrianceron5852/Twenty-one-pilots/nginx/twentyonepilots-ssl.conf /etc/nginx/sites-enabled/twentyonepilots

# Test nginx configuration
echo "Testing nginx configuration..."
sudo nginx -t

# Reload nginx
echo "Reloading nginx..."
sudo systemctl reload nginx

echo "SSL setup completed successfully!"
echo "Your site is now available at https://34.51.90.100"
echo ""
echo "Note: Since this uses self-signed certificates, browsers will show a security warning."
echo "For a production domain, consider using Let's Encrypt for free trusted certificates."