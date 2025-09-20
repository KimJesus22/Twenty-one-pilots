# 🔒 Guía de Configuración SSL/TLS para Twenty One Pilots API

Esta guía explica cómo configurar HTTPS con certificados SSL válidos para la API de Twenty One Pilots.

## 📋 Requisitos Previos

- Node.js 16+
- OpenSSL (opcional, para certificados personalizados)
- PM2 (para despliegue en producción)

## 🛠️ Configuración de Certificados SSL

### Opción 1: Certificados de Desarrollo (Recomendado para desarrollo)

```bash
# Instalar dependencias
cd backend
npm install selfsigned

# Generar certificados válidos para desarrollo
cd ssl
node generate-valid-certs.js
```

Los certificados se generan en:
- `backend/ssl/private.key` - Clave privada
- `backend/ssl/certificate.crt` - Certificado público
- `backend/ssl/ca-bundle.crt` - Bundle CA

### Opción 2: Certificados de Producción con Let's Encrypt

```bash
# Instalar Certbot
sudo apt-get install certbot

# Generar certificado para tu dominio
sudo certbot certonly --standalone -d api.tu-dominio.com

# Los certificados se guardan en:
# /etc/letsencrypt/live/api.tu-dominio.com/
```

## ⚙️ Configuración del Servidor

### Variables de Entorno (.env)

```env
# SSL/TLS Configuration
SSL_KEY_PATH=./ssl/private.key
SSL_CERT_PATH=./ssl/certificate.crt
SSL_CA_BUNDLE_PATH=./ssl/ca-bundle.crt
FORCE_HTTPS=true

# Puertos
HTTPS_PORT=443
HTTP_PORT=80
PORT=5000

# Entorno
NODE_ENV=development  # o 'production'
```

### Configuración del Servidor

El servidor automáticamente:
- ✅ Detecta si hay certificados SSL disponibles
- ✅ Inicia servidor HTTPS en puerto 443 (producción)
- ✅ Inicia servidor HTTP que redirige a HTTPS
- ✅ Maneja errores de certificados
- ✅ Aplica configuraciones de seguridad avanzadas

## 🚀 Modos de Ejecución

### Desarrollo con HTTPS Forzado

```bash
# Ejecutar con HTTPS en desarrollo
cd backend
FORCE_HTTPS=true npm run dev
```

### Producción con PM2

```bash
# Iniciar con PM2
cd backend
pm2 start ecosystem.config.js --env production

# Verificar estado
pm2 status
pm2 logs twentyonepilots-backend
```

## 🔍 Verificación de HTTPS

### Pruebas Básicas

```bash
# Verificar que HTTPS funciona
curl -k https://localhost:443/

# Verificar redirección HTTP → HTTPS
curl -I http://localhost:80/
# Debería devolver: HTTP/1.1 301 Moved Permanently
```

### Pruebas de APIs sobre HTTPS

```bash
# Discografía
curl -k https://localhost:443/api/discography/albums

# Videos
curl -k "https://localhost:443/api/videos/search?q=twenty+one+pilots"

# Conciertos
curl -k "https://localhost:443/api/concerts/search?q=twenty+one+pilots"
```

### Verificación de Certificado

```bash
# Ver información del certificado
openssl s_client -connect localhost:443 -servername localhost < /dev/null

# Verificar cadena de certificados
openssl verify -CAfile ssl/ca-bundle.crt ssl/certificate.crt
```

## 🛡️ Características de Seguridad Implementadas

### Configuración SSL/TLS
- ✅ TLS 1.2 y 1.3 únicamente
- ✅ Ciphersuites seguras (ECDHE-RSA-AES128-GCM-SHA256, etc.)
- ✅ Perfect Forward Secrecy (PFS)
- ✅ Certificate pinning opcional

### Headers de Seguridad (Helmet.js)
- ✅ Strict-Transport-Security (HSTS)
- ✅ X-Frame-Options
- ✅ X-Content-Type-Options
- ✅ Content-Security-Policy (CSP)
- ✅ Referrer-Policy

### Rate Limiting
- ✅ 100 requests por 15 minutos (general)
- ✅ 5 requests por 15 minutos (autenticación)

### Sanitización y Validación
- ✅ Sanitización automática de inputs
- ✅ Validación de MongoDB ObjectIds
- ✅ Prevención de NoSQL injection
- ✅ Logging de seguridad avanzado

## 🔧 Solución de Problemas

### Error: "Puerto 443 requiere privilegios de administrador"

```bash
# Solución: Usar puerto no privilegiado en desarrollo
HTTPS_PORT=3443 npm run dev

# O ejecutar con sudo (no recomendado para desarrollo)
sudo HTTPS_PORT=443 npm run dev
```

### Error: "CERT_HAS_EXPIRED"

```bash
# Regenerar certificados
cd backend/ssl
node generate-valid-certs.js
```

### Error: "EADDRINUSE" (puerto en uso)

```bash
# Ver qué proceso usa el puerto
lsof -i :443

# Matar proceso
kill -9 <PID>

# O cambiar puerto
HTTPS_PORT=3443 npm run dev
```

### Problemas con PM2

```bash
# Reiniciar aplicación
pm2 restart twentyonepilots-backend

# Ver logs detallados
pm2 logs twentyonepilots-backend --lines 100

# Recargar configuración
pm2 reload ecosystem.config.js
```

## 📊 Monitoreo y Logs

### Logs de Seguridad

Los logs se guardan en:
- `backend/logs/audit-YYYY-MM-DD.log` - Logs de auditoría
- `backend/logs/error-YYYY-MM-DD.log` - Errores
- `backend/logs/http-YYYY-MM-DD.log` - Requests HTTP

### Health Checks

PM2 realiza health checks automáticos:
- URL: `https://localhost:443/health`
- Intervalo: 30 segundos
- Timeout: 5 segundos
- Reinicio automático tras 3 fallos

## 🌐 Configuración para Producción

### Con Nginx (Recomendado)

```nginx
# /etc/nginx/sites-available/twentyonepilots-api

server {
    listen 80;
    server_name api.tu-dominio.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.tu-dominio.com;

    # Certificados SSL
    ssl_certificate /etc/letsencrypt/live/api.tu-dominio.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.tu-dominio.com/privkey.pem;

    # Configuración SSL
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # Proxy a Node.js
    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Con Docker

```dockerfile
# Dockerfile
FROM node:18-alpine

# Instalar dependencias del sistema para SSL
RUN apk add --no-cache openssl

# Configurar aplicación
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# Copiar aplicación
COPY . .

# Generar certificados SSL
RUN cd ssl && node generate-valid-certs.js

# Exponer puertos
EXPOSE 80 443

# Ejecutar aplicación
CMD ["npm", "start"]
```

## 📞 Soporte

Si encuentras problemas con la configuración SSL:

1. Verifica los logs en `backend/logs/`
2. Asegúrate de que los certificados existen y son válidos
3. Verifica la configuración de variables de entorno
4. Prueba con certificados de desarrollo primero

## 🔄 Próximos Pasos

- [ ] Implementar HTTP/2
- [ ] Agregar OCSP stapling
- [ ] Configurar HSTS preload
- [ ] Implementar certificate transparency
- [ ] Agregar soporte para client certificates

---

**Nota**: Esta configuración proporciona seguridad de nivel producción mientras mantiene facilidad de desarrollo. Para entornos críticos, considera auditorías de seguridad adicionales.