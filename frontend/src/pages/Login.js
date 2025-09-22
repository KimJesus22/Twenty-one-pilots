import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import './Login.css';

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const { login, register: registerUser, loading, error } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

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
    let result;

    if (isLogin) {
      result = await login({
        email: data.email,
        password: data.password
      });
    } else {
      if (data.password !== data.confirmPassword) {
        alert('Las contraseñas no coinciden');
        return;
      }

      result = await registerUser({
        email: data.email,
        password: data.password,
        username: data.username
      });
    }

    if (result.success) {
      navigate('/');
    }
  };

  const switchMode = () => {
    setIsLogin(!isLogin);
    reset();
  };

  return (
    <div className="login">
      <div className="login-container">
        <div className="login-header">
          <h1>{isLogin ? t('auth.login') : t('auth.register')}</h1>
          <p>{isLogin ? t('auth.loginSubtitle') : t('auth.registerSubtitle')}</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="login-form">
          {!isLogin && (
            <div className="form-group">
              <label htmlFor="username">{t('auth.username')}</label>
              <input
                type="text"
                id="username"
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
              {errors.username && (
                <span className="error-text">{errors.username.message}</span>
              )}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">{t('auth.email')}</label>
            <input
              type="email"
              id="email"
              {...register('email', {
                required: t('auth.emailRequired'),
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: t('auth.emailInvalid')
                }
              })}
              placeholder="tu@email.com"
            />
            {errors.email && (
              <span className="error-text">{errors.email.message}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="password">{t('auth.password')}</label>
            <input
              type="password"
              id="password"
              {...register('password', {
                required: t('auth.passwordRequired'),
                minLength: {
                  value: 6,
                  message: t('auth.passwordMinLength')
                }
              })}
              placeholder={t('auth.password')}
            />
            {errors.password && (
              <span className="error-text">{errors.password.message}</span>
            )}
          </div>

          {!isLogin && (
            <div className="form-group">
              <label htmlFor="confirmPassword">{t('auth.confirmPassword')}</label>
              <input
                type="password"
                id="confirmPassword"
                {...register('confirmPassword', {
                  required: t('auth.passwordRequired'),
                  validate: (value, formValues) =>
                    value === formValues.password || t('auth.passwordMismatch')
                })}
                placeholder={t('auth.confirmPassword')}
              />
              {errors.confirmPassword && (
                <span className="error-text">{errors.confirmPassword.message}</span>
              )}
            </div>
          )}

          {error && (
            <div className="error-message">
              <p>{error}</p>
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary login-btn"
            disabled={loading}
          >
            {loading ? t('common.loading') : (isLogin ? t('auth.signIn') : t('auth.signUp'))}
          </button>
        </form>

        <div className="login-footer">
          <p>
            {isLogin ? t('auth.noAccount') : t('auth.hasAccount')}
            <button
              type="button"
              onClick={switchMode}
              className="switch-mode-btn"
            >
              {isLogin ? t('auth.signUp') : t('auth.signIn')}
            </button>
          </p>
        </div>

        <div className="demo-accounts">
          <h3>{t('auth.loginTitle')}:</h3>
          <div className="demo-account">
            <strong>{t('auth.admin')}:</strong> admin@top.com / admin123
          </div>
          <div className="demo-account">
            <strong>{t('auth.user')}:</strong> user@top.com / user123
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;