#!/usr/bin/env node

/**
 * Script de validación de accesibilidad WCAG 2.1 AA
 * Ejecuta múltiples herramientas de auditoría y genera reportes
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuración
const CONFIG = {
  sourceDir: path.join(__dirname, '..', 'frontend', 'src'),
  buildDir: path.join(__dirname, '..', 'frontend', 'build'),
  reportsDir: path.join(__dirname, '..', 'reports', 'accessibility'),
  lighthouseConfig: {
    extends: 'lighthouse:default',
    settings: {
      onlyCategories: ['accessibility'],
      output: 'json',
      outputPath: path.join(__dirname, '..', 'reports', 'accessibility', 'lighthouse-report.json')
    }
  }
};

// Utilidades
const log = {
  info: (msg) => console.log(`ℹ️  ${msg}`),
  success: (msg) => console.log(`✅ ${msg}`),
  warning: (msg) => console.log(`⚠️  ${msg}`),
  error: (msg) => console.log(`❌ ${msg}`)
};

const ensureDirectoryExists = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    log.info(`Directorio creado: ${dirPath}`);
  }
};

const writeReport = (filename, content) => {
  const filePath = path.join(CONFIG.reportsDir, filename);
  fs.writeFileSync(filePath, content, 'utf8');
  log.success(`Reporte generado: ${filePath}`);
  return filePath;
};

// Verificaciones estáticas de código
const checkStaticAccessibility = () => {
  log.info('🔍 Ejecutando verificaciones estáticas de accesibilidad...');

  const issues = [];
  const files = getAllFiles(CONFIG.sourceDir, ['.js', '.jsx', '.ts', '.tsx']);

  files.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    const fileIssues = analyzeFile(file, content);
    issues.push(...fileIssues);
  });

  const report = {
    tool: 'Static Code Analysis',
    timestamp: new Date().toISOString(),
    totalFiles: files.length,
    issues: issues,
    summary: {
      total: issues.length,
      critical: issues.filter(i => i.severity === 'critical').length,
      serious: issues.filter(i => i.severity === 'serious').length,
      moderate: issues.filter(i => i.severity === 'moderate').length,
      minor: issues.filter(i => i.severity === 'minor').length
    }
  };

  writeReport('static-analysis-report.json', JSON.stringify(report, null, 2));
  return report;
};

const getAllFiles = (dir, extensions) => {
  const files = [];

  const walk = (currentDir) => {
    const items = fs.readdirSync(currentDir);

    items.forEach(item => {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
        walk(fullPath);
      } else if (stat.isFile() && extensions.some(ext => item.endsWith(ext))) {
        files.push(fullPath);
      }
    });
  };

  walk(dir);
  return files;
};

const analyzeFile = (filePath, content) => {
  const issues = [];
  const relativePath = path.relative(CONFIG.sourceDir, filePath);

  // Verificar imágenes sin alt
  const imgWithoutAlt = content.match(/<img[^>]*src=[^>]*>(?![\s\S]*alt=)/gi);
  if (imgWithoutAlt) {
    issues.push({
      file: relativePath,
      line: getLineNumber(content, imgWithoutAlt[0]),
      code: 'WCAG-1.1.1',
      message: 'Imagen sin atributo alt',
      severity: 'critical',
      suggestion: 'Agregue un atributo alt descriptivo o alt="" para imágenes decorativas'
    });
  }

  // Verificar botones sin texto accesible
  const buttonWithoutText = content.match(/<button[^>]*>(?!\s*<[^>]*>|\s*\w)/gi);
  if (buttonWithoutText) {
    issues.push({
      file: relativePath,
      line: getLineNumber(content, buttonWithoutText[0]),
      code: 'WCAG-2.4.4',
      message: 'Botón sin texto accesible',
      severity: 'serious',
      suggestion: 'Agregue texto visible o use aria-label'
    });
  }

  // Verificar uso de eval
  if (content.includes('eval(')) {
    issues.push({
      file: relativePath,
      line: getLineNumber(content, 'eval('),
      code: 'WCAG-4.1.1',
      message: 'Uso de eval() detectado',
      severity: 'serious',
      suggestion: 'Evite el uso de eval() por razones de seguridad'
    });
  }

  // Verificar navegación por teclado
  if (content.includes('onClick') && !content.includes('onKeyDown') && !content.includes('onKeyUp')) {
    // Solo warning si no hay manejo de teclado explícito
    const hasTabIndex = content.includes('tabIndex') || content.includes('tabindex');
    const hasKeyboardHandler = content.includes('onKeyDown') || content.includes('onKeyUp') || content.includes('useKeyboard');

    if (!hasTabIndex && !hasKeyboardHandler) {
      issues.push({
        file: relativePath,
        line: getLineNumber(content, 'onClick'),
        code: 'WCAG-2.1.1',
        message: 'Posible falta de navegación por teclado',
        severity: 'moderate',
        suggestion: 'Asegúrese de que los elementos interactivos sean accesibles por teclado'
      });
    }
  }

  return issues;
};

const getLineNumber = (content, searchString) => {
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes(searchString)) {
      return i + 1;
    }
  }
  return 0;
};

// Verificación de contraste de colores
const checkColorContrast = () => {
  log.info('🎨 Verificando contraste de colores...');

  // Análisis básico de archivos CSS
  const cssFiles = getAllFiles(CONFIG.sourceDir, ['.css']);
  const contrastIssues = [];

  cssFiles.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    const relativePath = path.relative(CONFIG.sourceDir, file);

    // Buscar definiciones de color
    const colorMatches = content.match(/color:\s*#[0-9a-fA-F]{6}/gi) || [];
    const backgroundMatches = content.match(/background-color:\s*#[0-9a-fA-F]{6}/gi) || [];

    if (colorMatches.length > 0 && backgroundMatches.length > 0) {
      contrastIssues.push({
        file: relativePath,
        code: 'WCAG-1.4.3',
        message: 'Verificar contraste de colores manualmente',
        severity: 'moderate',
        suggestion: 'Use herramientas como Color Contrast Analyzer para verificar ratios ≥4.5:1'
      });
    }
  });

  const report = {
    tool: 'Color Contrast Analysis',
    timestamp: new Date().toISOString(),
    issues: contrastIssues,
    summary: {
      total: contrastIssues.length,
      note: 'Esta es una verificación básica. Use herramientas especializadas para análisis completo.'
    }
  };

  writeReport('color-contrast-report.json', JSON.stringify(report, null, 2));
  return report;
};

// Verificación de HTML semántico
const checkSemanticHTML = () => {
  log.info('🏗️  Verificando HTML semántico...');

  const jsxFiles = getAllFiles(CONFIG.sourceDir, ['.jsx', '.tsx']);
  const semanticIssues = [];

  jsxFiles.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    const relativePath = path.relative(CONFIG.sourceDir, file);

    // Verificar headings
    const headingMatches = content.match(/<h[1-6][^>]*>/gi) || [];
    if (headingMatches.length === 0) {
      semanticIssues.push({
        file: relativePath,
        code: 'WCAG-1.3.1',
        message: 'No se encontraron headings en el componente',
        severity: 'moderate',
        suggestion: 'Use headings (h1-h6) para estructurar el contenido'
      });
    }

    // Verificar landmarks
    const landmarkMatches = content.match(/role="(main|navigation|complementary|banner|contentinfo)"/gi) || [];
    if (landmarkMatches.length === 0 && content.includes('return')) {
      semanticIssues.push({
        file: relativePath,
        code: 'WCAG-1.3.1',
        message: 'Posible falta de landmarks ARIA',
        severity: 'moderate',
        suggestion: 'Use roles ARIA o elementos semánticos para definir secciones'
      });
    }

    // Verificar listas
    if (content.includes('<li>') && !content.includes('<ul>') && !content.includes('<ol>')) {
      semanticIssues.push({
        file: relativePath,
        code: 'WCAG-1.3.1',
        message: 'Lista sin contenedor semántico',
        severity: 'serious',
        suggestion: 'Envuelva los elementos li en ul o ol'
      });
    }
  });

  const report = {
    tool: 'Semantic HTML Analysis',
    timestamp: new Date().toISOString(),
    issues: semanticIssues,
    summary: {
      total: semanticIssues.length,
      filesAnalyzed: jsxFiles.length
    }
  };

  writeReport('semantic-html-report.json', JSON.stringify(report, null, 2));
  return report;
};

// Generar reporte consolidado
const generateConsolidatedReport = (reports) => {
  log.info('📊 Generando reporte consolidado...');

  const consolidated = {
    timestamp: new Date().toISOString(),
    tools: reports.map(r => r.tool),
    summary: {
      totalIssues: reports.reduce((sum, r) => sum + (r.issues?.length || 0), 0),
      criticalIssues: reports.reduce((sum, r) => sum + (r.issues?.filter(i => i.severity === 'critical').length || 0), 0),
      seriousIssues: reports.reduce((sum, r) => sum + (r.issues?.filter(i => i.severity === 'serious').length || 0), 0),
      moderateIssues: reports.reduce((sum, r) => sum + (r.issues?.filter(i => i.severity === 'moderate').length || 0), 0),
      minorIssues: reports.reduce((sum, r) => sum + (r.issues?.filter(i => i.severity === 'minor').length || 0), 0)
    },
    reports: reports,
    recommendations: [
      'Ejecutar auditorías manuales con lectores de pantalla',
      'Probar navegación completa por teclado',
      'Verificar contraste de colores con herramientas especializadas',
      'Realizar pruebas con usuarios reales',
      'Implementar pruebas automatizadas de accesibilidad'
    ]
  };

  writeReport('consolidated-accessibility-report.json', JSON.stringify(consolidated, null, 2));

  // Generar reporte HTML
  const htmlReport = generateHTMLReport(consolidated);
  writeReport('accessibility-report.html', htmlReport);

  return consolidated;
};

const generateHTMLReport = (consolidated) => {
  return `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reporte de Accesibilidad WCAG 2.1 AA</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; background: #f5f5f5; }
        .header { background: #ff0000; color: white; padding: 20px; border-radius: 8px; }
        .summary { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .issues { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .issue { border-left: 4px solid #ff0000; padding: 10px; margin: 10px 0; }
        .critical { border-left-color: #dc3545; }
        .serious { border-left-color: #fd7e14; }
        .moderate { border-left-color: #ffc107; }
        .minor { border-left-color: #17a2b8; }
        .stats { display: flex; gap: 20px; flex-wrap: wrap; }
        .stat { background: #f8f9fa; padding: 10px; border-radius: 4px; text-align: center; }
        .recommendations { background: #e8f4fd; padding: 20px; border-radius: 8px; border-left: 4px solid #ff0000; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Reporte de Accesibilidad WCAG 2.1 AA</h1>
        <p>Twenty One Pilots Application - ${new Date(consolidated.timestamp).toLocaleString()}</p>
    </div>

    <div class="summary">
        <h2>Resumen Ejecutivo</h2>
        <div class="stats">
            <div class="stat">
                <strong>${consolidated.summary.totalIssues}</strong><br/>
                Total de Problemas
            </div>
            <div class="stat">
                <strong>${consolidated.summary.criticalIssues}</strong><br/>
                Críticos
            </div>
            <div class="stat">
                <strong>${consolidated.summary.seriousIssues}</strong><br/>
                Graves
            </div>
            <div class="stat">
                <strong>${consolidated.summary.moderateIssues}</strong><br/>
                Moderados
            </div>
        </div>
    </div>

    <div class="issues">
        <h2>Problemas Detectados</h2>
        ${consolidated.reports.map(report =>
          report.issues?.map(issue => `
            <div class="issue ${issue.severity}">
                <h4>${issue.code}: ${issue.message}</h4>
                <p><strong>Archivo:</strong> ${issue.file || 'N/A'}</p>
                <p><strong>Línea:</strong> ${issue.line || 'N/A'}</p>
                <p><strong>Sugerencia:</strong> ${issue.suggestion}</p>
            </div>
          `).join('') || ''
        ).join('')}
    </div>

    <div class="recommendations">
        <h2>Recomendaciones</h2>
        <ul>
            ${consolidated.recommendations.map(rec => `<li>${rec}</li>`).join('')}
        </ul>
    </div>
</body>
</html>`;
};

// Función principal
const runAccessibilityChecks = async () => {
  log.info('🚀 Iniciando auditoría de accesibilidad WCAG 2.1 AA...');

  try {
    ensureDirectoryExists(CONFIG.reportsDir);

    const reports = [];

    // Ejecutar verificaciones
    reports.push(checkStaticAccessibility());
    reports.push(checkColorContrast());
    reports.push(checkSemanticHTML());

    // Generar reporte consolidado
    const consolidated = generateConsolidatedReport(reports);

    // Resultado final
    const hasCriticalIssues = consolidated.summary.criticalIssues > 0;
    const hasSeriousIssues = consolidated.summary.seriousIssues > 0;

    if (hasCriticalIssues || hasSeriousIssues) {
      log.error(`Auditoría completada con ${consolidated.summary.totalIssues} problemas encontrados.`);
      log.warning('Revise el reporte detallado en reports/accessibility/');
      process.exit(1); // Fallar en CI/CD si hay problemas críticos
    } else {
      log.success(`Auditoría completada exitosamente. ${consolidated.summary.totalIssues} problemas encontrados.`);
    }

  } catch (error) {
    log.error(`Error durante la auditoría: ${error.message}`);
    process.exit(1);
  }
};

// Ejecutar si se llama directamente
if (require.main === module) {
  runAccessibilityChecks();
}

module.exports = {
  runAccessibilityChecks,
  checkStaticAccessibility,
  checkColorContrast,
  checkSemanticHTML
};