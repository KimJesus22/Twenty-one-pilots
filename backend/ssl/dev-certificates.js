const fs = require('fs');
const path = require('path');

// Certificados SSL de desarrollo simples (no válidos para producción)
const privateKey = `-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC7VJTUt9Us8cKB
sQ53FjTxKjQyJGg5GKqkw0SMpjpWRKlGKpWxPKdBWqVzqUJy0l2pGqIOGnjN0X8
...
-----END PRIVATE KEY-----`;

const certificate = `-----BEGIN CERTIFICATE-----
MIIDQTCCAimgAwIBAgITBmyfz5m/jAo54vB4ikPmljZbyjANBgkqhkiG9w0BAQsF
ADA5MQswCQYDVQQGEwJVUzEPMA0GA1UEChMGQXBwbGUwMzAxBgNVBAMTKkFwcGxl
...
-----END CERTIFICATE-----`;

// Directorio de certificados
const sslDir = path.join(__dirname);

// Crear directorio si no existe
if (!fs.existsSync(sslDir)) {
  fs.mkdirSync(sslDir, { recursive: true });
}

// Guardar certificados
fs.writeFileSync(path.join(sslDir, 'private.key'), privateKey);
fs.writeFileSync(path.join(sslDir, 'certificate.crt'), certificate);
fs.writeFileSync(path.join(sslDir, 'ca-bundle.crt'), certificate);

console.log('✅ Certificados SSL de desarrollo creados (simulados)');
console.log('📁 Archivos creados en:', sslDir);
console.log('⚠️  NOTA: Estos son certificados de ejemplo. Para desarrollo real, usa generate-dev-certs.js con OpenSSL');