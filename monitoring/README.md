# Sistema de Monitorización - Twenty One Pilots

Este directorio contiene la configuración completa del sistema de monitorización para la aplicación Twenty One Pilots, incluyendo métricas, alertas, dashboards y notificaciones.

## 🏗️ Arquitectura del Sistema

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Application   │───▶│   Prometheus    │───▶│   Alertmanager  │
│   (Backend)     │    │   (Metrics)     │    │   (Alerts)      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       ▼                       ▼
         │              ┌─────────────────┐    ┌─────────────────┐
         │              │    Grafana      │    │   Slack/Email   │
         │              │  (Dashboards)   │    │ (Notifications) │
         │              └─────────────────┘    └─────────────────┘
         │
         ▼
┌─────────────────┐    ┌─────────────────┐
│   E2E Tests     │───▶│  Pushgateway    │
│  (Playwright)   │    │   (Metrics)     │
└─────────────────┘    └─────────────────┘
```

## 📊 Componentes

### 1. **Prometheus** - Recolección de Métricas
- **Puerto**: `9090`
- **Configuración**: `prometheus.yml`
- **Métricas**: HTTP, sistema, aplicación, base de datos
- **Almacenamiento**: 200 horas de retención

### 2. **Grafana** - Dashboards y Visualización
- **Puerto**: `3001`
- **Usuario**: `admin`
- **Contraseña**: `admin` (configurable)
- **Dashboards**: Automáticamente provisionados

### 3. **Alertmanager** - Gestión de Alertas
- **Puerto**: `9093`
- **Notificaciones**: Email y Slack
- **Reglas**: `alert_rules.yml`

### 4. **Pushgateway** - Métricas E2E
- **Puerto**: `9091`
- **Uso**: Métricas de tests automatizados

## 🚀 Inicio Rápido

### 1. Configurar Variables de Entorno
```bash
cp monitoring/.env.example monitoring/.env
# Editar las variables según tu configuración
```

### 2. Iniciar Servicios de Monitorización
```bash
# Iniciar solo servicios de monitorización
docker-compose --profile monitoring up -d

# O iniciar toda la aplicación con monitorización
docker-compose --profile monitoring up -d
```

### 3. Acceder a las Interfaces
- **Prometheus**: http://localhost:9090
- **Grafana**: http://localhost:3001 (admin/admin)
- **Alertmanager**: http://localhost:9093

## 📈 Métricas Recolectadas

### Métricas del Sistema
- **CPU Usage**: Porcentaje de uso de CPU
- **Memory Usage**: Uso de memoria (RSS, Heap)
- **Active Connections**: Conexiones activas
- **Disk Usage**: Espacio en disco

### Métricas HTTP
- **Request Duration**: Latencia de requests (histogram)
- **Request Rate**: Tasa de requests por endpoint
- **Error Rate**: Porcentaje de errores 5xx
- **Status Codes**: Distribución por código HTTP

### Métricas de Base de Datos
- **Query Duration**: Tiempo de queries (histogram)
- **Connection Pool**: Conexiones activas
- **Cache Hit Ratio**: Efectividad del cache

### Métricas de Aplicación
- **User Registrations**: Nuevos usuarios
- **Active Users**: Usuarios activos (24h)
- **Video Views**: Reproducciones de video
- **Album Plays**: Reproducciones de álbum
- **Search Queries**: Consultas de búsqueda
- **API Calls**: Llamadas por endpoint

### Métricas E2E
- **Test Results**: Resultados de tests (passed/failed)
- **Test Duration**: Tiempo de ejecución
- **Test Coverage**: Cobertura de tests

## 🚨 Sistema de Alertas

### Niveles de Severidad
- **Info**: Información general
- **Warning**: Requiere atención
- **Critical**: Acción inmediata requerida

### Alertas Configuradas

#### Disponibilidad del Servicio
- `BackendDown`: Backend no responde
- `FrontendDown`: Frontend no responde
- `DatabaseDown`: MongoDB no disponible
- `RedisDown`: Redis no disponible

#### Rendimiento
- `HighResponseTime`: Latencia > 2s
- `CriticalResponseTime`: Latencia > 5s
- `HighErrorRate`: Error rate > 5%
- `CriticalErrorRate`: Error rate > 10%

#### Recursos del Sistema
- `HighMemoryUsage`: Memoria > 85%
- `CriticalMemoryUsage`: Memoria > 95%
- `HighCPUUsage`: CPU > 90%

#### Aplicación Específica
- `LowCacheHitRatio`: Cache hit ratio < 70%
- `HighQueueSize`: Queue size > 1000
- `SlowDatabaseQueries`: Queries > 1s

#### Tests E2E
- `E2eTestsFailing`: Tests fallando
- `E2eTestsSlow`: Tests lentos (>2min)

### Notificaciones

#### Email
```yaml
# Configurado en alertmanager.yml
to: '${ALERT_EMAIL}'
subject: '[{{ .GroupLabels.alertname }}] {{ .Annotations.summary }}'
```

#### Slack
```yaml
# Webhook URL configurable
channel: '#alerts'
color: 'danger' # Para alertas críticas
```

## 📊 Dashboards de Grafana

### Dashboard Principal: "Twenty One Pilots - Overview"
- **System Health**: Estado de servicios
- **Response Time**: Latencia 95th percentile
- **Error Rate**: Tasa de errores
- **Memory Usage**: Consumo de memoria
- **Active Connections**: Conexiones activas
- **Video Views**: Reproducciones
- **User Activity**: Actividad de usuarios
- **Search Queries**: Consultas de búsqueda
- **Cache Performance**: Efectividad del cache
- **E2E Test Results**: Resultados de tests

### Personalización
Los dashboards están definidos en JSON y pueden ser:
- Editados en Grafana UI
- Versionados en git
- Provisionados automáticamente

## 🔧 Configuración Avanzada

### Personalizar Umbrales de Alertas
```yaml
# En alert_rules.yml
- alert: HighResponseTime
  expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 2
  # Cambiar el valor '2' según necesidades
```

### Agregar Nuevas Métricas
```javascript
// En backend/services/metricsService.js
const customMetric = new promClient.Gauge({
  name: 'custom_metric',
  help: 'Custom metric description'
});

// Registrar y usar
register.registerMetric(customMetric);
customMetric.set(value);
```

### Configurar Nuevos Canales de Notificación
```yaml
# En alertmanager.yml
receivers:
  - name: 'custom-receiver'
    webhook_configs:
      - url: 'http://your-webhook-endpoint'
```

## 📋 Monitoreo de E2E Tests

### Integración Automática
Los tests de Playwright automáticamente:
1. **Envían métricas** a Pushgateway
2. **Generan reportes** de resultados
3. **Crean alertas** si fallan
4. **Muestran tendencias** en Grafana

### Configuración
```javascript
// e2e/playwright.config.js
reporter: [
  ['html'],
  ['json', { outputFile: 'test-results.json' }],
  ['junit', { outputFile: 'test-results.xml' }],
  ['./e2e/metrics-reporter.js'] // Reporter personalizado
]
```

## 🔍 Troubleshooting

### Prometheus No Recolecta Métricas
```bash
# Verificar configuración
docker-compose logs prometheus

# Verificar endpoints
curl http://localhost:5000/api/metrics/prometheus
```

### Grafana No Carga Dashboards
```bash
# Reiniciar Grafana
docker-compose restart grafana

# Verificar archivos de provisioning
ls -la monitoring/grafana/provisioning/
```

### Alertas No Se Envían
```bash
# Verificar configuración de Alertmanager
docker-compose logs alertmanager

# Probar webhook de Slack
curl -X POST -H 'Content-type: application/json' \
  --data '{"text":"Test alert"}' \
  $SLACK_WEBHOOK_URL
```

## 📚 Referencias

### Documentación Oficial
- [Prometheus Docs](https://prometheus.io/docs/)
- [Grafana Docs](https://grafana.com/docs/)
- [Alertmanager Docs](https://prometheus.io/docs/alerting/latest/alertmanager/)

### Métricas Prometheus
- [Client Libraries](https://prometheus.io/docs/instrumenting/clientlibs/)
- [Metric Types](https://prometheus.io/docs/concepts/metric_types/)
- [Query Language](https://prometheus.io/docs/prometheus/latest/querying/basics/)

### Mejores Prácticas
- [Monitoring Best Practices](https://prometheus.io/docs/practices/)
- [Alerting Guidelines](https://prometheus.io/docs/practices/alerting/)
- [Dashboard Design](https://grafana.com/docs/grafana/latest/best-practices/)

## 🚀 Próximos Pasos

### Expansión del Sistema
1. **Métricas de Negocio**: Conversiones, engagement, retention
2. **Logs Centralizados**: Integración con ELK stack
3. **Tracing Distribuido**: Jaeger/OpenTelemetry
4. **Monitoreo Sintético**: Tests de uptime externos
5. **Machine Learning**: Detección automática de anomalías

### Automatización
1. **Auto-scaling**: Basado en métricas
2. **Self-healing**: Reinicio automático de servicios
3. **Capacity Planning**: Predicciones de recursos
4. **Performance Budgets**: Alertas de presupuesto

### Integraciones
1. **PagerDuty/OpsGenie**: Escalado de alertas
2. **DataDog/New Relic**: APM avanzado
3. **Service Mesh**: Istio/Linkerd
4. **Kubernetes**: HPA y monitoring nativo

---

## 📞 Soporte

Para issues relacionados con monitorización:
1. Revisar logs de contenedores: `docker-compose logs`
2. Verificar configuración en archivos YAML
3. Consultar documentación de componentes
4. Abrir issue en el repositorio del proyecto

---

*Este sistema de monitorización proporciona observabilidad completa para la aplicación Twenty One Pilots, asegurando alta disponibilidad, rendimiento óptimo y respuesta rápida a incidentes.*