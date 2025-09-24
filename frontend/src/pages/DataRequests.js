import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import useAccessibility from '../hooks/useAccessibility';
import dataRequestsAPI from '../api/dataRequests';
import './DataRequests.css';

const DataRequests = () => {
  const { user, isAuthenticated } = useAuth();
  const { setInitialFocus, announceToScreenReader, announceError, announceSuccess, generateAriaIds } = useAccessibility();

  const [activeTab, setActiveTab] = useState('access');
  const [loading, setLoading] = useState(false);
  const [requests, setRequests] = useState([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');

  const mainRef = useRef(null);
  const ids = generateAriaIds('data-requests');

  useEffect(() => {
    setInitialFocus(mainRef.current);
    if (isAuthenticated) {
      loadUserRequests();
    }
  }, [setInitialFocus, isAuthenticated]);

  const loadUserRequests = async () => {
    try {
      const response = await dataRequestsAPI.getUserRequests();
      if (response.success) {
        setRequests(response.data);
      }
    } catch (error) {
      announceError('Error al cargar solicitudes anteriores');
    }
  };

  const handleDataAccess = async () => {
    if (!isAuthenticated) {
      announceError('Debes iniciar sesión para solicitar acceso a tus datos');
      return;
    }

    setLoading(true);
    try {
      const response = await dataRequestsAPI.requestDataAccess();
      if (response.success) {
        announceSuccess('Solicitud de acceso a datos enviada. Recibirás un email de confirmación.');
        await loadUserRequests();
      } else {
        announceError(response.message || 'Error al enviar solicitud');
      }
    } catch (error) {
      announceError('Error al procesar solicitud de acceso a datos');
    } finally {
      setLoading(false);
    }
  };

  const handleDataDeletion = async () => {
    if (!isAuthenticated) {
      announceError('Debes iniciar sesión para solicitar eliminación de datos');
      return;
    }

    if (deleteConfirmation !== 'ELIMINAR') {
      announceError('Por favor escribe "ELIMINAR" para confirmar');
      return;
    }

    setLoading(true);
    try {
      const response = await dataRequestsAPI.requestDataDeletion();
      if (response.success) {
        announceSuccess('Solicitud de eliminación enviada. Recibirás un email de confirmación.');
        setShowDeleteConfirm(false);
        setDeleteConfirmation('');
        await loadUserRequests();
      } else {
        announceError(response.message || 'Error al enviar solicitud de eliminación');
      }
    } catch (error) {
      announceError('Error al procesar solicitud de eliminación');
    } finally {
      setLoading(false);
    }
  };

  const handleDataPortability = async () => {
    if (!isAuthenticated) {
      announceError('Debes iniciar sesión para solicitar portabilidad de datos');
      return;
    }

    setLoading(true);
    try {
      const response = await dataRequestsAPI.requestDataPortability();
      if (response.success) {
        announceSuccess('Solicitud de portabilidad enviada. Recibirás un email con tus datos.');
        await loadUserRequests();
      } else {
        announceError(response.message || 'Error al enviar solicitud de portabilidad');
      }
    } catch (error) {
      announceError('Error al procesar solicitud de portabilidad');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'access', label: 'Acceso a Datos', description: 'Solicitar copia de tus datos personales' },
    { id: 'portability', label: 'Portabilidad', description: 'Obtener tus datos en formato portable' },
    { id: 'deletion', label: 'Eliminación', description: 'Solicitar eliminación de tu cuenta y datos' },
    { id: 'history', label: 'Historial', description: 'Ver estado de tus solicitudes anteriores' }
  ];

  if (!isAuthenticated) {
    return (
      <div className="data-requests">
        <div className="data-requests-container">
          <header className="data-requests-header">
            <nav aria-label="Navegación de solicitudes de datos">
              <Link to="/" className="nav-home-link" aria-label="Volver al inicio">
                ← Volver al Inicio
              </Link>
            </nav>
            <h1>Solicitudes de Datos</h1>
            <p>Para acceder a tus derechos de privacidad, necesitas iniciar sesión.</p>
          </header>
          <div className="auth-required">
            <Link to="/login" className="btn btn-primary">
              Iniciar Sesión
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="data-requests">
      <div className="data-requests-container">
        <header className="data-requests-header">
          <nav aria-label="Navegación de solicitudes de datos">
            <Link to="/" className="nav-home-link" aria-label="Volver al inicio">
              ← Volver al Inicio
            </Link>
          </nav>
          <h1 id="data-requests-title">Gestión de Datos Personales</h1>
          <p id="data-requests-subtitle">
            Gestiona tus derechos de privacidad bajo GDPR y CCPA
          </p>
        </header>

        <nav className="data-requests-tabs" role="tablist" aria-labelledby="data-requests-title">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activeTab === tab.id}
              aria-controls={`${tab.id}-panel`}
              id={`${tab.id}-tab`}
              className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        <main ref={mainRef} className="data-requests-content" tabIndex="-1">
          {/* Acceso a Datos */}
          <section
            id="access-panel"
            role="tabpanel"
            aria-labelledby="access-tab"
            className={`tab-panel ${activeTab === 'access' ? 'active' : ''}`}
            hidden={activeTab !== 'access'}
          >
            <h2>Acceso a tus Datos Personales</h2>
            <p>
              Tienes derecho a obtener una copia de toda la información personal que tenemos sobre ti.
              Esta información se proporcionará en formato electrónico legible.
            </p>

            <div className="data-types">
              <h3>Tipos de datos que puedes solicitar:</h3>
              <ul>
                <li>Información de tu cuenta (email, nombre de usuario)</li>
                <li>Datos de perfil y preferencias</li>
                <li>Historial de actividad en la plataforma</li>
                <li>Playlists y contenido generado</li>
                <li>Comunicaciones y soporte técnico</li>
                <li>Datos analíticos anonimizados</li>
              </ul>
            </div>

            <div className="request-actions">
              <button
                onClick={handleDataAccess}
                disabled={loading}
                className="btn btn-primary"
                aria-describedby="access-help"
              >
                {loading ? 'Procesando...' : 'Solicitar Acceso a Datos'}
              </button>
              <p id="access-help" className="sr-only">
                Envía una solicitud para obtener una copia completa de tus datos personales
              </p>
            </div>

            <div className="request-info">
              <p><strong>Tiempo de respuesta:</strong> Hasta 30 días</p>
              <p><strong>Formato:</strong> JSON y CSV descargables</p>
              <p><strong>Costo:</strong> Gratuito</p>
            </div>
          </section>

          {/* Portabilidad de Datos */}
          <section
            id="portability-panel"
            role="tabpanel"
            aria-labelledby="portability-tab"
            className={`tab-panel ${activeTab === 'portability' ? 'active' : ''}`}
            hidden={activeTab !== 'portability'}
          >
            <h2>Portabilidad de Datos</h2>
            <p>
              Puedes solicitar que transfiramos tus datos personales a otro servicio o que te
              proporcionemos una copia en formato estructurado y legible por máquina.
            </p>

            <div className="portability-benefits">
              <h3>Beneficios de la portabilidad:</h3>
              <ul>
                <li>Transferir datos a otros servicios musicales</li>
                <li>Respaldar tu información personal</li>
                <li>Analizar tus datos con herramientas propias</li>
                <li>Preservar tu historial musical</li>
              </ul>
            </div>

            <div className="request-actions">
              <button
                onClick={handleDataPortability}
                disabled={loading}
                className="btn btn-primary"
                aria-describedby="portability-help"
              >
                {loading ? 'Procesando...' : 'Solicitar Portabilidad'}
              </button>
              <p id="portability-help" className="sr-only">
                Solicita una copia portable de tus datos para transferirlos a otro servicio
              </p>
            </div>

            <div className="request-info">
              <p><strong>Tiempo de respuesta:</strong> Hasta 30 días</p>
              <p><strong>Formatos:</strong> JSON, CSV, XML</p>
              <p><strong>Costo:</strong> Gratuito</p>
            </div>
          </section>

          {/* Eliminación de Datos */}
          <section
            id="deletion-panel"
            role="tabpanel"
            aria-labelledby="deletion-tab"
            className={`tab-panel ${activeTab === 'deletion' ? 'active' : ''}`}
            hidden={activeTab !== 'deletion'}
          >
            <h2>Eliminación de Cuenta y Datos</h2>
            <p>
              Puedes solicitar la eliminación permanente de tu cuenta y todos los datos personales asociados.
              Esta acción es irreversible y eliminará toda tu información de nuestros sistemas.
            </p>

            <div className="deletion-warning">
              <h3>⚠️ Importante antes de continuar:</h3>
              <ul>
                <li>Esta acción eliminará permanentemente tu cuenta</li>
                <li>Perderás acceso a todas tus playlists y datos</li>
                <li>No podrás recuperar tu información después</li>
                <li>Algunos datos pueden retenerse por requisitos legales</li>
              </ul>
            </div>

            {!showDeleteConfirm ? (
              <div className="request-actions">
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="btn btn-danger"
                  aria-describedby="deletion-start-help"
                >
                  Iniciar Proceso de Eliminación
                </button>
                <p id="deletion-start-help" className="sr-only">
                  Comienza el proceso de eliminación de cuenta con confirmación adicional
                </p>
              </div>
            ) : (
              <div className="deletion-confirmation">
                <p>
                  Para confirmar la eliminación, escribe <strong>"ELIMINAR"</strong> en el campo siguiente:
                </p>
                <input
                  type="text"
                  value={deleteConfirmation}
                  onChange={(e) => setDeleteConfirmation(e.target.value)}
                  placeholder="Escribe ELIMINAR para confirmar"
                  className="confirmation-input"
                  aria-describedby="confirmation-help"
                />
                <p id="confirmation-help" className="sr-only">
                  Campo de confirmación requerido para proceder con la eliminación
                </p>

                <div className="confirmation-actions">
                  <button
                    onClick={handleDataDeletion}
                    disabled={loading || deleteConfirmation !== 'ELIMINAR'}
                    className="btn btn-danger"
                    aria-describedby="confirm-deletion-help"
                  >
                    {loading ? 'Eliminando...' : 'Confirmar Eliminación'}
                  </button>
                  <button
                    onClick={() => {
                      setShowDeleteConfirm(false);
                      setDeleteConfirmation('');
                    }}
                    className="btn btn-secondary"
                  >
                    Cancelar
                  </button>
                </div>
                <p id="confirm-deletion-help" className="sr-only">
                  Confirma la eliminación permanente de tu cuenta y datos
                </p>
              </div>
            )}

            <div className="request-info">
              <p><strong>Tiempo de procesamiento:</strong> Hasta 30 días</p>
              <p><strong>Confirmación:</strong> Email de verificación requerido</p>
              <p><strong>Reversibilidad:</strong> No se puede deshacer</p>
            </div>
          </section>

          {/* Historial de Solicitudes */}
          <section
            id="history-panel"
            role="tabpanel"
            aria-labelledby="history-tab"
            className={`tab-panel ${activeTab === 'history' ? 'active' : ''}`}
            hidden={activeTab !== 'history'}
          >
            <h2>Historial de Solicitudes</h2>

            {requests.length === 0 ? (
              <p>No has realizado solicitudes de datos anteriormente.</p>
            ) : (
              <div className="requests-history">
                <table className="requests-table" role="table" aria-label="Historial de solicitudes de datos">
                  <thead>
                    <tr>
                      <th scope="col">Tipo</th>
                      <th scope="col">Fecha</th>
                      <th scope="col">Estado</th>
                      <th scope="col">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {requests.map((request) => (
                      <tr key={request.id}>
                        <td>{request.type}</td>
                        <td>{new Date(request.createdAt).toLocaleDateString()}</td>
                        <td>
                          <span className={`status status-${request.status.toLowerCase()}`}>
                            {request.status}
                          </span>
                        </td>
                        <td>
                          {request.downloadUrl && (
                            <a
                              href={request.downloadUrl}
                              className="btn btn-small"
                              aria-label={`Descargar datos de solicitud ${request.type}`}
                            >
                              Descargar
                            </a>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </main>

        <footer className="data-requests-footer">
          <p>
            Para más información sobre tus derechos de privacidad, consulta nuestra{' '}
            <Link to="/privacy-policy" aria-label="Ver política de privacidad completa">
              Política de Privacidad
            </Link>.
          </p>
          <p>
            Si tienes preguntas, contacta a nuestro equipo de privacidad:{' '}
            <a href="mailto:privacy@twentyonepilots.com" aria-label="Contactar equipo de privacidad">
              privacy@twentyonepilots.com
            </a>
          </p>
        </footer>
      </div>
    </div>
  );
};

export default DataRequests;