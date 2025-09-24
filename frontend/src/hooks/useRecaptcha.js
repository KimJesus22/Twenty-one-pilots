import { useState, useEffect, useCallback } from 'react';
import authAPI from '../api/auth';

const useRecaptcha = () => {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load reCAPTCHA configuration
  useEffect(() => {
    const loadConfig = async () => {
      try {
        setLoading(true);
        const response = await authAPI.getRecaptchaConfig();

        if (response.success) {
          setConfig(response.data);
        } else {
          setError('Failed to load reCAPTCHA configuration');
        }
      } catch (err) {
        console.error('Error loading reCAPTCHA config:', err);
        setError('Error loading reCAPTCHA configuration');
      } finally {
        setLoading(false);
      }
    };

    loadConfig();
  }, []);

  // Execute reCAPTCHA verification
  const executeRecaptcha = useCallback(async (action = 'submit') => {
    if (!config?.enabled) {
      return { success: true, token: null }; // Skip if not enabled
    }

    return new Promise((resolve) => {
      if (window.grecaptcha) {
        window.grecaptcha.ready(() => {
          window.grecaptcha.execute(config.siteKey, { action })
            .then((token) => {
              resolve({ success: true, token });
            })
            .catch((error) => {
              console.error('reCAPTCHA execution error:', error);
              resolve({ success: false, error: error.message });
            });
        });
      } else {
        resolve({ success: false, error: 'reCAPTCHA not loaded' });
      }
    });
  }, [config]);

  // Validate reCAPTCHA token (client-side basic validation)
  const validateToken = useCallback((token) => {
    if (!token) return false;
    if (typeof token !== 'string') return false;
    if (token.length < 20) return false; // Basic length check

    return true;
  }, []);

  return {
    config,
    loading,
    error,
    isEnabled: config?.enabled || false,
    siteKey: config?.siteKey,
    executeRecaptcha,
    validateToken
  };
};

export default useRecaptcha;