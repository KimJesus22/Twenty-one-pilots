#!/usr/bin/env node

/**
 * Script de configuración inicial para el sistema de caché y colas
 * Twenty One Pilots API
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Configurando sistema de caché y colas...\n');

// Verificar dependencias
console.log('📦 Verificando dependencias...');
try {
  require('redis');
  require('bull');
  console.log('✅ Dependencias instaladas correctamente\n');
} catch (error) {
  console.log('❌ Dependencias faltantes. Instalando...');
  try {
    execSync('npm install redis bull', { stdio: 'inherit' });
    console.log('✅ Dependencias instaladas\n');
  } catch (installError) {
    console.error('❌ Error instalando dependencias:', installError.message);
    process.exit(1);
  }
}

// Verificar configuración de Redis
console.log('🔍 Verificando configuración de Redis...');
const envPath = path.join(__dirname, '..', 'backend', '.env');
let envExists = false;

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envExists = true;

  const redisVars = [
    'REDIS_HOST',
    'REDIS_PORT',
    'REDIS_DB'
  ];

  const missing = redisVars.filter(varName => !envContent.includes(varName + '='));

  if (missing.length > 0) {
    console.log('⚠️  Variables de entorno de Redis faltantes:');
    missing.forEach(varName => console.log(`   - ${varName}`));
    console.log('💡 Agregándolas automáticamente...\n');

    const redisConfig = `
# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
REDIS_TLS=false

# Cache Configuration
CACHE_DEFAULT_TTL=300
CACHE_REDIS_ENABLED=true

# Queue Configuration
QUEUE_EMAIL_CONCURRENCY=5
QUEUE_ANALYTICS_CONCURRENCY=2
QUEUE_RECOMMENDATIONS_CONCURRENCY=3
QUEUE_NOTIFICATIONS_CONCURRENCY=8

# Monitoring Configuration
MONITORING_TOKEN=dev-monitoring-token-12345
`;

    fs.appendFileSync(envPath, redisConfig);
    console.log('✅ Variables de entorno agregadas\n');
  } else {
    console.log('✅ Configuración de Redis encontrada\n');
  }
} else {
  console.log('⚠️  Archivo .env no encontrado. Creando configuración básica...\n');

  const basicEnv = `# Twenty One Pilots API Environment Configuration

# Application
NODE_ENV=development
PORT=5000

# Database
MONGO_URI=mongodb://localhost:27017/twentyonepilots

# JWT
JWT_SECRET=your-super-secret-jwt-key-here

# YouTube API
YOUTUBE_API_KEY=your-youtube-api-key-here

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
REDIS_TLS=false

# Cache Configuration
CACHE_DEFAULT_TTL=300
CACHE_REDIS_ENABLED=true

# Queue Configuration
QUEUE_EMAIL_CONCURRENCY=5
QUEUE_ANALYTICS_CONCURRENCY=2
QUEUE_RECOMMENDATIONS_CONCURRENCY=3
QUEUE_NOTIFICATIONS_CONCURRENCY=8

# Monitoring Configuration
MONITORING_TOKEN=dev-monitoring-token-12345

# Stripe (for payments)
STRIPE_SECRET_KEY=sk_test_your-stripe-secret-key
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret

# Frontend URL
FRONTEND_URL=http://localhost:3000
`;

  fs.writeFileSync(envPath, basicEnv);
  console.log('✅ Archivo .env creado con configuración básica\n');
}

// Verificar conectividad con Redis
console.log('🔌 Verificando conectividad con Redis...');
try {
  const { spawn } = require('child_process');
  const redisCheck = spawn('redis-cli', ['ping'], { stdio: 'pipe' });

  redisCheck.stdout.on('data', (data) => {
    if (data.toString().trim() === 'PONG') {
      console.log('✅ Redis está ejecutándose y respondiendo\n');
    }
  });

  redisCheck.stderr.on('data', (data) => {
    console.log('⚠️  Redis CLI no disponible o Redis no está ejecutándose');
    console.log('💡 Asegúrate de que Redis esté instalado y ejecutándose\n');
  });

  redisCheck.on('close', (code) => {
    if (code !== 0) {
      console.log('⚠️  No se pudo verificar Redis automáticamente');
      console.log('💡 Instala Redis y ejecuta: redis-server\n');
    }
  });

} catch (error) {
  console.log('⚠️  No se pudo verificar Redis (redis-cli no encontrado)');
  console.log('💡 Instala Redis desde: https://redis.io/download\n');
}

// Crear directorios necesarios
console.log('📁 Creando directorios necesarios...');
const dirs = [
  'backend/logs',
  'backend/cache',
  'backend/queues',
  'docs'
];

dirs.forEach(dir => {
  const fullPath = path.join(__dirname, '..', dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
    console.log(`✅ Directorio creado: ${dir}`);
  }
});
console.log('');

// Verificar archivos de configuración
console.log('📋 Verificando archivos de configuración...');
const configFiles = [
  'backend/config/redis.js',
  'backend/services/cacheService.js',
  'backend/services/queueService.js',
  'backend/middleware/cache.js',
  'backend/routes/monitoring.js',
  'docs/CACHING_QUEUE_SYSTEM.md'
];

configFiles.forEach(file => {
  const fullPath = path.join(__dirname, '..', file);
  if (fs.existsSync(fullPath)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - FALTANTE`);
  }
});
console.log('');

// Scripts de utilidad
console.log('🛠️  Creando scripts de utilidad...');

const scripts = {
  'cache-status': `#!/bin/bash
echo "📊 Estado del caché Redis"
echo "========================"
redis-cli info | grep -E "(connected_clients|used_memory_human|total_connections_received|keyspace_hits|keyspace_misses)"
echo ""
echo "🔍 Claves por patrón:"
echo "Concerts: $(redis-cli keys 'concerts:*' | wc -l) claves"
echo "Lyrics: $(redis-cli keys 'lyrics:*' | wc -l) claves"
echo "Products: $(redis-cli keys 'products:*' | wc -l) claves"
echo "Recommendations: $(redis-cli keys 'recommendations:*' | wc -l) claves"
`,

  'queue-status': `#!/bin/bash
echo "📋 Estado de las colas Bull"
echo "=========================="
echo "Cola Email: $(redis-cli keys 'bull:email-queue:*' | wc -l) jobs"
echo "Cola Analytics: $(redis-cli keys 'bull:analytics-queue:*' | wc -l) jobs"
echo "Cola Recommendations: $(redis-cli keys 'bull:recommendations-queue:*' | wc -l) jobs"
echo "Cola Notifications: $(redis-cli keys 'bull:notifications-queue:*' | wc -l) jobs"
echo ""
echo "📈 Estadísticas detalladas:"
curl -s http://localhost:5000/api/monitoring/queues/stats 2>/dev/null || echo "API no disponible"
`,

  'cache-clear': `#!/bin/bash
echo "🧹 Limpiando caché Redis..."
redis-cli flushdb
echo "✅ Caché limpiado"
`,

  'queue-clear': `#!/bin/bash
echo "🧹 Limpiando colas Bull..."
redis-cli keys 'bull:*:*' | xargs redis-cli del
echo "✅ Colas limpiadas"
`
};

const scriptsDir = path.join(__dirname, '..', 'scripts');
if (!fs.existsSync(scriptsDir)) {
  fs.mkdirSync(scriptsDir, { recursive: true });
}

Object.entries(scripts).forEach(([name, content]) => {
  const scriptPath = path.join(scriptsDir, `${name}.sh`);
  fs.writeFileSync(scriptPath, content);
  fs.chmodSync(scriptPath, '755');
  console.log(`✅ Script creado: scripts/${name}.sh`);
});
console.log('');

// Instrucciones finales
console.log('🎉 Configuración completada!');
console.log('');
console.log('📚 Próximos pasos:');
console.log('1. Asegúrate de que Redis esté ejecutándose: redis-server');
console.log('2. Inicia el backend: cd backend && npm run dev');
console.log('3. Verifica el estado: ./scripts/cache-status.sh');
console.log('4. Consulta la documentación: docs/CACHING_QUEUE_SYSTEM.md');
console.log('');
console.log('🔗 Endpoints de monitoreo:');
console.log('• Health check: http://localhost:5000/api/monitoring/health');
console.log('• Cache stats: http://localhost:5000/api/monitoring/cache/stats');
console.log('• Queue stats: http://localhost:5000/api/monitoring/queues/stats');
console.log('• Performance: http://localhost:5000/api/monitoring/performance');
console.log('');
console.log('📊 Métricas Prometheus: http://localhost:5000/api/monitoring/metrics');
console.log('');
console.log('🚀 ¡El sistema de caché y colas está listo para usar!');