import React, { useState, useEffect } from 'react';
import { runAccessibilityAudit, checkColorContrast, validateKeyboardNavigation, checkBrowserCompatibility } from '../utils/accessibility';

const AccessibilityAuditor = () => {
  const [auditResults, setAuditResults] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [contrastResults, setContrastResults] = useState(null);
  const [keyboardResults, setKeyboardResults] = useState(null);
  const [browserCompat, setBrowserCompat] = useState(null);
  const [privacyAudit, setPrivacyAudit] = useState(null);

  // Solo mostrar en desarrollo
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  const runFullAudit = async () => {
    setIsRunning(true);
    try {
      // Ejecutar auditoría de axe-core
      const results = await runAccessibilityAudit();
      setAuditResults(results);

      // Verificar contraste de colores
      const contrast = checkColorContrast('#ffffff', '#000000'); // Texto blanco sobre negro
      setContrastResults(contrast);

      // Validar navegación por teclado
      const keyboard = validateKeyboardNavigation(document.body);
      setKeyboardResults(keyboard);

      // Verificar compatibilidad del navegador
      const compat = checkBrowserCompatibility();
      setBrowserCompat(compat);

      // Ejecutar auditoría de privacidad
      const privacy = await runPrivacyAudit();
      setPrivacyAudit(privacy);

    } catch (error) {
      console.error('Accessibility audit failed:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const runPrivacyAudit = async () => {
    const issues = [];
    const checks = {
      cookieBanner: false,
      privacyPolicy: false,
      dataRequests: false,
      consentManagement: false,
      dataProtection: false
    };

    // Verificar banner de cookies
    const cookieBanner = document.querySelector('.cookie-banner, [data-testid="cookie-banner"]');
    checks.cookieBanner = !!cookieBanner;

    if (!cookieBanner) {
      issues.push('Cookie banner not found - GDPR/CCPA requirement');
    } else {
      // Verificar elementos del banner
      const acceptBtn = cookieBanner.querySelector('.cookie-accept-all, [data-testid="accept-cookies"]');
      const rejectBtn = cookieBanner.querySelector('.cookie-reject-all, [data-testid="reject-cookies"]');
      const customizeBtn = cookieBanner.querySelector('.cookie-customize, [data-testid="customize-cookies"]');

      if (!acceptBtn) issues.push('Accept cookies button missing');
      if (!rejectBtn) issues.push('Reject cookies button missing');
      if (!customizeBtn) issues.push('Customize cookies button missing');
    }

    // Verificar política de privacidad
    const privacyLink = document.querySelector('a[href*="privacy"], a[href*="privacidad"]');
    checks.privacyPolicy = !!privacyLink;

    if (!privacyLink) {
      issues.push('Privacy policy link not found');
    }

    // Verificar página de gestión de datos
    const dataRequestsLink = document.querySelector('a[href*="data-request"], a[href*="datos"]');
    checks.dataRequests = !!dataRequestsLink;

    if (!dataRequestsLink) {
      issues.push('Data requests/management link not found');
    }

    // Verificar gestión de consentimiento
    const consent = localStorage.getItem('cookieConsent');
    checks.consentManagement = !!consent;

    if (!consent) {
      issues.push('No cookie consent stored - user consent not properly managed');
    }

    // Verificar protección de datos básicos
    const hasHTTPS = window.location.protocol === 'https:';
    const hasSecureCookie = document.cookie.includes('secure') || hasHTTPS;
    checks.dataProtection = hasSecureCookie;

    if (!hasSecureCookie) {
      issues.push('Insecure data transmission detected');
    }

    return {
      checks,
      issues,
      score: Math.round((Object.values(checks).filter(Boolean).length / Object.keys(checks).length) * 100),
      compliant: issues.length === 0
    };
  };

  useEffect(() => {
    // Ejecutar auditoría inicial
    runFullAudit();

    // Re-ejecutar cada 30 segundos
    const interval = setInterval(runFullAudit, 30000);
    return () => clearInterval(interval);
  }, []);

  if (!auditResults) {
    return (
      <div style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        background: '#333',
        color: '#fff',
        padding: '10px',
        borderRadius: '5px',
        fontSize: '12px',
        zIndex: 9999,
        maxWidth: '300px'
      }}>
        🔍 Inicializando auditoría de accesibilidad...
      </div>
    );
  }

  const violations = auditResults?.violations || [];
  const hasViolations = violations.length > 0;

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      background: hasViolations ? '#d32f2f' : '#2e7d32',
      color: '#fff',
      padding: '15px',
      borderRadius: '8px',
      fontSize: '12px',
      zIndex: 9999,
      maxWidth: '350px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
      fontFamily: 'monospace'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <strong>🔍 Accesibilidad</strong>
        <button
          onClick={runFullAudit}
          disabled={isRunning}
          style={{
            background: 'transparent',
            border: '1px solid #fff',
            color: '#fff',
            padding: '2px 6px',
            borderRadius: '3px',
            cursor: isRunning ? 'not-allowed' : 'pointer',
            fontSize: '10px'
          }}
        >
          {isRunning ? '...' : '↻'}
        </button>
      </div>

      <div style={{ marginBottom: '8px' }}>
        <div>Violations: <span style={{ color: hasViolations ? '#ffcc00' : '#4caf50' }}>{violations.length}</span></div>
        <div>Passes: <span style={{ color: '#4caf50' }}>{auditResults.passes?.length || 0}</span></div>
        <div>Incomplete: <span style={{ color: '#ff9800' }}>{auditResults.incomplete?.length || 0}</span></div>
        <div>Privacidad: <span style={{ color: privacyAudit?.compliant ? '#4caf50' : '#ffcc00' }}>
          {privacyAudit?.score || 0}%
        </span></div>
      </div>

      {contrastResults && (
        <div style={{ marginBottom: '8px', fontSize: '11px' }}>
          <div>Contraste (Texto/Negro):</div>
          <div>Ratio: {contrastResults.ratio.toFixed(2)}</div>
          <div style={{ color: contrastResults.aa ? '#4caf50' : '#ffcc00' }}>
            WCAG AA: {contrastResults.aa ? '✅' : '❌'}
          </div>
        </div>
      )}

      {keyboardResults && (
        <div style={{ marginBottom: '8px', fontSize: '11px' }}>
          <div>Elementos Focusables: {keyboardResults.totalFocusable}</div>
          <div style={{ color: keyboardResults.isValid ? '#4caf50' : '#ffcc00' }}>
            Navegación: {keyboardResults.isValid ? '✅' : '❌'}
          </div>
          {keyboardResults.issues.length > 0 && (
            <div>Issues: {keyboardResults.issues.length}</div>
          )}
        </div>
      )}

      {browserCompat && (
        <div style={{ marginBottom: '8px', fontSize: '11px' }}>
          <div>Compatibilidad: {(browserCompat.score * 100).toFixed(0)}%</div>
          <div style={{ color: browserCompat.isCompatible ? '#4caf50' : '#ffcc00' }}>
            Navegador: {browserCompat.isCompatible ? '✅' : '❌'}
          </div>
        </div>
      )}

      {hasViolations && (
        <details style={{ marginTop: '10px' }}>
          <summary style={{ cursor: 'pointer', fontSize: '11px' }}>
            Ver Detalles ({violations.length})
          </summary>
          <div style={{
            maxHeight: '200px',
            overflowY: 'auto',
            marginTop: '5px',
            fontSize: '10px',
            background: 'rgba(0,0,0,0.3)',
            padding: '5px',
            borderRadius: '3px'
          }}>
            {violations.slice(0, 5).map((violation, index) => (
              <div key={index} style={{ marginBottom: '8px', paddingBottom: '4px', borderBottom: '1px solid rgba(255,255,255,0.2)' }}>
                <div style={{ color: '#ffcc00', fontWeight: 'bold' }}>
                  {violation.id}: {violation.impact}
                </div>
                <div>{violation.description}</div>
                <div style={{ color: '#81c784' }}>
                  {violation.nodes.length} elementos afectados
                </div>
              </div>
            ))}
            {violations.length > 5 && (
              <div style={{ color: '#ffcc00' }}>
                ... y {violations.length - 5} más
              </div>
            )}
          </div>
        </details>
      )}

      <div style={{ marginTop: '10px', fontSize: '10px', opacity: 0.8 }}>
        Actualizado: {new Date().toLocaleTimeString()}
      </div>
    </div>
  );
};

export default AccessibilityAuditor;