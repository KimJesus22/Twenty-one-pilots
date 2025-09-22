import { useState, useEffect, useCallback } from 'react';

// Hook para detectar preferencias de accesibilidad del usuario
export function useAccessibilityPreferences() {
  const [preferences, setPreferences] = useState({
    highContrast: false,
    reducedMotion: false,
    largeText: false,
    screenReader: false
  });

  useEffect(() => {
    // Detectar preferencias del sistema
    const mediaQueryHighContrast = window.matchMedia('(prefers-contrast: high)');
    const mediaQueryReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const mediaQueryLargeText = window.matchMedia('(min-resolution: 2dppx)');

    const updatePreferences = () => {
      setPreferences({
        highContrast: mediaQueryHighContrast.matches || localStorage.getItem('highContrast') === 'true',
        reducedMotion: mediaQueryReducedMotion.matches || localStorage.getItem('reducedMotion') === 'true',
        largeText: localStorage.getItem('largeText') === 'true',
        screenReader: localStorage.getItem('screenReader') === 'true'
      });
    };

    // Escuchar cambios en las preferencias del sistema
    mediaQueryHighContrast.addEventListener('change', updatePreferences);
    mediaQueryReducedMotion.addEventListener('change', updatePreferences);

    updatePreferences();

    return () => {
      mediaQueryHighContrast.removeEventListener('change', updatePreferences);
      mediaQueryReducedMotion.removeEventListener('change', updatePreferences);
    };
  }, []);

  const toggleHighContrast = useCallback(() => {
    const newValue = !preferences.highContrast;
    localStorage.setItem('highContrast', newValue.toString());
    setPreferences(prev => ({ ...prev, highContrast: newValue }));
  }, [preferences.highContrast]);

  const toggleReducedMotion = useCallback(() => {
    const newValue = !preferences.reducedMotion;
    localStorage.setItem('reducedMotion', newValue.toString());
    setPreferences(prev => ({ ...prev, reducedMotion: newValue }));
  }, [preferences.reducedMotion]);

  const toggleLargeText = useCallback(() => {
    const newValue = !preferences.largeText;
    localStorage.setItem('largeText', newValue.toString());
    setPreferences(prev => ({ ...prev, largeText: newValue }));
  }, [preferences.largeText]);

  const toggleScreenReader = useCallback(() => {
    const newValue = !preferences.screenReader;
    localStorage.setItem('screenReader', newValue.toString());
    setPreferences(prev => ({ ...prev, screenReader: newValue }));
  }, [preferences.screenReader]);

  return {
    preferences,
    toggleHighContrast,
    toggleReducedMotion,
    toggleLargeText,
    toggleScreenReader
  };
}

// Hook para navegación por teclado
export function useKeyboardNavigation() {
  const [isKeyboardUser, setIsKeyboardUser] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event) => {
      // Detectar navegación por teclado (Tab, arrow keys, etc.)
      if (['Tab', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter', ' '].includes(event.key)) {
        setIsKeyboardUser(true);
      }
    };

    const handleMouseDown = () => {
      setIsKeyboardUser(false);
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('touchstart', handleMouseDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('touchstart', handleMouseDown);
    };
  }, []);

  return isKeyboardUser;
}

// Hook para focus management
export function useFocusManagement() {
  const setFocus = useCallback((elementId) => {
    const element = document.getElementById(elementId);
    if (element) {
      element.focus();
    }
  }, []);

  const trapFocus = useCallback((containerRef, initialFocusId = null) => {
    if (!containerRef.current) return;

    const focusableElements = containerRef.current.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleKeyDown = (event) => {
      if (event.key === 'Tab') {
        if (event.shiftKey) {
          if (document.activeElement === firstElement) {
            event.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            event.preventDefault();
            firstElement.focus();
          }
        }
      }

      if (event.key === 'Escape') {
        // Cerrar modal o menú
        const closeButton = containerRef.current.querySelector('[data-close]');
        if (closeButton) {
          closeButton.click();
        }
      }
    };

    containerRef.current.addEventListener('keydown', handleKeyDown);

    // Set initial focus
    if (initialFocusId) {
      setFocus(initialFocusId);
    } else if (firstElement) {
      firstElement.focus();
    }

    return () => {
      containerRef.current.removeEventListener('keydown', handleKeyDown);
    };
  }, [setFocus]);

  return { setFocus, trapFocus };
}

// Hook para anuncios de accesibilidad (screen reader announcements)
export function useScreenReaderAnnouncement() {
  const announce = useCallback((message, priority = 'polite') => {
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

  return { announce };
}

// Hook para validación accesible de formularios
export function useAccessibleForm() {
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const validateField = useCallback((name, value, rules = {}) => {
    const fieldErrors = [];

    if (rules.required && (!value || value.toString().trim() === '')) {
      fieldErrors.push(`${rules.label || name} es requerido`);
    }

    if (rules.minLength && value && value.length < rules.minLength) {
      fieldErrors.push(`${rules.label || name} debe tener al menos ${rules.minLength} caracteres`);
    }

    if (rules.maxLength && value && value.length > rules.maxLength) {
      fieldErrors.push(`${rules.label || name} no puede tener más de ${rules.maxLength} caracteres`);
    }

    if (rules.pattern && value && !rules.pattern.test(value)) {
      fieldErrors.push(rules.patternMessage || `${rules.label || name} tiene un formato inválido`);
    }

    if (rules.email && value) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        fieldErrors.push('Correo electrónico inválido');
      }
    }

    return fieldErrors;
  }, []);

  const handleFieldChange = useCallback((name, value, rules = {}) => {
    const fieldErrors = validateField(name, value, rules);

    setErrors(prev => ({
      ...prev,
      [name]: fieldErrors
    }));

    return fieldErrors.length === 0;
  }, [validateField]);

  const handleFieldBlur = useCallback((name) => {
    setTouched(prev => ({
      ...prev,
      [name]: true
    }));
  }, []);

  const getFieldProps = useCallback((name, rules = {}) => ({
    id: name,
    name,
    'aria-describedby': errors[name]?.length > 0 ? `${name}-error` : undefined,
    'aria-invalid': errors[name]?.length > 0,
    onChange: (e) => handleFieldChange(name, e.target.value, rules),
    onBlur: () => handleFieldBlur(name)
  }), [errors, handleFieldChange, handleFieldBlur]);

  const getFieldErrorProps = useCallback((name) => ({
    id: `${name}-error`,
    role: 'alert',
    'aria-live': 'polite'
  }), []);

  const isFormValid = useCallback(() => {
    return Object.values(errors).every(fieldErrors => fieldErrors.length === 0) &&
           Object.keys(touched).length > 0;
  }, [errors, touched]);

  return {
    errors,
    touched,
    getFieldProps,
    getFieldErrorProps,
    handleFieldChange,
    handleFieldBlur,
    isFormValid,
    setErrors
  };
}

// Utilidades de accesibilidad
export const accessibilityUtils = {
  // Generar IDs únicos para elementos relacionados
  generateId: () => `a11y-${Math.random().toString(36).substr(2, 9)}`,

  // Verificar contraste de colores
  checkContrast: (foreground, background) => {
    // Implementación simplificada - en producción usar una librería como color-contrast
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

    return (brightest + 0.05) / (darkest + 0.05);
  },

  // Generar texto alternativo descriptivo
  generateAltText: (imageType, context = {}) => {
    const templates = {
      product: `Producto ${context.name || ''} de Twenty One Pilots`,
      event: `Evento ${context.title || ''} en ${context.venue || ''}`,
      album: `Portada del álbum ${context.title || ''} de Twenty One Pilots`,
      artist: `Foto de ${context.name || ''} de Twenty One Pilots`,
      logo: 'Logo oficial de Twenty One Pilots',
      decorative: '' // Imágenes decorativas no necesitan alt text
    };

    return templates[imageType] || `Imagen de ${imageType}`;
  }
};