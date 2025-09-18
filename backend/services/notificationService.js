const nodemailer = require('nodemailer');
const admin = require('firebase-admin');

// Configurar Firebase Admin SDK (se inicializará cuando se configure)
let firebaseInitialized = false;

class NotificationService {
  constructor() {
    this.emailTransporter = null;
    this.initEmailService();
  }

  // Inicializar servicio de email
  initEmailService() {
    // Configuración básica para desarrollo (usar servicios como Gmail, SendGrid, etc.)
    this.emailTransporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: process.env.EMAIL_PORT || 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
  }

  // Inicializar Firebase para push notifications
  initFirebase() {
    if (!firebaseInitialized && process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      try {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);

        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          projectId: process.env.FIREBASE_PROJECT_ID
        });

        firebaseInitialized = true;
        console.log('Firebase inicializado correctamente');
      } catch (error) {
        console.error('Error inicializando Firebase:', error.message);
      }
    }
  }

  // Enviar email de bienvenida
  async sendWelcomeEmail(user) {
    try {
      if (!this.emailTransporter) {
        console.warn('Servicio de email no configurado');
        return false;
      }

      const mailOptions = {
        from: process.env.EMAIL_FROM || 'noreply@twentyonepilots.app',
        to: user.email,
        subject: '¡Bienvenido a Twenty One Pilots Fan App!',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #ff0000; text-align: center;">¡Hola ${user.username}!</h1>
            <p style="font-size: 16px; line-height: 1.6;">
              Bienvenido a la comunidad de fans de Twenty One Pilots.
              Explora la discografía completa, crea playlists, conecta con otros fans y
              mantente al día con las últimas noticias.
            </p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}"
                 style="background-color: #ff0000; color: white; padding: 12px 24px;
                        text-decoration: none; border-radius: 6px; font-weight: bold;">
                Explorar la App
              </a>
            </div>
            <p style="color: #666; font-size: 14px;">
              Si tienes alguna pregunta, no dudes en contactarnos.
            </p>
          </div>
        `
      };

      await this.emailTransporter.sendMail(mailOptions);
      console.log(`Email de bienvenida enviado a ${user.email}`);
      return true;
    } catch (error) {
      console.error('Error enviando email de bienvenida:', error);
      return false;
    }
  }

  // Enviar notificación de nuevo concierto
  async sendConcertNotification(user, concert) {
    try {
      if (!this.emailTransporter) return false;

      const mailOptions = {
        from: process.env.EMAIL_FROM || 'noreply@twentyonepilots.app',
        to: user.email,
        subject: `🎪 Nuevo concierto de Twenty One Pilots: ${concert.name}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #ff0000;">¡Nuevo Concierto Disponible!</h2>
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3>${concert.name}</h3>
              <p><strong>📅 Fecha:</strong> ${new Date(concert.start_date).toLocaleDateString()}</p>
              <p><strong>📍 Lugar:</strong> ${concert.venue_name || 'Por confirmar'}</p>
              <p><strong>🏙️ Ciudad:</strong> ${concert.city || 'Por confirmar'}</p>
            </div>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${concert.url || process.env.FRONTEND_URL + '/concerts'}"
                 style="background-color: #ff0000; color: white; padding: 12px 24px;
                        text-decoration: none; border-radius: 6px; font-weight: bold;">
                Ver Detalles y Comprar
              </a>
            </div>
          </div>
        `
      };

      await this.emailTransporter.sendMail(mailOptions);
      return true;
    } catch (error) {
      console.error('Error enviando notificación de concierto:', error);
      return false;
    }
  }

  // Enviar notificación push
  async sendPushNotification(token, title, body, data = {}) {
    try {
      if (!firebaseInitialized) {
        this.initFirebase();
      }

      if (!firebaseInitialized) {
        console.warn('Firebase no inicializado - push notification no enviada');
        return false;
      }

      const message = {
        notification: {
          title,
          body
        },
        data: {
          ...data,
          click_action: 'FLUTTER_NOTIFICATION_CLICK'
        },
        token
      };

      const response = await admin.messaging().send(message);
      console.log('Push notification enviada:', response);
      return true;
    } catch (error) {
      console.error('Error enviando push notification:', error);
      return false;
    }
  }

  // Enviar notificación de playlist compartida
  async sendPlaylistSharedNotification(user, playlist, sharer) {
    try {
      if (!this.emailTransporter) return false;

      const mailOptions = {
        from: process.env.EMAIL_FROM || 'noreply@twentyonepilots.app',
        to: user.email,
        subject: `🎵 ${sharer.username} te compartió una playlist`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #ff0000;">¡Nueva Playlist Compartida!</h2>
            <p><strong>${sharer.username}</strong> te compartió la playlist:</p>
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3>${playlist.name}</h3>
              <p>${playlist.description || 'Sin descripción'}</p>
              <p><strong>🎵 Canciones:</strong> ${playlist.songs?.length || 0}</p>
            </div>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL}/playlists/shared/${playlist.shareUrl}"
                 style="background-color: #ff0000; color: white; padding: 12px 24px;
                        text-decoration: none; border-radius: 6px; font-weight: bold;">
                Ver Playlist
              </a>
            </div>
          </div>
        `
      };

      await this.emailTransporter.sendMail(mailOptions);
      return true;
    } catch (error) {
      console.error('Error enviando notificación de playlist compartida:', error);
      return false;
    }
  }

  // Notificar a seguidores sobre nueva playlist pública
  async notifyFollowersOfNewPlaylist(playlist, creator) {
    try {
      // En un escenario real, obtendrías los seguidores de la base de datos
      // Por ahora, simulamos enviando a algunos usuarios
      const mockFollowers = [
        { email: 'follower1@example.com', username: 'Fan1' },
        { email: 'follower2@example.com', username: 'Fan2' }
      ];

      for (const follower of mockFollowers) {
        await this.sendPlaylistSharedNotification(follower, playlist, creator);
      }

      return true;
    } catch (error) {
      console.error('Error notificando seguidores:', error);
      return false;
    }
  }
}

module.exports = new NotificationService();