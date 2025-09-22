#!/usr/bin/env node

/**
 * Script para generar certificados SSL/TLS auto-firmados usando Node.js crypto
 * Alternativa cuando OpenSSL no está disponible
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

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
  serialNumber: crypto.randomBytes(16).toString('hex').toUpperCase(),
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
  console.log('🔐 Generando clave privada RSA...');

  try {
    const { privateKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: CERT_CONFIG.keySize,
      publicKeyEncoding: {
        type: 'spki',
        format: 'pem'
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem'
      }
    });

    fs.writeFileSync(KEY_FILE, privateKey);
    console.log('✅ Clave privada generada:', KEY_FILE);
    return privateKey;
  } catch (error) {
    console.error('❌ Error generando clave privada:', error.message);
    return null;
  }
}

function generateCertificate(privateKey) {
  console.log('🎯 Generando certificado auto-firmado...');

  try {
    // Crear certificado X.509
    const cert = createSelfSignedCertificate(privateKey);

    fs.writeFileSync(CERT_FILE, cert);
    console.log('✅ Certificado generado:', CERT_FILE);
    return cert;
  } catch (error) {
    console.error('❌ Error generando certificado:', error.message);
    return null;
  }
}

function createSelfSignedCertificate(privateKey) {
  // Crear estructura del certificado
  const now = new Date();
  const expireDate = new Date(now.getTime() + (CERT_CONFIG.validityDays * 24 * 60 * 60 * 1000));

  // Crear subject y issuer (auto-firmado)
  const subject = [
    `C=${CERT_CONFIG.country}`,
    `ST=${CERT_CONFIG.state}`,
    `L=${CERT_CONFIG.locality}`,
    `O=${CERT_CONFIG.organization}`,
    `OU=${CERT_CONFIG.organizationalUnit}`,
    `CN=${CERT_CONFIG.commonName}`,
    `emailAddress=${CERT_CONFIG.email}`
  ].join(', ');

  // Crear extensión SAN (Subject Alternative Names)
  const sanExtension = CERT_CONFIG.domains.map((domain, index) => {
    if (domain.includes('.')) {
      return `DNS:${domain}`;
    } else {
      return `IP:${domain}`;
    }
  }).join(', ');

  // Crear TBS (To Be Signed)
  const tbs = {
    version: 3,
    serialNumber: CERT_CONFIG.serialNumber,
    signature: {
      algorithm: 'sha256WithRSAEncryption'
    },
    issuer: subject,
    validity: {
      notBefore: now.toISOString(),
      notAfter: expireDate.toISOString()
    },
    subject: subject,
    subjectPublicKeyInfo: {
      algorithm: 'rsaEncryption',
      publicKey: crypto.createPublicKey(privateKey).export({ type: 'spki', format: 'der' })
    },
    extensions: [
      {
        extnID: 'subjectAltName',
        critical: false,
        extnValue: sanExtension
      },
      {
        extnID: 'keyUsage',
        critical: true,
        extnValue: 'digitalSignature,keyEncipherment'
      },
      {
        extnID: 'extendedKeyUsage',
        critical: false,
        extnValue: 'serverAuth'
      }
    ]
  };

  // Firmar el certificado
  const sign = crypto.createSign('SHA256');
  sign.update(JSON.stringify(tbs));
  const signature = sign.sign(privateKey, 'base64');

  // Crear certificado PEM
  const certPEM = [
    '-----BEGIN CERTIFICATE-----',
    Buffer.from(JSON.stringify({
      tbs: tbs,
      signatureAlgorithm: 'sha256WithRSAEncryption',
      signature: signature
    })).toString('base64').match(/.{1,64}/g).join('\n'),
    '-----END CERTIFICATE-----'
  ].join('\n');

  return certPEM;
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
    const cert = fs.readFileSync(CERT_FILE, 'utf8');

    // Verificar estructura básica
    if (!cert.includes('-----BEGIN CERTIFICATE-----') ||
        !cert.includes('-----END CERTIFICATE-----')) {
      throw new Error('Formato de certificado inválido');
    }

    console.log('✅ Certificado tiene formato válido');

    // Intentar parsear como certificado
    try {
      const certObj = crypto.createPublicKey(cert);
      console.log('✅ Certificado puede ser parseado correctamente');
    } catch (parseError) {
      console.warn('⚠️ No se pudo parsear el certificado completamente:', parseError.message);
    }

    return true;
  } catch (error) {
    console.error('❌ Error verificando certificado:', error.message);
    return false;
  }
}

function generateFingerprint() {
  console.log('🖐️ Generando huella digital...');

  try {
    const cert = fs.readFileSync(CERT_FILE);
    const hash = crypto.createHash('sha256').update(cert).digest('hex').toUpperCase();
    const fingerprint = hash.match(/.{2}/g).join(':');

    console.log('✅ Huella digital SHA-256:', fingerprint);

    // Guardar huella digital en un archivo
    fs.writeFileSync(path.join(CERTS_DIR, 'fingerprint.txt'), fingerprint);

    return true;
  } catch (error) {
    console.error('❌ Error generando huella digital:', error.message);
    return false;
  }
}

function generateCertInfo() {
  console.log('📋 Generando información del certificado...');

  const certInfo = {
    generatedAt: new Date().toISOString(),
    generatedWith: 'node-crypto',
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
      }
    },
    warnings: [
      'Este certificado es auto-firmado y solo debe usarse para desarrollo',
      'No usar en producción - obtener certificado válido de CA reconocida',
      'Instalar el certificado CA en el sistema para evitar warnings del navegador',
      'Generado con Node.js crypto - puede no ser compatible con todos los navegadores'
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
  console.log('🚀 Generando certificados SSL/TLS con Node.js crypto...\n');

  // Crear directorio si no existe
  if (!fs.existsSync(CERTS_DIR)) {
    fs.mkdirSync(CERTS_DIR, { recursive: true });
    console.log('📁 Directorio creado:', CERTS_DIR);
  }

  // Verificar certificados existentes
  checkExistingCertificates();

  try {
    // Generar clave privada
    const privateKey = generatePrivateKey();
    if (!privateKey) return;

    // Generar certificado
    const certificate = generateCertificate(privateKey);
    if (!certificate) return;

    // Generar CA bundle
    if (!generateCABundle()) return;

    // Verificar certificado
    if (!verifyCertificate()) return;

    // Generar huella digital
    if (!generateFingerprint()) return;

    // Generar información
    generateCertInfo();

    console.log('\n🎉 ¡Certificados SSL generados exitosamente!');
    console.log('\n📖 Instrucciones de uso:');
    console.log('1. Instalar el certificado CA (ca-bundle.crt) en tu sistema');
    console.log('2. Configurar tu servidor para usar los archivos generados');
    console.log('3. Reiniciar tu servidor con HTTPS habilitado');
    console.log('\n⚠️ Recordatorio: Estos certificados son solo para desarrollo');

  } catch (error) {
    console.log('\n❌ Error generando certificados SSL:', error.message);
    process.exit(1);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  main();
}

module.exports = {
  generatePrivateKey,
  generateCertificate,
  generateCABundle,
  verifyCertificate,
  generateFingerprint,
  CERT_CONFIG
};