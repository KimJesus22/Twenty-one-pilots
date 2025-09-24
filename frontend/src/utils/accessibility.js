/**
 * Utilidades de accesibilidad para Twenty One Pilots
 * Configuración y helpers para testing y desarrollo
 */

import React from 'react';

// Configuración de axe-core para desarrollo
export const axeConfig = {
  rules: [
    {
      id: 'color-contrast',
      enabled: true
    },
    {
      id: 'aria-required-attr',
      enabled: true
    },
    {
      id: 'aria-valid-attr',
      enabled: true
    },
    {
      id: 'button-name',
      enabled: true
    },
    {
      id: 'form-field-multiple-labels',
      enabled: false // Permitir múltiples labels en algunos casos
    },
    {
      id: 'label',
      enabled: true
    },
    {
      id: 'link-name',
      enabled: true
    },
    {
      id: 'region',
      enabled: true
    }
  ],
  disableOtherRules: false,
  reporter: 'v2'
};

// Lista de reglas habilitadas para axe.run
export const enabledRules = axeConfig.rules
  .filter(rule => rule.enabled)
  .map(rule => rule.id);

// Función para inicializar axe en desarrollo
export const initAxe = async () => {
  if (process.env.NODE_ENV === 'development') {
    try {
      const axe = await import('axe-core');
      const reactAxe = await import('react-axe');

      // Configurar axe
      axe.configure(axeConfig);

      // Inicializar react-axe
      reactAxe.default(React, axe, 1000);

      console.log('✅ Axe accessibility testing initialized');
    } catch (error) {
      console.warn('⚠️ Failed to initialize axe accessibility testing:', error);
    }
  }
};

// Semáforo para evitar ejecuciones concurrentes de axe
let axeRunning = false;

// Función para ejecutar análisis de accesibilidad manual
export const runAccessibilityAudit = async (context = document) => {
  if (process.env.NODE_ENV === 'development') {
    // Esperar si axe ya está corriendo
    if (axeRunning) {
      console.log('⏳ Axe is already running, waiting...');
      return null;
    }

    axeRunning = true;

    try {
      const axe = await import('axe-core');

      const results = await axe.run(context, {
        runOnly: enabledRules
      });

      console.group('🔍 Accessibility Audit Results');
      console.log('Violations:', results.violations.length);
      console.log('Passes:', results.passes.length);
      console.log('Incomplete:', results.incomplete.length);

      if (results.violations.length > 0) {
        console.group('❌ Violations:');
        results.violations.forEach((violation, index) => {
          console.group(`${index + 1}. ${violation.id}: ${violation.description}`);
          console.log('Impact:', violation.impact);
          console.log('Help:', violation.help);
          console.log('Elements:', violation.nodes.length);
          violation.nodes.forEach((node, nodeIndex) => {
            console.log(`  ${nodeIndex + 1}. ${node.target.join(', ')}`);
          });
          console.groupEnd();
        });
        console.groupEnd();
      }

      console.groupEnd();

      return results;
    } catch (error) {
      console.error('❌ Accessibility audit failed:', error);
      return null;
    } finally {
      axeRunning = false;
    }
  }
};

// Función para verificar contraste de colores
export const checkColorContrast = (foreground, background) => {
  // Convertir colores hex a RGB
  const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  };

  const fg = hexToRgb(foreground);
  const bg = hexToRgb(background);

  if (!fg || !bg) return null;

  // Calcular luminancia relativa
  const getRelativeLuminance = (color) => {
    const { r, g, b } = color;
    const [rs, gs, bs] = [r, g, b].map(c => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  };

  const lum1 = getRelativeLuminance(fg);
  const lum2 = getRelativeLuminance(bg);
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);

  const contrast = (brightest + 0.05) / (darkest + 0.05);

  return {
    ratio: contrast,
    aa: contrast >= 4.5,      // WCAG AA para texto normal
    aaa: contrast >= 7,       // WCAG AAA para texto normal
    aaLarge: contrast >= 3,   // WCAG AA para texto grande
    aaaLarge: contrast >= 4.5 // WCAG AAA para texto grande
  };
};

// Función para generar IDs únicos para accesibilidad
export const generateAriaIds = (prefix = 'a11y') => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 9);

  return {
    container: `${prefix}-container-${timestamp}-${random}`,
    label: `${prefix}-label-${timestamp}-${random}`,
    input: `${prefix}-input-${timestamp}-${random}`,
    error: `${prefix}-error-${timestamp}-${random}`,
    help: `${prefix}-help-${timestamp}-${random}`,
    button: `${prefix}-button-${timestamp}-${random}`
  };
};

// Función para anunciar mensajes a lectores de pantalla
export const announceToScreenReader = (message, priority = 'polite') => {
  const announcement = document.createElement('div');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.setAttribute('class', 'sr-only');
  announcement.style.position = 'absolute';
  announcement.style.left = '-10000px';
  announcement.style.width = '1px';
  announcement.style.height = '1px';
  announcement.style.overflow = 'hidden';

  document.body.appendChild(announcement);
  announcement.textContent = message;

  // Remover después de que el lector de pantalla lo anuncie
  setTimeout(() => {
    if (announcement.parentNode) {
      announcement.parentNode.removeChild(announcement);
    }
  }, 1000);
};

// Función para manejar el foco después de operaciones asíncronas
export const focusAfterAsync = (asyncFn, focusElement) => {
  return async (...args) => {
    try {
      const result = await asyncFn(...args);
      if (result.success && focusElement) {
        setTimeout(() => {
          if (typeof focusElement.focus === 'function') {
            focusElement.focus();
            focusElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 100);
      }
      return result;
    } catch (error) {
      announceToScreenReader(`Error: ${error.message}`, 'assertive');
      throw error;
    }
  };
};

// Función para validar navegación por teclado
export const validateKeyboardNavigation = (container) => {
  const focusableElements = container.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );

  const issues = [];

  // Verificar que todos los elementos focusables sean accesibles
  focusableElements.forEach((element, index) => {
    // Verificar que no esté oculto
    const style = window.getComputedStyle(element);
    if (style.display === 'none' || style.visibility === 'hidden') {
      issues.push(`Element ${index} is hidden but focusable`);
    }

    // Verificar que tenga un tamaño mínimo
    const rect = element.getBoundingClientRect();
    if (rect.width < 1 || rect.height < 1) {
      issues.push(`Element ${index} has insufficient size for focus`);
    }
  });

  return {
    totalFocusable: focusableElements.length,
    issues,
    isValid: issues.length === 0
  };
};

// Función para crear un trap de foco (útil para modales)
export const createFocusTrap = (containerRef, options = {}) => {
  const { active = true, onEscape } = options;

  const handleKeyDown = (e) => {
    if (!active || !containerRef.current) return;

    const container = containerRef.current;
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (e.key === 'Tab') {
      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    }

    if (e.key === 'Escape' && onEscape) {
      onEscape();
    }
  };

  const activate = () => {
    document.addEventListener('keydown', handleKeyDown);
  };

  const deactivate = () => {
    document.removeEventListener('keydown', handleKeyDown);
  };

  return { activate, deactivate };
};

// Función para verificar compatibilidad con navegadores
export const checkBrowserCompatibility = () => {
  const features = {
    ariaLive: 'aria-live' in document.createElement('div'),
    ariaAtomic: 'aria-atomic' in document.createElement('div'),
    ariaLabel: 'aria-label' in document.createElement('div'),
    ariaDescribedBy: 'aria-describedby' in document.createElement('div'),
    ariaRequired: 'aria-required' in document.createElement('input'),
    ariaInvalid: 'aria-invalid' in document.createElement('input'),
    srOnly: CSS.supports('clip-path', 'inset(50%)'),
    focusVisible: CSS.supports('selector(:focus-visible)'),
    prefersReducedMotion: CSS.supports('selector(prefers-reduced-motion)')
  };

  const supported = Object.values(features).filter(Boolean).length;
  const total = Object.keys(features).length;

  return {
    features,
    score: (supported / total) * 100,
    isCompatible: supported >= total * 0.8 // 80% de compatibilidad mínima
  };
};