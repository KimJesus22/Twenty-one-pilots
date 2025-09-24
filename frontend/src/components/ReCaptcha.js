import React, { useRef, useEffect, useState } from 'react';
import ReCAPTCHA from 'react-google-recaptcha';

const ReCaptcha = ({
  siteKey,
  onVerify,
  onExpired,
  action = 'submit',
  size = 'normal',
  theme = 'light',
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedBy
}) => {
  const recaptchaRef = useRef(null);
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check if reCAPTCHA script is loaded
    if (window.grecaptcha) {
      setIsReady(true);
      setIsLoading(false);
    } else {
      // Wait for script to load with timeout
      const checkRecaptcha = setInterval(() => {
        if (window.grecaptcha) {
          setIsReady(true);
          setIsLoading(false);
          clearInterval(checkRecaptcha);
        }
      }, 100);

      // Timeout after 10 seconds
      const timeout = setTimeout(() => {
        clearInterval(checkRecaptcha);
        setIsLoading(false);
        setError('reCAPTCHA failed to load within timeout');
      }, 10000);

      // Cleanup
      return () => {
        clearInterval(checkRecaptcha);
        clearTimeout(timeout);
      };
    }
  }, []);

  const handleVerify = (token) => {
    if (onVerify) {
      onVerify(token);
    }
  };

  const handleExpired = () => {
    if (onExpired) {
      onExpired();
    }
  };

  const resetCaptcha = () => {
    if (recaptchaRef.current) {
      recaptchaRef.current.reset();
    }
  };

  const executeCaptcha = () => {
    if (recaptchaRef.current) {
      recaptchaRef.current.execute();
    }
  };

  // Loading state with accessibility
  if (isLoading) {
    return (
      <div
        role="status"
        aria-live="polite"
        aria-label="Cargando verificación de seguridad"
        className="recaptcha-loading"
      >
        <div aria-hidden="true">Verificando seguridad...</div>
      </div>
    );
  }

  // Error state with accessibility
  if (error) {
    return (
      <div
        role="alert"
        aria-live="assertive"
        className="recaptcha-error"
      >
        Error en verificación de seguridad. Por favor, recarga la página.
      </div>
    );
  }

  // Not configured or not ready
  if (!siteKey || !isReady) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="recaptcha-disabled"
      >
        Verificación de seguridad no disponible
      </div>
    );
  }

  return (
    <div className="recaptcha-container">
      <ReCAPTCHA
        ref={recaptchaRef}
        sitekey={siteKey}
        onChange={handleVerify}
        onExpired={handleExpired}
        size={size}
        theme={theme}
        {...(action && { action })}
        aria-label={ariaLabel || "Verificación de seguridad reCAPTCHA"}
        aria-describedby={ariaDescribedBy}
        tabIndex={0}
      />
      <div className="sr-only" id="recaptcha-help">
        reCAPTCHA protege este sitio verificando que eres una persona real.
        Esta verificación es automática y no requiere interacción.
      </div>
    </div>
  );
};

export default ReCaptcha;