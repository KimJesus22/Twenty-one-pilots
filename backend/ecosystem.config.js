module.exports = {
  apps: [{
    name: 'twentyonepilots-backend',
    script: 'server.js',
    // Configuración de escalabilidad inteligente
    instances: process.env.NODE_ENV === 'production' ? Math.min(require('os').cpus().length, 4) : 1,
    exec_mode: process.env.NODE_ENV === 'production' ? 'cluster' : 'fork',
    // Configuración de reinicio inteligente
    autorestart: true,
    restart_delay: 4000,
    max_restarts: 10,
    min_uptime: '10s',
    // Gestión de memoria avanzada
    max_memory_restart: process.env.NODE_ENV === 'production' ? '1.5G' : '1G',
    node_args: [
      '--max_old_space_size=4096',
      '--max-new-space-size=2048',
      '--optimize-for-size',
      '--gc-interval=100'
    ],
    // Configuración de logs avanzada
    log_file: './logs/pm2/combined.log',
    out_file: './logs/pm2/out.log',
    error_file: './logs/pm2/error.log',
    error_log: './logs/pm2/error.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    time: true,
    // Configuración de monitoreo
    watch: process.env.NODE_ENV === 'development' ? ['src', 'config'] : false,
    ignore_watch: ['node_modules', 'logs', 'test-results'],
    watch_options: {
      followSymlinks: false,
      usePolling: true,
      interval: 500
    },
    // Variables de entorno por entorno
    env: {
      NODE_ENV: 'development',
      PORT: 5000,
      LOG_LEVEL: 'debug',
      FORCE_HTTPS: 'false',
      PM2_INSTANCE_ID: 0
    },
    env_staging: {
      NODE_ENV: 'staging',
      PORT: 5000,
      LOG_LEVEL: 'info',
      FORCE_HTTPS: 'false',
      PM2_INSTANCE_ID: 0
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 5000,
      LOG_LEVEL: 'warn',
      FORCE_HTTPS: 'true',
      PM2_INSTANCE_ID: 0,
      // Variables de producción se cargan desde .env
    },
    // Health checks avanzados
    health_check: {
      enabled: true,
      url: function() {
        const port = process.env.PORT || 5000;
        const protocol = process.env.FORCE_HTTPS === 'true' ? 'https' : 'http';
        return `${protocol}://localhost:${port}/health`;
      },
      interval: 30000,    // 30 segundos
      timeout: 10000,     // 10 segundos
      fails: 3,           // 3 fallos para reiniciar
      success_threshold: 1,
      // Configuración SSL para health checks
      ...(process.env.FORCE_HTTPS === 'true' && {
        tls: {
          rejectUnauthorized: process.env.NODE_ENV === 'production'
        }
      })
    },
    // Configuración de graceful shutdown
    kill_timeout: 5000,
    wait_ready: true,
    listen_timeout: 10000,
    // Gestión de recursos
    max_restarts_per_hour: 10,
    // Variables de entorno específicas
    env_vars: {
      PM2_HOME: process.cwd(),
      PM2_LOGS_DIR: './logs/pm2',
      PM2_APP_NAME: 'twentyonepilots-backend'
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