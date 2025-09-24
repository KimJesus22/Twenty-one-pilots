import React from 'react';
import ReactDOM from 'react-dom/client';
import { ApolloProvider } from '@apollo/client/react';
import './index.css';
import './styles/accessibility.css'; // Estilos de accesibilidad
import App from './App';
import client from './apollo';
import './i18n'; // Inicializar i18n
import reportWebVitals from './reportWebVitals';
import { initAxe, checkBrowserCompatibility } from './utils/accessibility';

// Inicializar herramientas de accesibilidad en desarrollo
if (process.env.NODE_ENV === 'development') {
  initAxe();

  // Verificar compatibilidad del navegador
  const compatibility = checkBrowserCompatibility();
  console.log('🌐 Browser Accessibility Compatibility:', compatibility);

  if (!compatibility.isCompatible) {
    console.warn('⚠️ Browser may not support all accessibility features');
  }
}

// Agregar skip link al inicio del documento
const addSkipLink = () => {
  const skipLink = document.createElement('a');
  skipLink.href = '#main-content';
  skipLink.className = 'skip-link';
  skipLink.textContent = 'Saltar al contenido principal';
  document.body.insertBefore(skipLink, document.body.firstChild);
};

// Inicializar skip link cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', addSkipLink);
} else {
  addSkipLink();
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ApolloProvider client={client}>
      <App />
    </ApolloProvider>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
