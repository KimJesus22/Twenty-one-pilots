import { useState, useEffect, useCallback } from 'react';

export const useAccessibility = () => {
  const [highContrast, setHighContrast] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [fontSize, setFontSize] = useState('medium');
  const [focusVisible, setFocusVisible] = useState(false);

  // Verificar preferencias del sistema
  useEffect(() => {
    // Verificar preferencia de movimiento reducido
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mediaQuery.matches);

    const handleChange = (e) => setReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handleChange);

    // Verificar preferencia de alto contraste
    const contrastQuery = window.matchMedia('(prefers-contrast: high)');
    setHighContrast(contrastQuery.matches);

    const handleContrastChange = (e) => setHighContrast(e.matches);
    contrastQuery.addEventListener('change', handleContrastChange);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
      contrastQuery.removeEventListener('change', handleContrastChange);
    };
  }, []);

  // Manejar navegación con teclado
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Skip links con Ctrl/Cmd + números
      if ((event.ctrlKey || event.metaKey) && event.key >= '1' && event.key <= '9') {
        event.preventDefault();
        const sections = [
          '#main-content',
          '#navigation',
          '#search',
          '#features',
          '#footer'
        ];
        const index = parseInt(event.key) - 1;
        if (sections[index]) {
          const element = document.querySelector(sections[index]);
          if (element) {
            element.focus();
            element.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth' });
          }
        }
      }

      // Escape para cerrar modales/dropdowns
      if (event.key === 'Escape') {
        // Cerrar dropdowns abiertos
        const openDropdowns = document.querySelectorAll('[aria-expanded="true"]');
        openDropdowns.forEach(dropdown => {
          if (dropdown.click) dropdown.click();
        });

        // Cerrar modales
        const openModals = document.querySelectorAll('[role="dialog"][aria-hidden="false"]');
        openModals.forEach(modal => {
          const closeBtn = modal.querySelector('[aria-label*="cerrar"], [aria-label*="close"]');
          if (closeBtn) closeBtn.click();
        });
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [reducedMotion]);

  // Manejar foco visible
  useEffect(() => {
    const handleFocus = () => setFocusVisible(true);
    const handleBlur = () => setFocusVisible(false);
    const handleMouseDown = () => setFocusVisible(false);

    document.addEventListener('focusin', handleFocus);
    document.addEventListener('focusout', handleBlur);
    document.addEventListener('mousedown', handleMouseDown);

    return () => {
      document.removeEventListener('focusin', handleFocus);
      document.removeEventListener('focusout', handleBlur);
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, []);

  // Funciones para cambiar configuraciones de accesibilidad
  const toggleHighContrast = useCallback(() => {
    setHighContrast(prev => !prev);
  }, []);

  const toggleReducedMotion = useCallback(() => {
    setReducedMotion(prev => !prev);
  }, []);

  const changeFontSize = useCallback((size) => {
    setFontSize(size);
    document.documentElement.setAttribute('data-font-size', size);
  }, []);

  // Anunciar cambios para lectores de pantalla
  const announceToScreenReader = useCallback((message, priority = 'polite') => {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', priority);
    announcement.setAttribute('aria-atomic', 'true');
    announcement.style.position = 'absolute';
    announcement.style.left = '-10000px';
    announcement.style.width = '1px';
    announcement.style.height = '1px';
    announcement.style.overflow = 'hidden';

    document.body.appendChild(announcement);
    announcement.textContent = message;

    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  }, []);

  // Skip links para navegación rápida
  const renderSkipLinks = () => (
    <nav aria-label="Enlaces de navegación rápida" className="skip-links">
      <a href="#main-content" className="skip-link">
        Ir al contenido principal
      </a>
      <a href="#navigation" className="skip-link">
        Ir a la navegación
      </a>
      <a href="#search" className="skip-link">
        Ir a la búsqueda
      </a>
      <a href="#footer" className="skip-link">
        Ir al pie de página
      </a>
    </nav>
  );

  return {
    highContrast,
    reducedMotion,
    fontSize,
    focusVisible,
    toggleHighContrast,
    toggleReducedMotion,
    changeFontSize,
    announceToScreenReader,
    renderSkipLinks
  };
};

export default useAccessibility;