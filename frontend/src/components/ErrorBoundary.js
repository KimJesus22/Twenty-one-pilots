import React from 'react';
import { useTranslation } from 'react-i18next';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(_error) {
    // Actualizar el estado para mostrar la UI de error
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log del error
    console.error('ErrorBoundary capturó un error:', error, errorInfo);
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      // Limpiar el estado de error para evitar bucles
      this.setState({ hasError: false, error: null, errorInfo: null });

      return (
        <ErrorBoundaryContent />
      );
    }

    return this.props.children;
  }
}

// Componente funcional para usar hooks de traducción
const ErrorBoundaryContent = () => {
  const { t } = useTranslation();

  return (
    <div style={{
      padding: '40px',
      margin: '20px auto',
      border: '1px solid #ff6b6b',
      borderRadius: '8px',
      backgroundColor: '#ffeaea',
      textAlign: 'center',
      maxWidth: '600px'
    }}>
      <h2 style={{ color: '#d32f2f', marginBottom: '10px' }}>{t('errors.generic')}</h2>
      <p style={{ color: '#666', marginBottom: '20px' }}>
        {t('errors.genericDesc')}
      </p>

      <div style={{ marginTop: '30px' }}>
        <button
          onClick={() => window.location.reload()}
          style={{
            padding: '12px 24px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: 'bold',
            marginRight: '10px'
          }}
        >
          {t('errors.reload')}
        </button>
        <button
          onClick={() => window.location.href = '/'}
          style={{
            padding: '12px 24px',
            backgroundColor: '#2196F3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: 'bold'
          }}
        >
          {t('errors.goHome')}
        </button>
      </div>
    </div>
  );
};

export default ErrorBoundary;