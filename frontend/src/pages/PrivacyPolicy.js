import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import useAccessibility from '../hooks/useAccessibility';
import './PrivacyPolicy.css';

const PrivacyPolicy = () => {
  const mainRef = useRef(null);
  const { setInitialFocus, announceToScreenReader } = useAccessibility();

  useEffect(() => {
    // Enfocar el contenido principal al cargar
    setInitialFocus(mainRef.current);

    // Anunciar navegación a lectores de pantalla
    announceToScreenReader('Página de política de privacidad cargada', 'polite');
  }, [setInitialFocus, announceToScreenReader]);

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      announceToScreenReader(`Navegado a sección ${element.querySelector('h2, h3')?.textContent}`, 'polite');
    }
  };

  return (
    <div className="privacy-policy">
      <header className="privacy-header">
        <nav aria-label="Navegación de política de privacidad" className="privacy-nav">
          <Link to="/" className="nav-home-link" aria-label="Volver al inicio">
            ← Volver al Inicio
          </Link>
        </nav>

        <h1 id="privacy-title" className="privacy-title">
          Política de Privacidad
        </h1>
        <p className="privacy-subtitle">
          Tu privacidad es importante para nosotros. Esta política explica cómo recopilamos,
          usamos y protegemos tu información personal.
        </p>
        <p className="privacy-last-updated">
          Última actualización: {new Date().toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </p>
      </header>

      <nav className="privacy-table-of-contents" aria-labelledby="toc-title">
        <h2 id="toc-title" className="sr-only">Tabla de Contenidos</h2>
        <ul>
          <li><button onClick={() => scrollToSection('information-we-collect')} className="toc-link">Información que Recopilamos</button></li>
          <li><button onClick={() => scrollToSection('how-we-use')} className="toc-link">Cómo Usamos tu Información</button></li>
          <li><button onClick={() => scrollToSection('cookies')} className="toc-link">Cookies y Tecnologías Similares</button></li>
          <li><button onClick={() => scrollToSection('data-sharing')} className="toc-link">Compartición de Datos</button></li>
          <li><button onClick={() => scrollToSection('data-security')} className="toc-link">Seguridad de Datos</button></li>
          <li><button onClick={() => scrollToSection('your-rights')} className="toc-link">Tus Derechos</button></li>
          <li><button onClick={() => scrollToSection('data-retention')} className="toc-link">Retención de Datos</button></li>
          <li><button onClick={() => scrollToSection('international-transfers')} className="toc-link">Transferencias Internacionales</button></li>
          <li><button onClick={() => scrollToSection('contact')} className="toc-link">Contacto</button></li>
        </ul>
      </nav>

      <main ref={mainRef} id="main-content" className="privacy-content" role="main" tabIndex="-1">
        <section id="information-we-collect" className="privacy-section">
          <h2>1. Información que Recopilamos</h2>

          <h3>Información que Proporcionas Directamente</h3>
          <ul>
            <li><strong>Información de Cuenta:</strong> Nombre de usuario, dirección de correo electrónico, contraseña</li>
            <li><strong>Información de Perfil:</strong> Preferencias musicales, configuraciones de privacidad</li>
            <li><strong>Contenido Generado:</strong> Comentarios, playlists, interacciones sociales</li>
            <li><strong>Comunicaciones:</strong> Mensajes de soporte, feedback</li>
          </ul>

          <h3>Información Recopilada Automáticamente</h3>
          <ul>
            <li><strong>Datos Técnicos:</strong> Dirección IP, tipo de navegador, sistema operativo</li>
            <li><strong>Datos de Uso:</strong> Páginas visitadas, tiempo en el sitio, clics</li>
            <li><strong>Cookies y Tecnologías Similares:</strong> Ver sección de cookies</li>
          </ul>

          <h3>Información de Terceros</h3>
          <ul>
            <li><strong>Integraciones:</strong> Datos de plataformas musicales (Spotify, YouTube)</li>
            <li><strong>Redes Sociales:</strong> Información pública de perfiles sociales</li>
          </ul>
        </section>

        <section id="how-we-use" className="privacy-section">
          <h2>2. Cómo Usamos tu Información</h2>

          <h3>Propósitos Principales</h3>
          <ul>
            <li><strong>Proporcionar Servicios:</strong> Mantener tu cuenta y acceso a funcionalidades</li>
            <li><strong>Personalización:</strong> Recomendaciones musicales basadas en tus preferencias</li>
            <li><strong>Comunicación:</strong> Enviar actualizaciones importantes y soporte</li>
            <li><strong>Mejora del Servicio:</strong> Análisis de uso para optimizar la experiencia</li>
          </ul>

          <h3>Base Legal para el Procesamiento</h3>
          <ul>
            <li><strong>Consentimiento:</strong> Para cookies no esenciales y comunicaciones de marketing</li>
            <li><strong>Contrato:</strong> Para proporcionar los servicios que has solicitado</li>
            <li><strong>Interés Legítimo:</strong> Para mejorar nuestros servicios y prevenir fraude</li>
            <li><strong>Obligación Legal:</strong> Para cumplir con leyes aplicables</li>
          </ul>
        </section>

        <section id="cookies" className="privacy-section">
          <h2>3. Cookies y Tecnologías Similares</h2>

          <h3>Tipos de Cookies que Utilizamos</h3>

          <div className="cookie-category">
            <h4>Cookies Necesarias</h4>
            <p>Esenciales para el funcionamiento básico del sitio. No se pueden desactivar.</p>
            <ul>
              <li>Autenticación y seguridad de sesión</li>
              <li>Recordar preferencias de idioma</li>
              <li>Prevención de fraudes</li>
            </ul>
          </div>

          <div className="cookie-category">
            <h4>Cookies Analíticas</h4>
            <p>Ayudan a entender cómo los usuarios interactúan con el sitio.</p>
            <ul>
              <li>Número de visitantes y páginas vistas</li>
              <li>Tiempo en el sitio y páginas más populares</li>
              <li>Dispositivo y navegador utilizado</li>
            </ul>
          </div>

          <div className="cookie-category">
            <h4>Cookies de Marketing</h4>
            <p>Se utilizan para mostrar anuncios relevantes y medir efectividad.</p>
            <ul>
              <li>Mostrar anuncios personalizados</li>
              <li>Medir rendimiento de campañas</li>
              <li>Recordar visitas a sitios relacionados</li>
            </ul>
          </div>

          <div className="cookie-category">
            <h4>Cookies Funcionales</h4>
            <p>Mejoran la funcionalidad y personalización del sitio.</p>
            <ul>
              <li>Recordar configuraciones de usuario</li>
              <li>Guardar progreso en formularios</li>
              <li>Personalizar contenido y recomendaciones</li>
            </ul>
          </div>

          <h3>Gestión de Cookies</h3>
          <p>
            Puedes gestionar tus preferencias de cookies en cualquier momento usando
            el banner de cookies en la parte inferior del sitio o visitando la
            <Link to="/cookie-settings" aria-label="Ir a configuración de cookies">Configuración de Cookies</Link>.
          </p>
        </section>

        <section id="data-sharing" className="privacy-section">
          <h2>4. Compartición de Datos</h2>

          <h3>No Vendemos tu Información</h3>
          <p>
            No vendemos, alquilamos ni compartimos tu información personal con terceros
            para fines comerciales sin tu consentimiento explícito.
          </p>

          <h3>Casos en que Compartimos Información</h3>
          <ul>
            <li><strong>Proveedores de Servicios:</strong> Empresas que nos ayudan a operar (hosting, análisis)</li>
            <li><strong>Obligaciones Legales:</strong> Cuando lo requiere la ley o para proteger derechos</li>
            <li><strong>Consentimiento:</strong> Cuando has dado tu permiso explícito</li>
            <li><strong>Transferencias de Negocio:</strong> En caso de fusión o adquisición</li>
          </ul>

          <h3>Proveedores de Servicios</h3>
          <p>Trabajamos con proveedores confiables que han firmado acuerdos de protección de datos:</p>
          <ul>
            <li><strong>Google Cloud Platform:</strong> Hosting y almacenamiento</li>
            <li><strong>Analytics Services:</strong> Análisis de uso (con tu consentimiento)</li>
            <li><strong>Email Services:</strong> Envío de comunicaciones</li>
            <li><strong>CDN Services:</strong> Distribución de contenido</li>
          </ul>
        </section>

        <section id="data-security" className="privacy-section">
          <h2>5. Seguridad de Datos</h2>

          <h3>Medidas de Seguridad</h3>
          <ul>
            <li><strong>Encriptación:</strong> Todos los datos en tránsito y en reposo</li>
            <li><strong>Acceso Restringido:</strong> Solo personal autorizado puede acceder a datos</li>
            <li><strong>Monitoreo Continuo:</strong> Detección de amenazas y vulnerabilidades</li>
            <li><strong>Actualizaciones Regulares:</strong> Software y sistemas actualizados</li>
            <li><strong>Copias de Seguridad:</strong> Respaldos seguros y encriptados</li>
          </ul>

          <h3>Protección contra Brechas</h3>
          <p>
            En caso de una brecha de seguridad, notificaremos a las autoridades competentes
            y a los usuarios afectados dentro de 72 horas, según lo requiere la ley.
          </p>
        </section>

        <section id="your-rights" className="privacy-section">
          <h2>6. Tus Derechos</h2>

          <p>Bajo GDPR y CCPA, tienes los siguientes derechos:</p>

          <h3>Derecho de Acceso</h3>
          <p>
            Puedes solicitar una copia de toda tu información personal que tenemos.
            Te proporcionaremos esta información en formato electrónico dentro de 30 días.
          </p>

          <h3>Derecho de Rectificación</h3>
          <p>
            Puedes corregir información inexacta o incompleta contactándonos.
          </p>

          <h3>Derecho de Eliminación</h3>
          <p>
            Puedes solicitar la eliminación de tus datos personales. Procesaremos
            esta solicitud dentro de 30 días, salvo excepciones legales.
          </p>

          <h3>Derecho a la Portabilidad</h3>
          <p>
            Puedes obtener tus datos en formato estructurado y legible por máquina.
          </p>

          <h3>Derecho de Oposición</h3>
          <p>
            Puedes oponerte al procesamiento de tus datos para fines de marketing directo.
          </p>

          <h3>Derecho a Restringir el Procesamiento</h3>
          <p>
            Puedes solicitar que limitemos el procesamiento de tus datos en ciertas circunstancias.
          </p>

          <h3>¿Cómo Ejercer tus Derechos?</h3>
          <p>
            Para ejercer cualquiera de estos derechos, contacta con nuestro
            <Link to="/data-requests" aria-label="Ir a solicitudes de datos">formulario de solicitudes de datos</Link>
            o envía un email a privacy@twentyonepilots.com.
          </p>
        </section>

        <section id="data-retention" className="privacy-section">
          <h2>7. Retención de Datos</h2>

          <h3>Períodos de Retención</h3>
          <ul>
            <li><strong>Datos de Cuenta:</strong> Mientras la cuenta esté activa o según sea necesario para proporcionar servicios</li>
            <li><strong>Datos Analíticos:</strong> 26 meses para análisis de tendencias</li>
            <li><strong>Logs de Seguridad:</strong> 7 años para cumplimiento legal</li>
            <li><strong>Datos de Marketing:</strong> 3 años desde último contacto</li>
          </ul>

          <h3>Criterios para Determinación</h3>
          <p>
            Los períodos de retención se determinan basándose en:
          </p>
          <ul>
            <li>Propósito del procesamiento de datos</li>
            <li>Naturaleza de los datos recopilados</li>
            <li>Requisitos legales aplicables</li>
            <li>Riesgos potenciales asociados</li>
          </ul>
        </section>

        <section id="international-transfers" className="privacy-section">
          <h2>8. Transferencias Internacionales</h2>

          <p>
            Operamos globalmente y tus datos pueden transferirse a países fuera
            de tu jurisdicción. Cuando esto ocurre, implementamos medidas de
            protección adecuadas:
          </p>

          <ul>
            <li><strong>Cláusulas Contractuales Estándar:</strong> Aprobadas por la Comisión Europea</li>
            <li><strong>Escudos de Privacidad:</strong> Para transferencias a EE.UU.</li>
            <li><strong>Certificaciones:</strong> Cumplimiento con marcos reconocidos</li>
            <li><strong>Encriptación:</strong> Protección durante la transferencia</li>
          </ul>
        </section>

        <section id="contact" className="privacy-section">
          <h2>9. Contacto</h2>

          <p>
            Si tienes preguntas sobre esta política de privacidad o deseas ejercer
            tus derechos, puedes contactarnos:
          </p>

          <div className="contact-info">
            <p><strong>Email:</strong> privacy@twentyonepilots.com</p>
            <p><strong>Dirección:</strong> [Dirección de la empresa]</p>
            <p><strong>Teléfono:</strong> [Número de contacto]</p>
          </div>

          <p>
            Responderemos a tu consulta dentro de 30 días hábiles.
          </p>

          <h3>Responsable de Protección de Datos</h3>
          <p>
            Nuestro Data Protection Officer (DPO) puede ser contactado en:
            dpo@twentyonepilots.com
          </p>
        </section>

        <section className="privacy-updates">
          <h2>Actualizaciones de esta Política</h2>
          <p>
            Podemos actualizar esta política de privacidad ocasionalmente.
            Te notificaremos sobre cambios significativos mediante:
          </p>
          <ul>
            <li>Email a la dirección registrada</li>
            <li>Notificación destacada en el sitio web</li>
            <li>Actualización de la fecha "Última actualización"</li>
          </ul>
          <p>
            El uso continuado del servicio después de cambios constituye
            aceptación de la política actualizada.
          </p>
        </section>
      </main>

      <footer className="privacy-footer" role="contentinfo">
        <nav aria-label="Enlaces relacionados con privacidad">
          <ul className="privacy-footer-links">
            <li><Link to="/terms" aria-label="Ver términos y condiciones">Términos y Condiciones</Link></li>
            <li><Link to="/cookie-settings" aria-label="Gestionar configuración de cookies">Configuración de Cookies</Link></li>
            <li><Link to="/data-requests" aria-label="Solicitar gestión de datos">Solicitudes de Datos</Link></li>
            <li><a href="mailto:privacy@twentyonepilots.com" aria-label="Contactar al equipo de privacidad">Contacto</a></li>
          </ul>
        </nav>
        <p className="privacy-copyright">
          © {new Date().getFullYear()} Twenty One Pilots. Todos los derechos reservados.
        </p>
      </footer>
    </div>
  );
};

export default PrivacyPolicy;