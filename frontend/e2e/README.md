# End-to-End Tests con Playwright

Este directorio contiene las pruebas end-to-end (E2E) para la aplicación Twenty One Pilots usando Playwright.

## 🚀 Inicio Rápido

### Instalación
```bash
# Instalar dependencias
npm install

# Instalar navegadores de Playwright
npx playwright install
```

### Ejecutar Tests
```bash
# Ejecutar todos los tests E2E
npm run test:e2e

# Ejecutar tests en modo UI (interactivo)
npm run test:e2e:ui

# Ejecutar tests en modo debug
npm run test:e2e:debug

# Ejecutar tests con navegador visible
npm run test:e2e:headed

# Ejecutar tests específicos
npx playwright test videos.spec.ts
npx playwright test discography.spec.ts
```

## 📁 Estructura de Tests

```
e2e/
├── global-setup.js          # Configuración global antes de tests
├── global-teardown.js       # Limpieza global después de tests
├── videos.spec.ts          # Tests para página de videos
├── discography.spec.ts     # Tests para página de discografía
├── store.spec.ts           # Tests para página de tienda
├── forum.spec.ts           # Tests para página de foro
└── README.md               # Esta documentación
```

## 🎯 Cobertura de Tests

### Videos (`videos.spec.ts`)
- ✅ Carga de página con skeleton loaders
- ✅ Indicador de conexión offline
- ✅ Búsqueda de videos
- ✅ Filtros avanzados (fecha, duración, canal)
- ✅ Reproducción de videos
- ✅ Navegación por teclado
- ✅ Cambio de tema
- ✅ Manejo de errores
- ✅ Compatibilidad móvil

### Discografía (`discography.spec.ts`)
- ✅ Carga de álbumes con estadísticas
- ✅ Carga de artwork de álbumes
- ✅ Aplicación de filtros avanzados
- ✅ Sistema de ratings
- ✅ Toggle de comentarios
- ✅ Vista detallada de álbumes
- ✅ Navegación de tracks
- ✅ Paginación
- ✅ Ordenamiento
- ✅ Actualizaciones de cache GraphQL

### Tienda (`store.spec.ts`)
- ✅ Carga de productos
- ✅ Filtrado por categoría
- ✅ Agregar productos al carrito
- ✅ Vista de detalles de producto

### Foro (`forum.spec.ts`)
- ✅ Carga de hilos
- ✅ Creación de nuevos hilos
- ✅ Filtrado por categoría
- ✅ Vista detallada de hilos

## ⚙️ Configuración

### Variables de Entorno
```bash
# URL base de la aplicación
BASE_URL=http://localhost:3000

# En CI/CD
CI=true
```

### Configuración de Playwright
- **Navegadores**: Chromium, Firefox, WebKit
- **Viewports**: Desktop y Mobile
- **Retries**: 2 en CI, 0 en desarrollo
- **Screenshots**: Solo en fallos
- **Videos**: Grabación en fallos
- **Traces**: En reintentos fallidos

## 🔄 Integración Continua

Los tests se ejecutan automáticamente en GitHub Actions:

```yaml
# .github/workflows/e2e-tests.yml
- push/PR a main/develop
- Node.js 18
- Backend + Frontend build
- Playwright tests
- Reportes de resultados
```

## 🐛 Debugging

### Modo Interactivo
```bash
npm run test:e2e:ui
```

### Modo Debug
```bash
npm run test:e2e:debug
```

### Ver Reportes
```bash
npx playwright show-report
```

## 📊 Reportes

Los tests generan:
- **HTML Report**: `playwright-report/index.html`
- **JSON Results**: `test-results.json`
- **JUnit XML**: `test-results.xml`
- **Screenshots**: En fallos
- **Videos**: En fallos
- **Traces**: Para debugging

## 🎨 Características Especiales

### Compatibilidad con TypeScript
- Tests escritos en TypeScript
- Autocompletado inteligente
- Type checking en CI

### Integración con Apollo Client
- Tests verifican actualizaciones de cache GraphQL
- Validación de queries optimizadas
- Manejo de estados de loading/error

### Accesibilidad
- Tests incluyen verificación de navegación por teclado
- Validación de ARIA labels
- Compatibilidad con lectores de pantalla

### Responsive Design
- Tests específicos para mobile
- Validación de layouts adaptativos
- Touch interactions

## 🚨 Manejo de Datos de Test

### Evitar Creación de Datos Reales
- Tests no crean usuarios reales
- No publican contenido en producción
- Uso de datos mock cuando es necesario
- Limpieza automática después de tests

### Base de Datos de Test
- Tests usan base de datos separada
- Datos de seed para consistencia
- Reset automático entre tests

## 📈 Mejores Prácticas

### Estructura de Tests
```typescript
test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    // Setup común
  });

  test('should do something', async ({ page }) => {
    // Test específico
  });
});
```

### Selectores Estables
```typescript
// ✅ Bueno: Usar data-testid o roles
await page.locator('[data-testid="search-input"]').fill('query');

// ❌ Malo: Dependiente de clases CSS
await page.locator('.search-input-class').fill('query');
```

### Esperas Inteligentes
```typescript
// ✅ Bueno: Esperar por funcionalidad
await page.waitForSelector('.video-card', { timeout: 10000 });

// ❌ Malo: Esperas fijas
await page.waitForTimeout(5000);
```

## 🔧 Troubleshooting

### Tests Fallando
1. Verificar que el backend esté ejecutándose
2. Revisar logs de red en traces
3. Verificar selectores en screenshots
4. Comprobar datos de test

### Performance
1. Usar `fullyParallel: true` para paralelización
2. Optimizar selectores
3. Evitar esperas innecesarias
4. Usar `page.waitForLoadState('networkidle')`

### CI/CD Issues
1. Verificar variables de entorno
2. Asegurar que navegadores estén instalados
3. Revisar timeouts de red
4. Verificar conectividad con servicios externos

## 🎯 Próximos Pasos

- [ ] Agregar tests de autenticación
- [ ] Implementar tests de API mocking
- [ ] Añadir tests de performance
- [ ] Crear tests de accesibilidad automatizados
- [ ] Implementar tests visuales con screenshot comparison