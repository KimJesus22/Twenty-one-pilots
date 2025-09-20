#!/usr/bin/env node

/**
 * Script de gestión automatizada de dependencias
 * Twenty One Pilots - Dependency Management Tool
 *
 * Uso:
 * node scripts/manage-dependencies.js [command] [options]
 *
 * Comandos:
 * - audit: Ejecutar auditoría de seguridad
 * - update: Actualizar dependencias
 * - check: Verificar estado de dependencias
 * - report: Generar reporte de dependencias
 * - clean: Limpiar cache y dependencias no utilizadas
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

class DependencyManager {
  constructor() {
    this.rootDir = path.resolve(__dirname, '..');
    this.backendDir = path.join(this.rootDir, 'backend');
    this.frontendDir = path.join(this.rootDir, 'frontend');
    this.reportsDir = path.join(this.rootDir, 'reports');
  }

  // Utilidades
  execCommand(command, cwd = this.rootDir, silent = false) {
    try {
      const result = execSync(command, {
        cwd,
        encoding: 'utf8',
        stdio: silent ? 'pipe' : 'inherit'
      });
      return result;
    } catch (error) {
      console.error(`❌ Error ejecutando: ${command}`);
      console.error(error.message);
      return null;
    }
  }

  // Comando: Audit
  async audit() {
    console.log('🔍 Ejecutando auditoría de seguridad...\n');

    // Backend audit
    console.log('📦 Backend dependencies:');
    this.execCommand('npm audit --audit-level high', this.backendDir);

    // Frontend audit
    console.log('\n🎨 Frontend dependencies:');
    this.execCommand('npm audit --audit-level high', this.frontendDir);

    // Snyk scan (si está disponible)
    console.log('\n🔒 Snyk security scan:');
    if (this.hasSnyk()) {
      this.execCommand('npx snyk test --severity-threshold=medium', this.backendDir);
      this.execCommand('npx snyk test --severity-threshold=medium', this.frontendDir);
    } else {
      console.log('⚠️ Snyk no está configurado. Instale con: npm install -g snyk');
    }

    console.log('\n✅ Auditoría completada');
  }

  // Comando: Update
  async update(options = {}) {
    const { major = false, force = false } = options;
    console.log(`🔄 Actualizando dependencias (${major ? 'incluyendo major' : 'solo minor/patch'})...\n`);

    // Backend update
    console.log('📦 Backend:');
    if (major || force) {
      this.execCommand('npm update', this.backendDir);
    } else {
      // Solo actualizaciones menores y parches
      this.execCommand('npm update --save', this.backendDir);
    }

    // Frontend update
    console.log('\n🎨 Frontend:');
    if (major || force) {
      this.execCommand('npm update', this.frontendDir);
    } else {
      this.execCommand('npm update --save', this.frontendDir);
    }

    console.log('\n✅ Actualización completada');
  }

  // Comando: Check
  async check() {
    console.log('🔍 Verificando estado de dependencias...\n');

    // Backend check
    console.log('📦 Backend:');
    this.execCommand('npm outdated', this.backendDir);

    // Frontend check
    console.log('\n🎨 Frontend:');
    this.execCommand('npm outdated', this.frontendDir);

    // Verificar dependencias críticas
    console.log('\n🚨 Verificando dependencias críticas...');
    await this.checkCriticalDependencies();

    console.log('\n✅ Verificación completada');
  }

  // Comando: Report
  async report() {
    console.log('📊 Generando reporte de dependencias...\n');

    const report = {
      generatedAt: new Date().toISOString(),
      backend: await this.getPackageInfo(this.backendDir),
      frontend: await this.getPackageInfo(this.frontendDir),
      security: await this.getSecurityInfo(),
      recommendations: []
    };

    // Generar recomendaciones
    report.recommendations = await this.generateRecommendations(report);

    // Guardar reporte
    const reportPath = path.join(this.reportsDir, `dependency-report-${Date.now()}.json`);
    fs.mkdirSync(this.reportsDir, { recursive: true });
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    console.log(`📄 Reporte guardado en: ${reportPath}`);

    // Mostrar resumen
    this.displayReportSummary(report);

    console.log('\n✅ Reporte generado');
  }

  // Comando: Clean
  async clean() {
    console.log('🧹 Limpiando dependencias...\n');

    // Backend clean
    console.log('📦 Backend:');
    this.execCommand('npm cache clean --force', this.backendDir);
    this.execCommand('rm -rf node_modules package-lock.json', this.backendDir);
    this.execCommand('npm install', this.backendDir);

    // Frontend clean
    console.log('\n🎨 Frontend:');
    this.execCommand('npm cache clean --force', this.frontendDir);
    this.execCommand('rm -rf node_modules package-lock.json', this.frontendDir);
    this.execCommand('npm install', this.frontendDir);

    console.log('\n✅ Limpieza completada');
  }

  // Helpers
  hasSnyk() {
    try {
      execSync('which snyk', { stdio: 'pipe' });
      return true;
    } catch {
      return false;
    }
  }

  async getPackageInfo(dir) {
    try {
      const packageJson = JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8'));
      const lockfile = fs.existsSync(path.join(dir, 'package-lock.json'));

      return {
        name: packageJson.name,
        version: packageJson.version,
        dependencies: Object.keys(packageJson.dependencies || {}).length,
        devDependencies: Object.keys(packageJson.devDependencies || {}).length,
        hasLockfile: lockfile,
        nodeVersion: packageJson.engines?.node || 'Not specified'
      };
    } catch (error) {
      return { error: error.message };
    }
  }

  async getSecurityInfo() {
    const backendAudit = this.execCommand('npm audit --json', this.backendDir, true);
    const frontendAudit = this.execCommand('npm audit --json', this.frontendDir, true);

    return {
      backend: backendAudit ? JSON.parse(backendAudit) : null,
      frontend: frontendAudit ? JSON.parse(frontendAudit) : null
    };
  }

  async checkCriticalDependencies() {
    const criticalDeps = [
      'express', 'mongoose', 'helmet', 'jsonwebtoken',
      'react', 'react-dom', 'next'
    ];

    const backendPackage = JSON.parse(fs.readFileSync(path.join(this.backendDir, 'package.json'), 'utf8'));
    const frontendPackage = JSON.parse(fs.readFileSync(path.join(this.frontendDir, 'package.json'), 'utf8'));

    criticalDeps.forEach(dep => {
      const backendVersion = backendPackage.dependencies?.[dep] || backendPackage.devDependencies?.[dep];
      const frontendVersion = frontendPackage.dependencies?.[dep] || frontendPackage.devDependencies?.[dep];

      if (backendVersion) {
        console.log(`  📦 ${dep}@${backendVersion} (backend)`);
      }
      if (frontendVersion) {
        console.log(`  🎨 ${dep}@${frontendVersion} (frontend)`);
      }
    });
  }

  async generateRecommendations(report) {
    const recommendations = [];

    // Verificar vulnerabilidades
    if (report.security.backend?.metadata?.vulnerabilities?.total > 0) {
      recommendations.push({
        type: 'security',
        priority: 'high',
        message: `Backend tiene ${report.security.backend.metadata.vulnerabilities.total} vulnerabilidades`,
        action: 'Ejecutar: npm audit fix'
      });
    }

    if (report.security.frontend?.metadata?.vulnerabilities?.total > 0) {
      recommendations.push({
        type: 'security',
        priority: 'high',
        message: `Frontend tiene ${report.security.frontend.metadata.vulnerabilities.total} vulnerabilidades`,
        action: 'Ejecutar: npm audit fix'
      });
    }

    // Verificar versiones de Node.js
    if (report.backend.nodeVersion !== '18.x' && report.backend.nodeVersion !== '>=18.0.0') {
      recommendations.push({
        type: 'compatibility',
        priority: 'medium',
        message: 'Backend no especifica Node.js 18.x como requerido',
        action: 'Actualizar engines en package.json'
      });
    }

    return recommendations;
  }

  displayReportSummary(report) {
    console.log('\n📊 Resumen del Reporte:');
    console.log(`📦 Backend: ${report.backend.dependencies} dependencias`);
    console.log(`🎨 Frontend: ${report.frontend.dependencies} dependencias`);

    const backendVulns = report.security.backend?.metadata?.vulnerabilities?.total || 0;
    const frontendVulns = report.security.frontend?.metadata?.vulnerabilities?.total || 0;

    console.log(`🔒 Vulnerabilidades: ${backendVulns} (backend), ${frontendVulns} (frontend)`);

    if (report.recommendations.length > 0) {
      console.log('\n💡 Recomendaciones:');
      report.recommendations.forEach(rec => {
        console.log(`  ${rec.priority === 'high' ? '🚨' : '⚠️'} ${rec.message}`);
        console.log(`    Acción: ${rec.action}`);
      });
    }
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const options = {};

  // Parse options
  args.slice(1).forEach(arg => {
    if (arg.startsWith('--')) {
      const [key, value] = arg.slice(2).split('=');
      options[key] = value || true;
    }
  });

  const manager = new DependencyManager();

  try {
    switch (command) {
      case 'audit':
        await manager.audit();
        break;
      case 'update':
        await manager.update(options);
        break;
      case 'check':
        await manager.check();
        break;
      case 'report':
        await manager.report();
        break;
      case 'clean':
        await manager.clean();
        break;
      default:
        console.log(`
🔧 Dependency Management Tool - Twenty One Pilots

Uso: node scripts/manage-dependencies.js [command] [options]

Comandos disponibles:
  audit     Ejecutar auditoría de seguridad completa
  update    Actualizar dependencias (--major para major updates, --force para forzar)
  check     Verificar estado de dependencias
  report    Generar reporte detallado de dependencias
  clean     Limpiar cache y reinstalar dependencias

Ejemplos:
  node scripts/manage-dependencies.js audit
  node scripts/manage-dependencies.js update --major
  node scripts/manage-dependencies.js report
        `);
        break;
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = DependencyManager;