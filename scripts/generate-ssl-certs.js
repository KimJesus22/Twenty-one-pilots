#!/usr/bin/env node

/**
 * Script para generar certificados SSL/TLS auto-firmados para desarrollo
 * Genera certificados válidos para localhost y dominios de desarrollo
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const crypto = require('crypto');

const CERTS_DIR = path.join(__dirname, '..', 'backend', 'ssl');
const KEY_FILE = path.join(CERTS_DIR, 'private.key');
const CERT_FILE = path.join(CERTS_DIR, 'certificate.crt');
const CA_CERT_FILE = path.join(CERTS_DIR, 'ca-bundle.crt');

// Configuración del certificado
const CERT_CONFIG = {
  country: 'MX',
  state: 'Mexico City',
  locality: 'Mexico City',
  organization: 'Twenty One Pilots Dev',
  organizationalUnit: 'Development',
  commonName: 'localhost',
  email: 'dev@twentyonepilots.local',
  validityDays: 365,
  keySize: 2048,
  domains: [
    'localhost',
    '127.0.0.1',
    '::1',
    '*.localhost',
    'twentyonepilots.local',
    '*.twentyonepilots.local'
  ]
};

function generatePrivateKey() {
  console.log('🔐 Generando clave privada...');

  try {
    // Generar clave privada RSA de 2048 bits
    execSync(`openssl genrsa -out "${KEY_FILE}" ${CERT_CONFIG.keySize}`, {
      stdio: 'inherit'
    });

    console.log('✅ Clave privada generada:', KEY_FILE);
    return true;
  } catch (error) {
    console.error('❌ Error generando clave privada:', error.message);
    return false;
  }
}

function generateCertificateRequest() {
  console.log('📝 Generando solicitud de certificado...');

  const configContent = `
[req]
distinguished_name = req_distinguished_name
req_extensions = v3_req
prompt = no

[req_distinguished_name]
C = ${CERT_CONFIG.country}
ST = ${CERT_CONFIG.state}
L = ${CERT_CONFIG.locality}
O = ${CERT_CONFIG.organization}
OU = ${CERT_CONFIG.organizationalUnit}
CN = ${CERT_CONFIG.commonName}
emailAddress = ${CERT_CONFIG.email}

[v3_req]
keyUsage = keyEncipherment, dataEncipherment
extendedKeyUsage = serverAuth
subjectAltName = @alt_names

[alt_names]
${CERT_CONFIG.domains.map((domain, index) => `DNS.${index + 1} = ${domain}`).join('\n')}
${CERT_CONFIG.domains.filter(d => /^\d+\.\d+\.\d+\.\d+$/.test(d)).map((ip, index) => `IP.${index + 1} = ${ip}`).join('\n')}
`;

  const configFile = path.join(CERTS_DIR, 'cert.conf');
  fs.writeFileSync(configFile, configContent);

  try {
    execSync(`openssl req -new -key "${KEY_FILE}" -out "${CERTS_DIR}/cert.csr" -config "${configFile}"`, {
      stdio: 'inherit'
    });

    console.log('✅ Solicitud de certificado generada');
    return true;
  } catch (error) {
    console.error('❌ Error generando solicitud de certificado:', error.message);
    return false;
  } finally {
    // Limpiar archivo de configuración temporal
    if (fs.existsSync(configFile)) {
      fs.unlinkSync(configFile);
    }
  }
}

function generateSelfSignedCertificate() {
  console.log('🎯 Generando certificado auto-firmado...');

  try {
    execSync(`openssl x509 -req -in "${CERTS_DIR}/cert.csr" -signkey "${KEY_FILE}" -out "${CERT_FILE}" -days ${CERT_CONFIG.validityDays} -extensions v3_req -extfile "${CERTS_DIR}/cert.conf"`, {
      stdio: 'inherit'
    });

    console.log('✅ Certificado auto-firmado generado:', CERT_FILE);
    return true;
  } catch (error) {
    console.error('❌ Error generando certificado:', error.message);
    return false;
  }
}

function generateCABundle() {
  console.log('📦 Generando bundle de CA...');

  try {
    // Copiar el certificado como bundle de CA (auto-firmado)
    fs.copyFileSync(CERT_FILE, CA_CERT_FILE);
    console.log('✅ Bundle de CA generado:', CA_CERT_FILE);
    return true;
  } catch (error) {
    console.error('❌ Error generando bundle de CA:', error.message);
    return false;
  }
}

function verifyCertificate() {
  console.log('🔍 Verificando certificado...');

  try {
    const result = execSync(`openssl x509 -in "${CERT_FILE}" -text -noout`, {
      encoding: 'utf8'
    });

    console.log('✅ Certificado válido');
    console.log('📄 Información del certificado:');
    console.log(result.split('\n').slice(0, 10).join('\n'));

    return true;
  } catch (error) {
    console.error('❌ Error verificando certificado:', error.message);
    return false;
  }
}

function generateFingerprint() {
  console.log('🖐️ Generando huella digital...');

  try {
    const result = execSync(`openssl x509 -in "${CERT_FILE}" -fingerprint -sha256 -noout`, {
      encoding: 'utf8'
    });

    const fingerprint = result.trim().split('=')[1];
    console.log('✅ Huella digital SHA-256:', fingerprint);

    // Guardar huella digital en un archivo
    fs.writeFileSync(path.join(CERTS_DIR, 'fingerprint.txt'), fingerprint);

    return true;
  } catch (error) {
    console.error('❌ Error generando huella digital:', error.message);
    return false;
  }
}

function cleanupTempFiles() {
  console.log('🧹 Limpiando archivos temporales...');

  const tempFiles = [
    path.join(CERTS_DIR, 'cert.csr'),
    path.join(CERTS_DIR, 'cert.conf')
  ];

  tempFiles.forEach(file => {
    if (fs.existsSync(file)) {
      fs.unlinkSync(file);
      console.log('🗑️ Eliminado:', file);
    }
  });
}

function generateCertInfo() {
  console.log('📋 Generando información del certificado...');

  const certInfo = {
    generatedAt: new Date().toISOString(),
    config: CERT_CONFIG,
    files: {
      privateKey: path.relative(CERTS_DIR, KEY_FILE),
      certificate: path.relative(CERTS_DIR, CERT_FILE),
      caBundle: path.relative(CERTS_DIR, CA_CERT_FILE),
      fingerprint: 'fingerprint.txt'
    },
    usage: {
      node: {
        key: path.relative(path.join(__dirname, '..'), KEY_FILE),
        cert: path.relative(path.join(__dirname, '..'), CERT_FILE),
        ca: path.relative(path.join(__dirname, '..'), CA_CERT_FILE)
      },
      nginx: {
        ssl_certificate: path.relative(path.join(__dirname, '..'), CERT_FILE),
        ssl_certificate_key: path.relative(path.join(__dirname, '..'), KEY_FILE)
      }
    },
    warnings: [
      'Este certificado es auto-firmado y solo debe usarse para desarrollo',
      'No usar en producción - obtener certificado válido de CA reconocida',
      'Instalar el certificado CA en el sistema para evitar warnings del navegador'
    ]
  };

  const infoFile = path.join(CERTS_DIR, 'cert-info.json');
  fs.writeFileSync(infoFile, JSON.stringify(certInfo, null, 2));

  console.log('✅ Información del certificado guardada en:', infoFile);
}

function checkExistingCertificates() {
  const existingFiles = [KEY_FILE, CERT_FILE, CA_CERT_FILE];

  if (existingFiles.some(file => fs.existsSync(file))) {
    console.log('⚠️ Se encontraron certificados existentes. ¿Desea sobrescribirlos? (y/N)');

    // En un script interactivo, aquí pediríamos confirmación
    // Por ahora, procedemos con la sobrescritura
    console.log('🔄 Sobrescribiendo certificados existentes...');
  }
}

function main() {
  console.log('🚀 Generando certificados SSL/TLS para desarrollo...\n');

  // Crear directorio si no existe
  if (!fs.existsSync(CERTS_DIR)) {
    fs.mkdirSync(CERTS_DIR, { recursive: true });
    console.log('📁 Directorio creado:', CERTS_DIR);
  }

  // Verificar certificados existentes
  checkExistingCertificates();

  const steps = [
    generatePrivateKey,
    generateCertificateRequest,
    generateSelfSignedCertificate,
    generateCABundle,
    verifyCertificate,
    generateFingerprint
  ];

  let success = true;
  for (const step of steps) {
    if (!step()) {
      success = false;
      break;
    }
  }

  if (success) {
    // Limpiar archivos temporales
    cleanupTempFiles();

    // Generar información del certificado
    generateCertInfo();

    console.log('\n🎉 ¡Certificados SSL generados exitosamente!');
    console.log('\n📖 Instrucciones de uso:');
    console.log('1. Instalar el certificado CA (ca-bundle.crt) en tu sistema');
    console.log('2. Configurar tu servidor para usar los archivos generados');
    console.log('3. Reiniciar tu servidor con HTTPS habilitado');
    console.log('\n⚠️ Recordatorio: Estos certificados son solo para desarrollo');
  } else {
    console.log('\n❌ Error generando certificados SSL');
    process.exit(1);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  main();
}

module.exports = {
  generatePrivateKey,
  generateCertificateRequest,
  generateSelfSignedCertificate,
  generateCABundle,
  verifyCertificate,
  generateFingerprint,
  CERT_CONFIG
};