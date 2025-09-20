const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Directorio de certificados
const sslDir = path.join(__dirname);

// Función para generar certificados auto-firmados usando Node.js
function generateSelfSignedCert() {
  console.log('🔐 Generando certificados SSL de desarrollo con Node.js...');

  // Crear directorio si no existe
  if (!fs.existsSync(sslDir)) {
    fs.mkdirSync(sslDir, { recursive: true });
  }

  try {
    // Generar clave privada RSA de 2048 bits
    console.log('📝 Generando clave privada...');
    const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: {
        type: 'spki',
        format: 'pem'
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem'
      }
    });

    // Crear certificado auto-firmado
    console.log('📜 Generando certificado...');
    const cert = crypto.createCertificate({
      subject: {
        C: 'MX',
        ST: 'Mexico City',
        L: 'Mexico City',
        O: 'Twenty One Pilots App',
        OU: 'Development',
        CN: 'localhost'
      },
      issuer: {
        C: 'MX',
        ST: 'Mexico City',
        L: 'Mexico City',
        O: 'Twenty One Pilots App',
        OU: 'Development',
        CN: 'localhost'
      },
      validity: {
        notBefore: new Date(),
        notAfter: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 año
      },
      publicKey: publicKey,
      serialNumber: crypto.randomBytes(16).toString('hex'),
      extensions: [
        {
          name: 'subjectAltName',
          altNames: [
            { type: 2, value: 'localhost' },
            { type: 7, ip: '127.0.0.1' },
            { type: 2, value: '*.localhost' }
          ]
        },
        {
          name: 'keyUsage',
          keyCertSign: true,
          digitalSignature: true,
          nonRepudiation: true,
          keyEncipherment: true,
          dataEncipherment: true
        },
        {
          name: 'extKeyUsage',
          serverAuth: true
        }
      ]
    });

    // Firmar el certificado
    const signedCert = crypto.signCertificate(cert, privateKey);

    // Guardar archivos
    const privateKeyPath = path.join(sslDir, 'private.key');
    const certificatePath = path.join(sslDir, 'certificate.crt');
    const caBundlePath = path.join(sslDir, 'ca-bundle.crt');

    fs.writeFileSync(privateKeyPath, privateKey);
    fs.writeFileSync(certificatePath, signedCert);
    fs.writeFileSync(caBundlePath, signedCert); // Para compatibilidad

    console.log('✅ Certificados SSL generados exitosamente!');
    console.log('📁 Archivos creados:');
    console.log(`   - ${privateKeyPath} (clave privada)`);
    console.log(`   - ${certificatePath} (certificado)`);
    console.log(`   - ${caBundlePath} (bundle CA)`);
    console.log('');
    console.log('⚠️  IMPORTANTE: Estos certificados son solo para desarrollo.');
    console.log('   Para producción, usa certificados válidos de Let\'s Encrypt.');

  } catch (error) {
    console.error('❌ Error generando certificados:', error.message);
    console.log('');
    console.log('💡 Alternativa: Instala OpenSSL y ejecuta generate-dev-certs.js');
    process.exit(1);
  }
}

// Ejecutar la función
generateSelfSignedCert();