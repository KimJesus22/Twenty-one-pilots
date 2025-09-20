const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Directorio de certificados
const sslDir = path.join(__dirname);

// Configuración del certificado
const certConfig = `
[req]
distinguished_name = req_distinguished_name
req_extensions = v3_req
prompt = no

[req_distinguished_name]
C = MX
ST = Mexico City
L = Mexico City
O = Twenty One Pilots App
OU = Development
CN = localhost

[v3_req]
keyUsage = keyEncipherment, dataEncipherment
extendedKeyUsage = serverAuth
subjectAltName = @alt_names

[alt_names]
DNS.1 = localhost
DNS.2 = 127.0.0.1
DNS.3 = *.localhost
`;

console.log('🔐 Generando certificados SSL de desarrollo...');

// Crear directorio si no existe
if (!fs.existsSync(sslDir)) {
  fs.mkdirSync(sslDir, { recursive: true });
}

// Crear archivo de configuración
const configPath = path.join(sslDir, 'cert.conf');
fs.writeFileSync(configPath, certConfig);

try {
  // Generar clave privada
  console.log('📝 Generando clave privada...');
  execSync(`openssl genrsa -out "${path.join(sslDir, 'private.key')}" 2048`, { stdio: 'inherit' });

  // Generar certificado auto-firmado
  console.log('📜 Generando certificado...');
  execSync(`openssl req -new -x509 -key "${path.join(sslDir, 'private.key')}" -out "${path.join(sslDir, 'certificate.crt')}" -days 365 -config "${configPath}" -extensions v3_req`, { stdio: 'inherit' });

  // Crear bundle CA (para compatibilidad)
  console.log('🔗 Creando bundle CA...');
  execSync(`copy "${path.join(sslDir, 'certificate.crt')}" "${path.join(sslDir, 'ca-bundle.crt')}"`, { stdio: 'inherit' });

  // Limpiar archivo de configuración
  fs.unlinkSync(configPath);

  console.log('✅ Certificados SSL generados exitosamente!');
  console.log('📁 Archivos creados:');
  console.log(`   - ${path.join(sslDir, 'private.key')} (clave privada)`);
  console.log(`   - ${path.join(sslDir, 'certificate.crt')} (certificado)`);
  console.log(`   - ${path.join(sslDir, 'ca-bundle.crt')} (bundle CA)`);
  console.log('');
  console.log('⚠️  IMPORTANTE: Estos certificados son solo para desarrollo.');
  console.log('   Para producción, usa certificados válidos de Let\'s Encrypt.');

} catch (error) {
  console.error('❌ Error generando certificados:', error.message);
  process.exit(1);
}