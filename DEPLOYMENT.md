# 🚀 Guía de Despliegue - Twenty One Pilots

Esta guía proporciona instrucciones completas para desplegar la aplicación Twenty One Pilots en entornos de staging y producción con estrategias de zero-downtime deployment, monitoreo avanzado y rollback automático.

## 📋 Tabla de Contenidos

- [Arquitectura de Despliegue](#-arquitectura-de-despliegue)
- [Prerrequisitos](#-prerrequisitos)
- [Configuración del Entorno](#-configuración-del-entorno)
- [Despliegue en Staging](#-despliegue-en-staging)
- [Despliegue en Producción](#-despliegue-en-producción)
- [Monitoreo y Alertas](#-monitoreo-y-alertas)
- [Rollback y Recuperación](#-rollback-y-recuperación)
- [CI/CD con GitHub Actions](#-cicd-con-github-actions)
- [Solución de Problemas](#-solución-de-problemas)

## 🏗️ Arquitectura de Despliegue

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   GitHub Actions │───▶│   Docker Build   │───▶│  Staging/Prod   │
│    CI/CD Pipeline │    │   & Test        │    │   Servers       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Slack/Email    │    │   Health Checks  │    │   Monitoring    │
│ Notifications    │    │   & Rollback     │    │   Stack         │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Componentes del Sistema

#### **Aplicación**
- **Frontend**: React SPA servido por Nginx
- **Backend**: Node.js API con PM2 clustering
- **Base de Datos**: MongoDB con réplicas
- **Cache**: Redis para sesiones y datos

#### **Infraestructura**
- **Reverse Proxy**: Nginx con SSL y load balancing
- **Contenedores**: Docker con multi-stage builds
- **Orquestación**: Docker Compose para desarrollo/producción

#### **Monitoreo**
- **Prometheus**: Recolección de métricas
- **Grafana**: Dashboards y visualización
- **Alertmanager**: Gestión de alertas
- **Pushgateway**: Métricas de E2E tests

## 📋 Prerrequisitos

### Servidores
- **Staging**: Ubuntu 20.04+ con 2GB RAM, 20GB disco
- **Producción**: Ubuntu 20.04+ con 4GB RAM, 50GB disco
- **Acceso SSH**: Claves configuradas para deployment

### Software Base
```bash
# Instalar Docker y Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Instalar herramientas adicionales
sudo apt update
sudo apt install -y curl wget git htop ncdu
```

### DNS y SSL
- **Dominio**: Configurado apuntando a los servidores
- **SSL**: Certificados Let's Encrypt o válidos
- **Firewall**: Puertos 80, 443, 22 abiertos

## ⚙️ Configuración del Entorno

### 1. Variables de Entorno

Crear archivos `.env` para cada entorno:

#### **Staging (.env.staging)**
```env
# Application
NODE_ENV=staging
PORT=5000

# Database
MONGO_URI=mongodb://mongodb:27017/twentyonepilots_staging
REDIS_URL=redis://redis:6379

# External APIs
YOUTUBE_API_KEY=your_staging_api_key

# Security
JWT_SECRET=your_staging_jwt_secret

# Monitoring
GF_SECURITY_ADMIN_PASSWORD=staging_admin_pass
```

#### **Producción (.env.production)**
```env
# Application
NODE_ENV=production
PORT=5000

# Database
MONGO_URI=mongodb://mongodb:27017/twentyonepilots_prod
REDIS_URL=redis://redis:6379

# External APIs
YOUTUBE_API_KEY=your_production_api_key

# Security
JWT_SECRET=your_production_jwt_secret

# Monitoring
GF_SECURITY_ADMIN_PASSWORD=prod_admin_pass

# SSL
SSL_CERT_PATH=/etc/nginx/ssl/fullchain.pem
SSL_KEY_PATH=/etc/nginx/ssl/privkey.pem
```

### 2. Configuración de SSH

```bash
# Generar clave SSH si no existe
ssh-keygen -t rsa -b 4096 -C "deploy@twentyonepilots.com"

# Copiar clave pública a servidores
ssh-copy-id user@staging-server
ssh-copy-id user@production-server
```

### 3. Configuración de Docker

```bash
# Crear directorios necesarios
sudo mkdir -p /opt/twentyonepilots
sudo mkdir -p /opt/twentyonepilots/backups
sudo mkdir -p /opt/twentyonepilots/logs

# Configurar permisos
sudo chown -R $USER:$USER /opt/twentyonepilots
```

## 🧪 Despliegue en Staging

### Método 1: Usando Script Automático

```bash
# Configurar variables de entorno
export STAGING_HOST=staging.yourdomain.com
export STAGING_USER=deploy

# Ejecutar deployment
./scripts/deployment/deploy-staging.sh
```

### Método 2: Manual Step-by-Step

```bash
# 1. Conectar al servidor
ssh deploy@staging.yourdomain.com

# 2. Ir al directorio del proyecto
cd /opt/twentyonepilots

# 3. Crear backup
mkdir -p backups
tar -czf backups/pre-deploy-$(date +%s).tar.gz .

# 4. Actualizar código
git pull origin develop

# 5. Construir y desplegar
docker-compose pull
docker-compose up -d --build

# 6. Verificar health
curl -f http://localhost/health
```

### Verificación de Staging

```bash
# Verificar servicios
docker-compose ps

# Verificar logs
docker-compose logs -f

# Verificar aplicación
curl -f https://staging.yourdomain.com/health
curl -f https://staging.yourdomain.com/api/health
```

## 🚀 Despliegue en Producción

### Estrategia de Zero-Downtime

La producción utiliza una estrategia de **rolling deployment** con health checks:

1. **Scale Up**: Aumentar instancias de backend
2. **Health Check**: Verificar que nuevas instancias estén saludables
3. **Traffic Shift**: Redirigir tráfico gradualmente
4. **Scale Down**: Remover instancias antiguas
5. **Cleanup**: Limpiar imágenes no utilizadas

### Método 1: Usando Script Automático

```bash
# Configurar variables de entorno
export PRODUCTION_HOST=yourdomain.com
export PRODUCTION_USER=deploy
export SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK

# Ejecutar deployment
./scripts/deployment/deploy-production.sh
```

### Método 2: Manual Zero-Downtime Deployment

```bash
# 1. Conectar al servidor
ssh deploy@production.yourdomain.com

# 2. Ir al directorio del proyecto
cd /opt/twentyonepilots

# 3. Crear backup completo
./scripts/deployment/create-backup.sh

# 4. Actualizar código
git checkout main && git pull origin main

# 5. Scale up nuevas instancias
docker-compose up -d --scale backend=6 backend

# 6. Esperar health checks
sleep 60
curl -f http://localhost/health

# 7. Verificar que nuevas instancias respondan
for i in {1..30}; do
  if curl -f http://localhost/api/health; then
    echo "New instances healthy"
    break
  fi
  sleep 10
done

# 8. Actualizar frontend y nginx
docker-compose up -d frontend nginx

# 9. Scale down a capacidad normal
docker-compose up -d --scale backend=4 backend

# 10. Limpiar
docker image prune -f
```

## 📊 Monitoreo y Alertas

### Acceso a Servicios de Monitoreo

```bash
# Prometheus
open http://monitoring.yourdomain.com:9090

# Grafana
open http://monitoring.yourdomain.com:3000
# Usuario: admin, Password: (configurado en .env)

# Alertmanager
open http://monitoring.yourdomain.com:9093
```

### Dashboards Principales

#### **Twenty One Pilots - Overview**
- Estado de salud de servicios
- Latencia y tasa de error
- Uso de recursos (CPU, memoria)
- Actividad de usuarios
- Resultados de E2E tests

#### **Application Metrics**
- Requests por endpoint
- Database query performance
- Cache hit ratios
- User registrations

### Configuración de Alertas

Las alertas están pre-configuradas en `monitoring/alert_rules.yml`:

- **Críticas**: Backend/Frontend down, errores >10%
- **Advertencias**: Latencia >2s, memoria >85%
- **Información**: Tests fallando, deployments

## 🔄 Rollback y Recuperación

### Rollback Automático

Los scripts incluyen rollback automático en caso de fallos:

```bash
# Rollback inmediato
./scripts/deployment/rollback-production.sh

# O desde el servidor
cd /opt/twentyonepilots
docker-compose down
# Restaurar desde backup más reciente
LATEST_BACKUP=$(ls -t backups/*.tar.gz | head -1)
tar -xzf $LATEST_BACKUP
docker-compose up -d
```

### Estrategias de Backup

#### **Application Backup**
```bash
# Backup completo de aplicación
tar -czf backups/app-$(date +%s).tar.gz \
  --exclude=node_modules \
  --exclude=.git \
  --exclude=logs \
  .
```

#### **Database Backup**
```bash
# Backup de MongoDB
docker exec twentyonepilots-mongodb mongodump \
  --out /backup-$(date +%s)

# Backup de Redis
docker exec twentyonepilots-redis redis-cli SAVE
```

### Recuperación de Desastres

1. **Identificar el problema** usando logs y métricas
2. **Iniciar rollback** a versión estable
3. **Verificar integridad** de datos
4. **Notificar stakeholders** del incidente
5. **Documentar lecciones aprendidas**

## 🔄 CI/CD con GitHub Actions

### Pipelines Configurados

#### **Staging Pipeline** (`.github/workflows/staging-deploy.yml`)
- **Trigger**: Push a `develop` o `staging`
- **Tests**: Unit, integration, E2E
- **Build**: Docker images con cache
- **Deploy**: Automático a staging
- **Rollback**: Automático en caso de fallos

#### **Production Pipeline** (`.github/workflows/production-deploy.yml`)
- **Trigger**: Push a `main` o manual
- **Quality Gates**: Security scan, performance tests
- **Zero-downtime**: Rolling deployment
- **Health Checks**: Comprehensive post-deploy validation
- **Notifications**: Slack/email en cada paso

### Configuración de Secrets

En GitHub repository settings:

```bash
# SSH Access
STAGING_SSH_PRIVATE_KEY
PRODUCTION_SSH_PRIVATE_KEY
STAGING_HOST
PRODUCTION_HOST
STAGING_USER
PRODUCTION_USER

# Docker Registry
CR_PAT (GitHub Container Registry)

# Notifications
SLACK_WEBHOOK_URL

# External Services
YOUTUBE_API_KEY
SMTP_USER
SMTP_PASS
```

### Ejecución Manual

```bash
# Trigger production deployment manual
gh workflow run production-deploy.yml \
  -f force_deploy=true
```

## 🔧 Solución de Problemas

### Problemas Comunes

#### **Deployment Falla**
```bash
# Verificar logs de GitHub Actions
gh run list
gh run view <run-id> --log

# Verificar estado del servidor
ssh deploy@server "docker-compose ps"
ssh deploy@server "docker-compose logs --tail=50"
```

#### **Health Checks Fallan**
```bash
# Verificar endpoints manualmente
curl -v https://yourdomain.com/health
curl -v https://yourdomain.com/api/health

# Verificar logs de aplicación
docker-compose logs backend
```

#### **Base de Datos No Conecta**
```bash
# Verificar estado de MongoDB
docker-compose exec mongodb mongo --eval "db.stats()"

# Verificar conexión desde backend
docker-compose exec backend node -e "
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGO_URI).then(() => console.log('Connected')).catch(console.error);
"
```

#### **SSL Certificados Expiran**
```bash
# Renovar con Let's Encrypt
certbot renew

# O manualmente
openssl req -new -newkey rsa:2048 -nodes \
  -keyout privkey.pem -out cert.csr
```

### Comandos Útiles

```bash
# Ver estado de servicios
docker-compose ps

# Ver logs en tiempo real
docker-compose logs -f

# Ver uso de recursos
docker stats

# Limpiar sistema
docker system prune -a

# Backup manual
./scripts/deployment/create-backup.sh

# Health check completo
curl -f https://yourdomain.com/health && \
curl -f https://yourdomain.com/api/health && \
echo "All systems healthy"
```

## 📈 Optimización y Escalado

### Auto-scaling Basado en Métricas

```yaml
# Configuración de auto-scaling (futuro)
services:
  backend:
    deploy:
      replicas: 2-10
      resources:
        limits:
          cpus: '1.0'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M
      restart_policy:
        condition: on-failure
```

### Optimización de Performance

#### **Nginx Tuning**
```nginx
worker_processes auto;
worker_connections 1024;
use epoll;
multi_accept on;
```

#### **Node.js Optimization**
```javascript
// PM2 clustering con afinidad de CPU
instances: 'max',
exec_mode: 'cluster',
node_args: [
  '--max_old_space_size=4096',
  '--optimize-for-size',
  '--gc-interval=100'
]
```

#### **Database Optimization**
```javascript
// Connection pooling
mongoose.connect(uri, {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
});
```

## 🔒 Seguridad en Producción

### Configuración de Firewall

```bash
# UFW configuration
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw --force enable
```

### Monitoreo de Seguridad

```bash
# Instalar fail2ban
sudo apt install fail2ban

# Configurar reglas
sudo cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

### Actualizaciones de Seguridad

```bash
# Actualizar sistema regularmente
sudo apt update && sudo apt upgrade -y

# Actualizar Docker images
docker-compose pull
docker-compose up -d

# Verificar vulnerabilidades
trivy image your-registry/twentyonepilots-backend:latest
```

## 📞 Contactos y Soporte

### Equipos de Respuesta

- **Desarrollo**: dev@twentyonepilots.com
- **Infraestructura**: infra@twentyonepilots.com
- **Seguridad**: security@twentyonepilots.com
- **Producto**: product@twentyonepilots.com

### Escalada de Incidentes

1. **P1 - Crítico**: Respuesta en 15 minutos
2. **P2 - Alto**: Respuesta en 1 hora
3. **P3 - Medio**: Respuesta en 4 horas
4. **P4 - Bajo**: Respuesta en 24 horas

### Documentación Relacionada

- [📊 Sistema de Monitoreo](monitoring/README.md)
- [🐳 Guía de Docker](docs/docker-setup.md)
- [🔒 Guía de Seguridad](docs/security.md)
- [📈 Optimización de Performance](docs/performance.md)

---

## 🎯 Checklist de Despliegue

### Pre-Deployment
- [ ] Variables de entorno configuradas
- [ ] SSH keys configuradas
- [ ] DNS apuntando correctamente
- [ ] SSL certificates válidas
- [ ] Backup creado

### Durante Deployment
- [ ] Tests pasando en CI/CD
- [ ] Health checks funcionando
- [ ] Rollback plan preparado
- [ ] Notificaciones configuradas

### Post-Deployment
- [ ] Aplicación accesible
- [ ] Métricas fluyendo
- [ ] Alertas configuradas
- [ ] Logs monitoreados
- [ ] Backup verificado

---

*Esta guía asegura despliegues confiables, escalables y seguros para la aplicación Twenty One Pilots con estrategias de zero-downtime y recuperación automática.*