const request = require('request');
const auditService = require('./auditService');

class RecaptchaService {
  constructor() {
    this.secretKey = process.env.RECAPTCHA_SECRET_KEY;
    this.siteKey = process.env.RECAPTCHA_SITE_KEY;
    this.verifyUrl = 'https://www.google.com/recaptcha/api/siteverify';
    this.minimumScore = parseFloat(process.env.RECAPTCHA_MINIMUM_SCORE || '0.5');
  }

  /**
   * Verifica un token reCAPTCHA v3
   * @param {string} token - Token reCAPTCHA del frontend
   * @param {string} action - Acción esperada (opcional)
   * @param {string} ip - IP del cliente
   * @param {string} userAgent - User-Agent del cliente
   * @returns {Promise<Object>} Resultado de la verificación
   */
  async verifyToken(token, action = null, ip = null, userAgent = null) {
    try {
      if (!this.secretKey) {
        console.warn('RECAPTCHA_SECRET_KEY not configured, skipping verification');
        return { success: true, score: 1.0, action: 'bypass' };
      }

      if (!token) {
        await auditService.logSecurityAlert(
          'recaptcha_missing_token',
          'low',
          { action, ip, userAgent },
          ip,
          userAgent
        );
        return {
          success: false,
          error: 'Token reCAPTCHA requerido',
          score: 0
        };
      }

      const verificationResult = await this._verifyWithGoogle(token);

      // Log verification result
      await auditService.log('RECAPTCHA_VERIFICATION', {
        success: verificationResult.success,
        score: verificationResult.score,
        action: verificationResult.action,
        expectedAction: action,
        ip,
        userAgent,
        riskLevel: this._calculateRiskLevel(verificationResult.score)
      });

      // Check minimum score
      if (verificationResult.success && verificationResult.score < this.minimumScore) {
        await auditService.logSecurityAlert(
          'recaptcha_low_score',
          'medium',
          {
            score: verificationResult.score,
            minimumScore: this.minimumScore,
            action,
            ip,
            userAgent
          },
          ip,
          userAgent
        );

        return {
          success: false,
          error: `Puntuación reCAPTCHA insuficiente: ${verificationResult.score}`,
          score: verificationResult.score
        };
      }

      // Check action if specified
      if (action && verificationResult.action !== action) {
        await auditService.logSecurityAlert(
          'recaptcha_action_mismatch',
          'medium',
          {
            expectedAction: action,
            receivedAction: verificationResult.action,
            score: verificationResult.score,
            ip,
            userAgent
          },
          ip,
          userAgent
        );

        return {
          success: false,
          error: `Acción reCAPTCHA no coincide: esperado '${action}', recibido '${verificationResult.action}'`,
          score: verificationResult.score
        };
      }

      return verificationResult;

    } catch (error) {
      console.error('Error verifying reCAPTCHA token:', error);
      await auditService.logSecurityAlert(
        'recaptcha_verification_error',
        'high',
        { error: error.message, token: token.substring(0, 10) + '...', ip, userAgent },
        ip,
        userAgent
      );

      return {
        success: false,
        error: 'Error interno en verificación reCAPTCHA',
        score: 0
      };
    }
  }

  /**
   * Verifica token con Google reCAPTCHA API
   * @private
   */
  _verifyWithGoogle(token) {
    return new Promise((resolve, reject) => {
      const options = {
        url: this.verifyUrl,
        method: 'POST',
        form: {
          secret: this.secretKey,
          response: token
        },
        json: true,
        timeout: 10000 // 10 seconds timeout
      };

      request(options, (error, response, body) => {
        if (error) {
          return reject(new Error(`Request failed: ${error.message}`));
        }

        if (response.statusCode !== 200) {
          return reject(new Error(`Google API returned status ${response.statusCode}`));
        }

        if (!body || typeof body !== 'object') {
          return reject(new Error('Invalid response from Google API'));
        }

        resolve({
          success: body.success === true,
          score: body.score || 0,
          action: body.action || null,
          challengeTs: body.challenge_ts,
          hostname: body.hostname,
          errorCodes: body['error-codes'] || []
        });
      });
    });
  }

  /**
   * Calcula el nivel de riesgo basado en la puntuación
   * @private
   */
  _calculateRiskLevel(score) {
    if (score >= 0.9) return 'very_low';
    if (score >= 0.7) return 'low';
    if (score >= 0.5) return 'medium';
    if (score >= 0.3) return 'high';
    return 'very_high';
  }

  /**
   * Obtiene estadísticas de reCAPTCHA
   */
  async getStatistics(timeRange = '24h') {
    try {
      const logs = await auditService.getAuditLogs({ event: 'RECAPTCHA_VERIFICATION' });

      const stats = {
        totalVerifications: logs.length,
        successfulVerifications: logs.filter(log => log.success).length,
        failedVerifications: logs.filter(log => !log.success).length,
        averageScore: 0,
        riskDistribution: {
          very_low: 0,
          low: 0,
          medium: 0,
          high: 0,
          very_high: 0
        },
        recentFailures: []
      };

      if (logs.length > 0) {
        const scores = logs.map(log => log.score || 0).filter(score => score > 0);
        stats.averageScore = scores.length > 0 ?
          scores.reduce((sum, score) => sum + score, 0) / scores.length : 0;

        logs.forEach(log => {
          if (log.riskLevel) {
            stats.riskDistribution[log.riskLevel]++;
          }
        });

        // Recent failures (last 10)
        stats.recentFailures = logs
          .filter(log => !log.success)
          .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
          .slice(0, 10)
          .map(log => ({
            timestamp: log.timestamp,
            score: log.score,
            ip: log.ip,
            error: log.error
          }));
      }

      return stats;
    } catch (error) {
      console.error('Error getting reCAPTCHA statistics:', error);
      return {};
    }
  }

  /**
   * Valida configuración de reCAPTCHA
   */
  validateConfiguration() {
    const issues = [];

    if (!this.secretKey) {
      issues.push('RECAPTCHA_SECRET_KEY no configurada');
    }

    if (!this.siteKey) {
      issues.push('RECAPTCHA_SITE_KEY no configurada');
    }

    if (this.minimumScore < 0 || this.minimumScore > 1) {
      issues.push('RECAPTCHA_MINIMUM_SCORE debe estar entre 0 y 1');
    }

    return {
      valid: issues.length === 0,
      issues,
      configuration: {
        secretKeyConfigured: !!this.secretKey,
        siteKeyConfigured: !!this.siteKey,
        minimumScore: this.minimumScore,
        verifyUrl: this.verifyUrl
      }
    };
  }

  /**
   * Obtiene la clave del sitio para el frontend
   */
  getSiteKey() {
    return this.siteKey;
  }
}

module.exports = new RecaptchaService();