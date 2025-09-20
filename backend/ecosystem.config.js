module.exports = {
  apps: [{
    name: 'twentyonepilots-backend',
    script: 'server.js',
    instances: process.env.NODE_ENV === 'production' ? 'max' : 1,
    exec_mode: process.env.NODE_ENV === 'production' ? 'cluster' : 'fork',
    env: {
      NODE_ENV: 'development',
      PORT: 5000,
      LOG_LEVEL: 'debug',
      FORCE_HTTPS: 'false'
    },
    env_production: {
      NODE_ENV: 'production',
      HTTPS_PORT: 443,
      HTTP_PORT: 80,
      LOG_LEVEL: 'info',
      FORCE_HTTPS: 'true',
      // Variables de producción se cargan desde .env
    },
    // Configuración de logs
    log_file: './logs/pm2/combined.log',
    out_file: './logs/pm2/out.log',
    error_file: './logs/pm2/error.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    // Reinicio automático
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s',
    // Gestión de memoria
    max_memory_restart: '1G',
    // Configuración de cluster
    node_args: '--max_old_space_size=4096',
    // Variables de entorno específicas
    env_vars: {
      PM2_HOME: process.cwd(),
      PM2_LOGS_DIR: './logs/pm2'
    },
    // Configuración de monitoreo
    merge_logs: true,
    time: true,
    // Configuración de health checks
    health_check: {
      enabled: true,
      url: process.env.NODE_ENV === 'production'
        ? 'https://localhost:443/health'
        : 'http://localhost:5000/health',
      interval: 30000, // 30 segundos
      timeout: 5000,   // 5 segundos
      fails: 3,        // 3 fallos para reiniciar
      // Configuración SSL para health checks en producción
      ...(process.env.NODE_ENV === 'production' && {
        tls: {
          rejectUnauthorized: false // Para certificados auto-firmados en desarrollo
        }
      })
    }
  }],

  // Configuración de despliegue
  deploy: {
    production: {
      user: 'node',
      host: 'your-server.com',
      ref: 'origin/main',
      repo: 'git@github.com:your-username/twentyonepilots-app.git',
      path: '/var/www/twentyonepilots-backend',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env production',
      'pre-setup': ''
    }
  }
};