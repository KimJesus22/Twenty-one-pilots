const selfsigned = require('selfsigned');
const fs = require('fs');
const path = require('path');

console.log('🔐 Generando certificados SSL válidos para desarrollo...');

// Configuración del certificado
const attrs = [
  { name: 'countryName', value: 'MX' },
  { name: 'stateOrProvinceName', value: 'Mexico City' },
  { name: 'localityName', value: 'Mexico City' },
  { name: 'organizationName', value: 'Twenty One Pilots App' },
  { name: 'organizationalUnitName', value: 'Development' },
  { name: 'commonName', value: 'localhost' }
];

const options = {
  keySize: 2048,
  days: 365,
  algorithm: 'sha256',
  extensions: [
    {
      name: 'subjectAltName',
      altNames: [
        { type: 2, value: 'localhost' },
        { type: 7, ip: '127.0.0.1' },
        { type: 2, value: '*.localhost' }
      ]
    }
  ]
};

try {
  // Generar certificado
  const pems = selfsigned.generate(attrs, options);

  // Directorio de certificados
  const sslDir = path.join(__dirname);

  // Crear directorio si no existe
  if (!fs.existsSync(sslDir)) {
    fs.mkdirSync(sslDir, { recursive: true });
  }

  // Guardar archivos
  const privateKeyPath = path.join(sslDir, 'private.key');
  const certificatePath = path.join(sslDir, 'certificate.crt');
  const caBundlePath = path.join(sslDir, 'ca-bundle.crt');

  fs.writeFileSync(privateKeyPath, pems.private);
  fs.writeFileSync(certificatePath, pems.cert);
  fs.writeFileSync(caBundlePath, pems.cert); // Para compatibilidad

  console.log('✅ Certificados SSL válidos generados exitosamente!');
  console.log('📁 Archivos creados:');
  console.log(`   - ${privateKeyPath} (clave privada)`);
  console.log(`   - ${certificatePath} (certificado)`);
  console.log(`   - ${caBundlePath} (bundle CA)`);
  console.log('');
  console.log('🔒 El certificado es válido para:');
  console.log('   - localhost');
  console.log('   - 127.0.0.1');
  console.log('   - *.localhost');
  console.log('');
  console.log('⚠️  IMPORTANTE: Este certificado es solo para desarrollo.');
  console.log('   Para producción, usa Let\'s Encrypt o un CA autorizado.');

} catch (error) {
  console.error('❌ Error generando certificados:', error.message);
  process.exit(1);
}