
/**
 * Servidor principal para la aplicación Twenty One Pilots API
 * Maneja la configuración SSL/TLS y el inicio de servidores HTTP/HTTPS
 *
 * @author KimJesus21
 * @version 2.0.0
 * @since 2025-09-20
 */

const express = require('express');
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// solo aquí, al tope de server.js
dotenv.config({ quiet: true });

// Importar aplicación configurada
const app = require('./app');

// Importar logger
const logger = require('./utils/logger');

// La configuración de la aplicación ahora está en app.js
// Este archivo solo maneja la configuración SSL/TLS y el inicio de servidores

// Configuración SSL/TLS
let sslOptions = null;
const isProduction = process.env.NODE_ENV === 'production';
const forceHttps = process.env.FORCE_HTTPS === 'true';

// Configurar SSL solo si estamos en producción o si se fuerza HTTPS
if (isProduction || forceHttps) {
  try {
    const sslKeyPath = path.resolve(process.env.SSL_KEY_PATH || './ssl/private.key');
    const sslCertPath = path.resolve(process.env.SSL_CERT_PATH || './ssl/certificate.crt');
    const sslCaBundlePath = path.resolve(process.env.SSL_CA_BUNDLE_PATH || './ssl/ca-bundle.crt');

    // Verificar que los archivos de certificado existen
    if (fs.existsSync(sslKeyPath) && fs.existsSync(sslCertPath)) {
      sslOptions = {
        key: fs.readFileSync(sslKeyPath),
        cert: fs.readFileSync(sslCertPath),
        // Agregar CA bundle si existe
        ...(fs.existsSync(sslCaBundlePath) && {
          ca: fs.readFileSync(sslCaBundlePath)
        }),
        // Configuraciones de seguridad adicionales
        secureOptions: require('constants').SSL_OP_NO_TLSv1 | require('constants').SSL_OP_NO_TLSv1_1,
        ciphers: [
          'ECDHE-RSA-AES128-GCM-SHA256',
          'ECDHE-RSA-AES256-GCM-SHA384',
          'ECDHE-RSA-AES128-SHA256',
          'ECDHE-RSA-AES256-SHA384'
        ].join(':'),
        honorCipherOrder: true,
        requestCert: false,
        rejectUnauthorized: false
      };

      console.log('✅ Configuración SSL/TLS cargada exitosamente');
    } else {
      console.warn('⚠️  Archivos de certificado SSL no encontrados, ejecutando sin HTTPS');
      if (isProduction) {
        console.error('❌ ERROR: En producción se requieren certificados SSL válidos');
        process.exit(1);
      }
    }
  } catch (error) {
    console.error('❌ Error configurando SSL/TLS:', error.message);
    if (isProduction) {
      console.error('❌ ERROR: No se puede iniciar en producción sin configuración SSL válida');
      process.exit(1);
    }
  }
}

// Puertos
const HTTP_PORT = parseInt(process.env.HTTP_PORT) || 80;
const HTTPS_PORT = parseInt(process.env.HTTPS_PORT) || 443;
const DEV_PORT = parseInt(process.env.PORT) || 5000;

// Función para iniciar servidores
function startServers() {
  // Servidor HTTP (solo para redirección a HTTPS en producción)
  if (isProduction && sslOptions && forceHttps) {
    const httpApp = require('express')();

    // Middleware mínimo para redirección
    httpApp.use((req, res) => {
      const host = req.headers.host?.split(':')[0] || 'localhost';
      const httpsUrl = `https://${host}:${HTTPS_PORT}${req.url}`;
      console.log(`🔄 Redirigiendo HTTP a HTTPS: ${req.url} → ${httpsUrl}`);
      res.redirect(301, httpsUrl);
    });

    const httpServer = http.createServer(httpApp);
    httpServer.listen(HTTP_PORT, () => {
      logger.info(`🌐 Servidor HTTP corriendo en puerto ${HTTP_PORT} (redirección a HTTPS)`);
    });

    // Manejar errores del servidor HTTP
    httpServer.on('error', (error) => {
      if (error.code === 'EACCES' && HTTP_PORT < 1024) {
        logger.error(`❌ Error: Puerto ${HTTP_PORT} requiere privilegios de administrador`);
        logger.info('💡 Sugerencia: Ejecuta con sudo o usa un puerto > 1024');
      } else {
        logger.error('❌ Error en servidor HTTP:', error.message);
      }
    });
  }

  // Servidor HTTPS o HTTP de desarrollo
  let server;
  let port;
  let protocol;

  if (sslOptions && (isProduction || forceHttps)) {
    // Servidor HTTPS
    server = https.createServer(sslOptions, app);
    port = HTTPS_PORT;
    protocol = 'HTTPS';

    server.listen(port, () => {
      logger.info(`🔒 Servidor ${protocol} corriendo en puerto ${port}`, {
        port,
        environment: process.env.NODE_ENV || 'development',
        sslEnabled: true
      });
    });

    // Manejar errores del servidor HTTPS
    server.on('error', (error) => {
      if (error.code === 'EACCES' && port < 1024) {
        logger.error(`❌ Error: Puerto ${port} requiere privilegios de administrador`);
        logger.info('💡 Sugerencia: Ejecuta con sudo o usa un puerto > 1024');
      } else if (error.code === 'CERT_HAS_EXPIRED') {
        logger.error('❌ Error: El certificado SSL ha expirado');
      } else if (error.code === 'ERR_SSL_TLSV1_ALERT_UNKNOWN_CA') {
        logger.error('❌ Error: Autoridad certificadora no reconocida');
      } else {
        logger.error(`❌ Error en servidor ${protocol}:`, error.message);
      }
    });

  } else {
    // Servidor HTTP de desarrollo
    server = http.createServer(app);
    port = DEV_PORT;
    protocol = 'HTTP';

    server.listen(port, () => {
      logger.info(`🌐 Servidor ${protocol} corriendo en puerto ${port}`, {
        port,
        environment: process.env.NODE_ENV || 'development',
        sslEnabled: false
      });
    });

    // Manejar errores del servidor HTTP de desarrollo
    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        logger.error(`❌ Error: Puerto ${port} ya está en uso`);
        logger.info(`💡 Sugerencia: Mata el proceso usando el puerto ${port} o cambia el puerto`);
      } else {
        logger.error(`❌ Error en servidor ${protocol}:`, error.message);
      }
    });
  }

  // Graceful shutdown para ambos servidores
  const gracefulShutdown = (signal) => {
    logger.info(`${signal} recibido, cerrando servidor gracefully`);

    if (server) {
      server.close(() => {
        logger.info('✅ Servidor cerrado exitosamente');
        process.exit(0);
      });

      // Forzar cierre después de 10 segundos
      setTimeout(() => {
        logger.error('❌ Timeout en graceful shutdown, forzando cierre');
        process.exit(1);
      }, 10000);
    } else {
      process.exit(0);
    }
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
}

// Iniciar servidores
startServers();

// Iniciar monitoreo periódico de métricas (deshabilitado temporalmente)
// startPeriodicMonitoring();
// console.log('📊 Sistema de métricas y monitoreo iniciado');

// ===== DEBUG: no matar el proceso al fallar, solo loguear el stack =====
process.removeAllListeners('uncaughtException');
process.removeAllListeners('unhandledRejection');

process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION >>>\n', err && err.stack || err);
  // no hagas process.exit(1) mientras depuras
});

process.on('unhandledRejection', (reason, p) => {
  console.error('UNHANDLED REJECTION >>>\n', reason && reason.stack || reason, '\nPromise:', p);
  // no hagas process.exit(1) mientras depuras
});