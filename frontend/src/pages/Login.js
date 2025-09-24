import React, { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import useRecaptcha from '../hooks/useRecaptcha';
import useAccessibility from '../hooks/useAccessibility';
import ReCaptcha from '../components/ReCaptcha';
import './Login.css';

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [recaptchaToken, setRecaptchaToken] = useState(null);
  const [recaptchaError, setRecaptchaError] = useState(null);
  const { login, register: registerUser, loading, error } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { isEnabled: recaptchaEnabled, siteKey, executeRecaptcha } = useRecaptcha();
  const {
    focusRef,
    setInitialFocus,
    announceError,
    announceSuccess,
    generateAriaIds
  } = useAccessibility();

  // Generar IDs únicos para accesibilidad
  const ids = generateAriaIds('login-form');

  // Enfocar el primer campo al montar
  useEffect(() => {
    setInitialFocus(focusRef.current);
  }, [setInitialFocus]);

  // Anunciar cambios de modo para lectores de pantalla
  useEffect(() => {
    const modeText = isLogin ? 'Inicio de sesión' : 'Registro de usuario';
    announceSuccess(`Modo cambiado a: ${modeText}`);
  }, [isLogin, announceSuccess]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm({
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      username: ''
    }
  });

  const onSubmit = async (data) => {
    // Validate reCAPTCHA if enabled
    if (recaptchaEnabled && !recaptchaToken) {
      const errorMsg = 'Por favor completa la verificación reCAPTCHA';
      setRecaptchaError(errorMsg);
      announceError(errorMsg);
      return;
    }

    let recaptchaResult = null;
    if (recaptchaEnabled) {
      try {
        announceSuccess('Verificando seguridad...');
        recaptchaResult = await executeRecaptcha(isLogin ? 'login' : 'register');
        if (!recaptchaResult.success) {
          const errorMsg = 'Error en verificación reCAPTCHA';
          setRecaptchaError(errorMsg);
          announceError(errorMsg);
          return;
        }
      } catch (error) {
        const errorMsg = 'Error ejecutando reCAPTCHA';
        setRecaptchaError(errorMsg);
        announceError(errorMsg);
        return;
      }
    }

    announceSuccess('Procesando solicitud...');

    let result;

    if (isLogin) {
      result = await login({
        email: data.email,
        password: data.password,
        recaptchaToken: recaptchaResult?.token
      });
    } else {
      if (data.password !== data.confirmPassword) {
        const errorMsg = 'Las contraseñas no coinciden';
        announceError(errorMsg);
        alert(errorMsg); // Mantener alert para consistencia con código existente
        return;
      }

      result = await registerUser({
        email: data.email,
        password: data.password,
        username: data.username,
        recaptchaToken: recaptchaResult?.token
      });
    }

    if (result.success) {
      announceSuccess(isLogin ? 'Inicio de sesión exitoso' : 'Registro exitoso');
      navigate('/');
    } else {
      announceError(result.error || 'Error en la autenticación');
    }
  };

  const switchMode = () => {
    setIsLogin(!isLogin);
    reset();
  };

  return (
    <div className="login" aria-labelledby="login-title">
      <div className="login-container">
        <div className="login-header">
          <h1 id="login-title">{isLogin ? t('auth.login') : t('auth.register')}</h1>
          <p id="login-subtitle" className="sr-only">
            {isLogin ? t('auth.loginSubtitle') : t('auth.registerSubtitle')}
          </p>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="login-form"
          role="form"
          aria-labelledby="login-title"
          aria-describedby="login-subtitle"
          noValidate
        >
          {!isLogin && (
            <div className="form-group">
              <label htmlFor={ids.input} id={ids.label}>
                {t('auth.username')}
                <span className="required" aria-label="requerido">*</span>
              </label>
              <input
                ref={focusRef}
                type="text"
                id={ids.input}
                aria-labelledby={ids.label}
                aria-describedby={errors.username ? ids.error : ids.help}
                aria-required="true"
                aria-invalid={errors.username ? 'true' : 'false'}
                autoComplete="username"
                {...register('username', {
                  required: t('auth.usernameRequired'),
                  minLength: {
                    value: 3,
                    message: t('auth.usernameMinLength')
                  },
                  maxLength: {
                    value: 20,
                    message: t('auth.usernameMaxLength')
                  }
                })}
                placeholder={t('auth.username')}
              />
              <div id={ids.help} className="sr-only">
                Ingresa un nombre de usuario entre 3 y 20 caracteres
              </div>
              {errors.username && (
                <span
                  id={ids.error}
                  className="error-text"
                  role="alert"
                  aria-live="polite"
                >
                  {errors.username.message}
                </span>
              )}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email" id="email-label">
              {t('auth.email')}
              <span className="required" aria-label="requerido">*</span>
            </label>
            <input
              ref={!isLogin ? null : focusRef}
              type="email"
              id="email"
              aria-labelledby="email-label"
              aria-describedby={errors.email ? "email-error" : "email-help"}
              aria-required="true"
              aria-invalid={errors.email ? 'true' : 'false'}
              autoComplete="email"
              {...register('email', {
                required: t('auth.emailRequired'),
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: t('auth.emailInvalid')
                }
              })}
              placeholder="tu@email.com"
            />
            <div id="email-help" className="sr-only">
              Ingresa tu dirección de correo electrónico
            </div>
            {errors.email && (
              <span
                id="email-error"
                className="error-text"
                role="alert"
                aria-live="polite"
              >
                {errors.email.message}
              </span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="password" id="password-label">
              {t('auth.password')}
              <span className="required" aria-label="requerido">*</span>
            </label>
            <input
              type="password"
              id="password"
              aria-labelledby="password-label"
              aria-describedby={errors.password ? "password-error" : "password-help"}
              aria-required="true"
              aria-invalid={errors.password ? 'true' : 'false'}
              autoComplete={isLogin ? "current-password" : "new-password"}
              {...register('password', {
                required: t('auth.passwordRequired'),
                minLength: {
                  value: 6,
                  message: t('auth.passwordMinLength')
                }
              })}
              placeholder={t('auth.password')}
            />
            <div id="password-help" className="sr-only">
              {isLogin ? 'Ingresa tu contraseña' : 'Crea una contraseña segura de al menos 6 caracteres'}
            </div>
            {errors.password && (
              <span
                id="password-error"
                className="error-text"
                role="alert"
                aria-live="polite"
              >
                {errors.password.message}
              </span>
            )}
          </div>

          {!isLogin && (
            <div className="form-group">
              <label htmlFor="confirmPassword" id="confirm-password-label">
                {t('auth.confirmPassword')}
                <span className="required" aria-label="requerido">*</span>
              </label>
              <input
                type="password"
                id="confirmPassword"
                aria-labelledby="confirm-password-label"
                aria-describedby={errors.confirmPassword ? "confirm-password-error" : "confirm-password-help"}
                aria-required="true"
                aria-invalid={errors.confirmPassword ? 'true' : 'false'}
                autoComplete="new-password"
                {...register('confirmPassword', {
                  required: t('auth.passwordRequired'),
                  validate: (value, formValues) =>
                    value === formValues.password || t('auth.passwordMismatch')
                })}
                placeholder={t('auth.confirmPassword')}
              />
              <div id="confirm-password-help" className="sr-only">
                Repite la contraseña para confirmar
              </div>
              {errors.confirmPassword && (
                <span
                  id="confirm-password-error"
                  className="error-text"
                  role="alert"
                  aria-live="polite"
                >
                  {errors.confirmPassword.message}
                </span>
              )}
            </div>
          )}

          {error && (
            <div
              className="error-message"
              role="alert"
              aria-live="assertive"
              aria-atomic="true"
            >
              <p>{error}</p>
            </div>
          )}

          {recaptchaError && (
            <div
              className="error-message"
              role="alert"
              aria-live="assertive"
              aria-atomic="true"
            >
              <p>{recaptchaError}</p>
            </div>
          )}

          {recaptchaEnabled && siteKey && (
            <div className="form-group recaptcha-group">
              <ReCaptcha
                siteKey={siteKey}
                onVerify={(token) => {
                  setRecaptchaToken(token);
                  setRecaptchaError(null);
                  announceSuccess('Verificación de seguridad completada');
                }}
                onExpired={() => {
                  setRecaptchaToken(null);
                  const errorMsg = 'reCAPTCHA expirado, por favor verifica nuevamente';
                  setRecaptchaError(errorMsg);
                  announceError(errorMsg);
                }}
                action={isLogin ? 'login' : 'register'}
                aria-label="Verificación de seguridad reCAPTCHA"
                aria-describedby="recaptcha-help"
              />
              {recaptchaError && (
                <span
                  className="error-text"
                  role="alert"
                  aria-live="polite"
                >
                  {recaptchaError}
                </span>
              )}
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary login-btn"
            disabled={loading || (recaptchaEnabled && !recaptchaToken)}
            aria-describedby="submit-help"
          >
            {loading ? (
              <span aria-live="polite">
                <span className="sr-only">Cargando...</span>
                <span aria-hidden="true">{t('common.loading')}</span>
              </span>
            ) : (
              isLogin ? t('auth.signIn') : t('auth.signUp')
            )}
          </button>
          <div id="submit-help" className="sr-only">
            {recaptchaEnabled && !recaptchaToken
              ? 'Completa la verificación de seguridad antes de enviar'
              : 'Haz clic para enviar el formulario'
            }
          </div>
        </form>

        <div className="login-footer">
          <p>
            {isLogin ? t('auth.noAccount') : t('auth.hasAccount')}
            <button
              type="button"
              onClick={switchMode}
              className="switch-mode-btn"
              aria-label={`Cambiar a ${isLogin ? 'registro' : 'inicio de sesión'}`}
            >
              {isLogin ? t('auth.signUp') : t('auth.signIn')}
            </button>
          </p>
        </div>

        <section className="demo-accounts" aria-labelledby="demo-accounts-title">
          <h3 id="demo-accounts-title" className="sr-only">{t('auth.loginTitle')}:</h3>
          <div className="demo-account">
            <strong>{t('auth.admin')}:</strong>
            <span className="sr-only">correo electrónico: </span>
            admin@top.com
            <span className="sr-only">contraseña: </span>
            admin123
          </div>
          <div className="demo-account">
            <strong>{t('auth.user')}:</strong>
            <span className="sr-only">correo electrónico: </span>
            user@top.com
            <span className="sr-only">contraseña: </span>
            user123
          </div>
        </section>
      </div>
    </div>
  );
};

export default Login;