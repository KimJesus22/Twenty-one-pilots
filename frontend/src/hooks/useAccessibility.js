import { useEffect, useRef, useCallback } from 'react';

/**
 * Hook personalizado para mejorar la accesibilidad de componentes
 * Proporciona utilidades para manejo de foco, navegación por teclado y ARIA
 */
export const useAccessibility = () => {
  const focusRef = useRef(null);

  /**
   * Maneja el foco inicial en un elemento
   */
  const setInitialFocus = useCallback((element) => {
    if (element && typeof element.focus === 'function') {
      // Pequeño delay para asegurar que el elemento esté renderizado
      setTimeout(() => {
        element.focus();
        // Scroll suave hacia el elemento si es necesario
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    }
  }, []);

  /**
   * Maneja el foco al montar el componente
   */
  const focusOnMount = useCallback(() => {
    useEffect(() => {
      if (focusRef.current) {
        setInitialFocus(focusRef.current);
      }
    }, []);
  }, [setInitialFocus]);

  /**
   * Trap del foco dentro de un contenedor (modal, dropdown, etc.)
   */
  const trapFocus = useCallback((containerRef, isActive = true) => {
    useEffect(() => {
      if (!isActive || !containerRef.current) return;

      const container = containerRef.current;
      const focusableElements = container.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      const handleKeyDown = (e) => {
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

        // Escape key handling
        if (e.key === 'Escape') {
          // Emitir evento personalizado para que el componente padre maneje el cierre
          const escapeEvent = new CustomEvent('accessibility:escape', {
            bubbles: true,
            detail: { source: 'trapFocus' }
          });
          container.dispatchEvent(escapeEvent);
        }
      };

      container.addEventListener('keydown', handleKeyDown);
      return () => container.removeEventListener('keydown', handleKeyDown);
    }, [containerRef, isActive]);
  }, []);

  /**
   * Anuncia mensajes para lectores de pantalla
   */
  const announceToScreenReader = useCallback((message, priority = 'polite') => {
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
  }, []);

  /**
   * Maneja errores de forma accesible
   */
  const announceError = useCallback((errorMessage) => {
    announceToScreenReader(`Error: ${errorMessage}`, 'assertive');
  }, [announceToScreenReader]);

  /**
   * Maneja mensajes de éxito de forma accesible
   */
  const announceSuccess = useCallback((successMessage) => {
    announceToScreenReader(successMessage, 'polite');
  }, [announceToScreenReader]);

  /**
   * Genera IDs únicos para elementos relacionados (label/input)
   */
  const generateAriaIds = useCallback((baseId) => {
    const uniqueId = `${baseId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    return {
      input: uniqueId,
      label: `${uniqueId}-label`,
      error: `${uniqueId}-error`,
      help: `${uniqueId}-help`
    };
  }, []);

  /**
   * Valida contraste de color (implementación básica)
   */
  const validateContrast = useCallback((foreground, background) => {
    // Función simplificada para calcular ratio de contraste
    // En producción, usar una librería como color-contrast

    const getLuminance = (color) => {
      // Convertir hex a RGB y calcular luminancia
      const hex = color.replace('#', '');
      const r = parseInt(hex.substr(0, 2), 16) / 255;
      const g = parseInt(hex.substr(2, 2), 16) / 255;
      const b = parseInt(hex.substr(4, 2), 16) / 255;

      const [rs, gs, bs] = [r, g, b].map(c =>
        c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
      );

      return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
    };

    const lum1 = getLuminance(foreground);
    const lum2 = getLuminance(background);
    const brightest = Math.max(lum1, lum2);
    const darkest = Math.min(lum1, lum2);

    const contrast = (brightest + 0.05) / (darkest + 0.05);

    return {
      ratio: contrast,
      aa: contrast >= 4.5, // WCAG AA para texto normal
      aaa: contrast >= 7,  // WCAG AAA para texto normal
      aaLarge: contrast >= 3, // WCAG AA para texto grande
      aaaLarge: contrast >= 4.5 // WCAG AAA para texto grande
    };
  }, []);

  /**
   * Hook para manejar el foco después de operaciones asíncronas
   */
  const useFocusAfterAsync = useCallback((asyncOperation, focusElement) => {
    return async (...args) => {
      try {
        const result = await asyncOperation(...args);
        // Después de la operación exitosa, enfocar el elemento especificado
        if (focusElement && result.success) {
          setTimeout(() => setInitialFocus(focusElement), 100);
        }
        return result;
      } catch (error) {
        // En caso de error, mantener el foco en el elemento actual
        announceError(error.message || 'Operation failed');
        throw error;
      }
    };
  }, [setInitialFocus, announceError]);

  return {
    focusRef,
    setInitialFocus,
    focusOnMount,
    trapFocus,
    announceToScreenReader,
    announceError,
    announceSuccess,
    generateAriaIds,
    validateContrast,
    useFocusAfterAsync
  };
};

export default useAccessibility;