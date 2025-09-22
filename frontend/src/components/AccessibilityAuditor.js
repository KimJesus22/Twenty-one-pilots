import React, { useState, useEffect, useCallback } from 'react';
import './AccessibilityAuditor.css';

const AccessibilityAuditor = ({ isOpen, onClose, targetElement = document }) => {
  const [auditResults, setAuditResults] = useState(null);
  const [isAuditing, setIsAuditing] = useState(false);
  const [selectedTool, setSelectedTool] = useState('lighthouse');
  const [manualChecks, setManualChecks] = useState([]);

  // Simulación de auditoría automática (en producción usar APIs reales)
  const runLighthouseAudit = useCallback(async () => {
    setIsAuditing(true);

    // Simular resultados de Lighthouse
    const mockResults = {
      tool: 'Lighthouse',
      timestamp: new Date().toISOString(),
      scores: {
        accessibility: 0.87,
        bestPractices: 0.92,
        seo: 0.95,
        performance: 0.78
      },
      issues: [
        {
          type: 'error',
          code: 'WCAG-1.1.1',
          title: 'Missing alternative text for images',
          description: 'Found 3 images without alt attributes',
          impact: 'critical',
          elements: ['img[src*="product1.jpg"]', 'img[src*="album-cover.png"]'],
          fix: 'Add descriptive alt text to all images'
        },
        {
          type: 'warning',
          code: 'WCAG-1.4.3',
          title: 'Insufficient color contrast',
          description: 'Text contrast ratio below 4.5:1',
          impact: 'serious',
          elements: ['.text-secondary', '.muted-text'],
          fix: 'Increase contrast between text and background colors'
        },
        {
          type: 'info',
          code: 'WCAG-2.4.6',
          title: 'Missing headings',
          description: 'Some sections lack proper heading structure',
          impact: 'moderate',
          elements: ['.product-grid', '.event-list'],
          fix: 'Add semantic heading elements (h1-h6) to organize content'
        }
      ],
      passedChecks: [
        'Document has a valid doctype',
        'Page has a title',
        'Color contrast is sufficient for large text',
        'Form elements have labels',
        'Links have discernible text'
      ]
    };

    // Simular delay de auditoría
    await new Promise(resolve => setTimeout(resolve, 2000));

    setAuditResults(mockResults);
    setIsAuditing(false);
  }, []);

  const runAxeAudit = useCallback(async () => {
    setIsAuditing(true);

    // Simular resultados de Axe
    const mockResults = {
      tool: 'Axe',
      timestamp: new Date().toISOString(),
      summary: {
        passed: 45,
        failed: 8,
        incomplete: 3,
        inapplicable: 12
      },
      violations: [
        {
          id: 'color-contrast',
          impact: 'serious',
          description: 'Elements must have sufficient color contrast',
          help: 'Ensure the contrast between the text and background is at least 4.5:1',
          nodes: [
            {
              target: ['.breadcrumb-text'],
              html: '<span class="breadcrumb-text">Home > Products</span>',
              failureSummary: 'Fix any of the following: Element has insufficient color contrast of 2.8:1'
            }
          ]
        },
        {
          id: 'image-alt',
          impact: 'critical',
          description: 'Images must have alternative text',
          help: 'Provide alternative text for all images',
          nodes: [
            {
              target: ['img.product-image'],
              html: '<img src="product.jpg" class="product-image">',
              failureSummary: 'Fix any of the following: Element does not have an alt attribute'
            }
          ]
        },
        {
          id: 'button-name',
          impact: 'critical',
          description: 'Buttons must have discernible text',
          help: 'Ensure buttons have meaningful text',
          nodes: [
            {
              target: ['button.close-btn'],
              html: '<button class="close-btn">×</button>',
              failureSummary: 'Fix any of the following: Element does not have text that is visible to screen readers'
            }
          ]
        }
      ]
    };

    await new Promise(resolve => setTimeout(resolve, 1500));

    setAuditResults(mockResults);
    setIsAuditing(false);
  }, []);

  const runWaveAudit = useCallback(async () => {
    setIsAuditing(true);

    // Simular resultados de WAVE
    const mockResults = {
      tool: 'WAVE',
      timestamp: new Date().toISOString(),
      summary: {
        errors: 5,
        warnings: 12,
        features: 8,
        structural: 15,
        aria: 6
      },
      errors: [
        {
          type: 'error',
          category: 'images',
          description: 'Missing alternative text',
          count: 3,
          elements: ['img[alt=""]', 'img:not([alt])']
        },
        {
          type: 'error',
          category: 'forms',
          description: 'Missing form labels',
          count: 2,
          elements: ['input[type="text"]:not([aria-label])']
        }
      ],
      warnings: [
        {
          type: 'warning',
          category: 'contrast',
          description: 'Low contrast text',
          count: 8,
          elements: ['.text-muted', '.small-text']
        }
      ]
    };

    await new Promise(resolve => setTimeout(resolve, 1000));

    setAuditResults(mockResults);
    setIsAuditing(false);
  }, []);

  const runManualAudit = useCallback(() => {
    const checks = [
      {
        id: 'keyboard-navigation',
        title: 'Navegación por teclado',
        status: 'pending',
        description: 'Verificar que todos los elementos interactivos sean accesibles por teclado',
        steps: [
          'Tab a través de todos los elementos',
          'Verificar indicadores de foco visibles',
          'Probar navegación con arrow keys en menús',
          'Confirmar que no hay elementos atrapados'
        ]
      },
      {
        id: 'screen-reader',
        title: 'Lector de pantalla',
        status: 'pending',
        description: 'Probar compatibilidad con lectores de pantalla',
        steps: [
          'Activar NVDA/JAWS/VoiceOver',
          'Verificar anuncios de cambios dinámicos',
          'Confirmar landmarks y headings',
          'Probar navegación por headings y landmarks'
        ]
      },
      {
        id: 'color-contrast',
        title: 'Contraste de colores',
        status: 'pending',
        description: 'Medir ratios de contraste con herramientas especializadas',
        steps: [
          'Usar Color Contrast Analyzer',
          'Verificar ratios ≥4.5:1 para texto normal',
          'Verificar ratios ≥3:1 para texto grande',
          'Probar en diferentes temas'
        ]
      },
      {
        id: 'focus-management',
        title: 'Gestión del foco',
        status: 'pending',
        description: 'Asegurar que el foco se maneje correctamente',
        steps: [
          'Abrir/cerrar modales y verificar foco',
          'Probar navegación en carousels',
          'Verificar foco después de submit de formularios',
          'Confirmar foco en mensajes de error'
        ]
      },
      {
        id: 'semantic-html',
        title: 'HTML semántico',
        status: 'pending',
        description: 'Verificar uso correcto de elementos semánticos',
        steps: [
          'Revisar estructura de headings (h1-h6)',
          'Verificar uso de landmarks',
          'Confirmar listas y tablas semánticas',
          'Probar sin CSS para verificar estructura'
        ]
      }
    ];

    setManualChecks(checks);
    setAuditResults({ tool: 'Manual Audit', checks });
  }, []);

  const runAudit = () => {
    switch (selectedTool) {
      case 'lighthouse':
        runLighthouseAudit();
        break;
      case 'axe':
        runAxeAudit();
        break;
      case 'wave':
        runWaveAudit();
        break;
      case 'manual':
        runManualAudit();
        break;
      default:
        break;
    }
  };

  const updateManualCheck = (checkId, status) => {
    setManualChecks(prev =>
      prev.map(check =>
        check.id === checkId ? { ...check, status } : check
      )
    );
  };

  const exportResults = () => {
    const dataStr = JSON.stringify(auditResults, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);

    const exportFileDefaultName = `accessibility-audit-${auditResults.tool.toLowerCase()}-${new Date().toISOString().split('T')[0]}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const getScoreColor = (score) => {
    if (score >= 0.9) return '#28a745';
    if (score >= 0.7) return '#ffc107';
    return '#dc3545';
  };

  const getImpactColor = (impact) => {
    switch (impact) {
      case 'critical': return '#dc3545';
      case 'serious': return '#fd7e14';
      case 'moderate': return '#ffc107';
      case 'minor': return '#17a2b8';
      default: return '#6c757d';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="accessibility-auditor-overlay" onClick={onClose}>
      <div className="accessibility-auditor" onClick={e => e.stopPropagation()}>
        <div className="auditor-header">
          <h2>Auditoría de Accesibilidad WCAG 2.1 AA</h2>
          <button className="auditor-close" onClick={onClose} aria-label="Cerrar auditoría">
            ✕
          </button>
        </div>

        <div className="auditor-controls">
          <div className="tool-selector">
            <label htmlFor="audit-tool">Herramienta:</label>
            <select
              id="audit-tool"
              value={selectedTool}
              onChange={(e) => setSelectedTool(e.target.value)}
            >
              <option value="lighthouse">Lighthouse</option>
              <option value="axe">Axe</option>
              <option value="wave">WAVE</option>
              <option value="manual">Auditoría Manual</option>
            </select>
          </div>

          <button
            className="btn btn-primary run-audit"
            onClick={runAudit}
            disabled={isAuditing}
          >
            {isAuditing ? 'Ejecutando...' : 'Ejecutar Auditoría'}
          </button>
        </div>

        {isAuditing && (
          <div className="auditing-progress">
            <div className="progress-bar">
              <div className="progress-fill"></div>
            </div>
            <p>Analizando accesibilidad...</p>
          </div>
        )}

        {auditResults && !isAuditing && (
          <div className="audit-results">
            <div className="results-header">
              <h3>Resultados - {auditResults.tool}</h3>
              <span className="audit-timestamp">
                {new Date(auditResults.timestamp).toLocaleString()}
              </span>
              <button className="btn btn-secondary export-btn" onClick={exportResults}>
                Exportar
              </button>
            </div>

            {auditResults.scores && (
              <div className="audit-scores">
                <h4>Puntuaciones</h4>
                <div className="scores-grid">
                  {Object.entries(auditResults.scores).map(([metric, score]) => (
                    <div key={metric} className="score-item">
                      <span className="metric-name">{metric}</span>
                      <div className="score-bar">
                        <div
                          className="score-fill"
                          style={{
                            width: `${score * 100}%`,
                            backgroundColor: getScoreColor(score)
                          }}
                        ></div>
                      </div>
                      <span className="score-value">{Math.round(score * 100)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {auditResults.summary && (
              <div className="audit-summary">
                <h4>Resumen</h4>
                <div className="summary-stats">
                  {Object.entries(auditResults.summary).map(([key, value]) => (
                    <div key={key} className="summary-item">
                      <span className="summary-label">{key}:</span>
                      <span className="summary-value">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {auditResults.issues && (
              <div className="audit-issues">
                <h4>Problemas Encontrados ({auditResults.issues.length})</h4>
                <div className="issues-list">
                  {auditResults.issues.map((issue, index) => (
                    <div key={index} className="issue-item">
                      <div className="issue-header">
                        <span
                          className="issue-type"
                          style={{ backgroundColor: getImpactColor(issue.impact) }}
                        >
                          {issue.type}
                        </span>
                        <span className="issue-code">{issue.code}</span>
                        <span className="issue-impact">{issue.impact}</span>
                      </div>
                      <h5>{issue.title}</h5>
                      <p>{issue.description}</p>
                      {issue.elements && (
                        <div className="issue-elements">
                          <strong>Elementos afectados:</strong>
                          <code>{issue.elements.join(', ')}</code>
                        </div>
                      )}
                      {issue.fix && (
                        <div className="issue-fix">
                          <strong>Solución:</strong> {issue.fix}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {auditResults.violations && (
              <div className="audit-violations">
                <h4>Violaciones ({auditResults.violations.length})</h4>
                {auditResults.violations.map((violation, index) => (
                  <div key={index} className="violation-item">
                    <div className="violation-header">
                      <span className="violation-id">{violation.id}</span>
                      <span
                        className="violation-impact"
                        style={{ backgroundColor: getImpactColor(violation.impact) }}
                      >
                        {violation.impact}
                      </span>
                    </div>
                    <h5>{violation.description}</h5>
                    <p>{violation.help}</p>
                    <div className="violation-nodes">
                      {violation.nodes.map((node, nodeIndex) => (
                        <div key={nodeIndex} className="node-item">
                          <code>{node.target.join(', ')}</code>
                          <p>{node.failureSummary}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {auditResults.checks && (
              <div className="manual-checks">
                <h4>Lista de Verificación Manual</h4>
                <div className="checks-list">
                  {auditResults.checks.map((check) => (
                    <div key={check.id} className="check-item">
                      <div className="check-header">
                        <h5>{check.title}</h5>
                        <select
                          value={check.status}
                          onChange={(e) => updateManualCheck(check.id, e.target.value)}
                          className={`status-select status-${check.status}`}
                        >
                          <option value="pending">Pendiente</option>
                          <option value="passed">Aprobado</option>
                          <option value="failed">Fallido</option>
                          <option value="na">N/A</option>
                        </select>
                      </div>
                      <p>{check.description}</p>
                      <ol className="check-steps">
                        {check.steps.map((step, stepIndex) => (
                          <li key={stepIndex}>{step}</li>
                        ))}
                      </ol>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {auditResults.passedChecks && (
              <div className="passed-checks">
                <h4>Verificaciones Aprobadas ({auditResults.passedChecks.length})</h4>
                <ul className="passed-list">
                  {auditResults.passedChecks.map((check, index) => (
                    <li key={index}>✓ {check}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        <div className="auditor-footer">
          <p>
            Para más información sobre WCAG 2.1 AA, visita{' '}
            <a href="https://www.w3.org/WAI/WCAG21/quickref/" target="_blank" rel="noopener noreferrer">
              las pautas oficiales
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AccessibilityAuditor;