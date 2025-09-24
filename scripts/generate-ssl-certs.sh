#!/bin/bash

# Script to generate self-signed SSL certificates for Twenty One Pilots
# Run this on your production server

set -e

CERT_DIR="/etc/nginx/ssl"
DOMAIN="34.51.90.100"
DAYS=365

echo "Generating self-signed SSL certificates for $DOMAIN..."

# Create SSL directory if it doesn't exist
sudo mkdir -p $CERT_DIR

# Generate private key
sudo openssl genrsa -out $CERT_DIR/privkey.pem 2048

# Generate certificate signing request
sudo openssl req -new -key $CERT_DIR/privkey.pem -out $CERT_DIR/cert.csr -subj "/C=US/ST=State/L=City/O=Organization/CN=$DOMAIN"

# Generate self-signed certificate
sudo openssl x509 -req -days $DAYS -in $CERT_DIR/cert.csr -signkey $CERT_DIR/privkey.pem -out $CERT_DIR/fullchain.pem

# Set proper permissions
sudo chmod 600 $CERT_DIR/privkey.pem
sudo chmod 644 $CERT_DIR/fullchain.pem

echo "SSL certificates generated successfully!"
echo "Certificate: $CERT_DIR/fullchain.pem"
echo "Private key: $CERT_DIR/privkey.pem"
echo "Valid for $DAYS days"