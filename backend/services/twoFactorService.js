const speakeasy = require('speakeasy');
const qrcode = require('qrcode');
const cryptoRandomString = require('crypto-random-string');

class TwoFactorService {
  /**
   * Genera un secret para 2FA y el código QR
   */
  async generateSecret(username) {
    const secret = speakeasy.generateSecret({
      name: `Twenty One Pilots App (${username})`,
      issuer: 'Twenty One Pilots',
      length: 32
    });

    const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url);

    return {
      secret: secret.base32,
      qrCode: qrCodeUrl,
      otpauth_url: secret.otpauth_url
    };
  }

  /**
   * Verifica un token TOTP
   */
  verifyToken(secret, token, window = 2) {
    return speakeasy.totp.verify({
      secret: secret,
      encoding: 'base32',
      token: token,
      window: window // Permite +/- 2 tokens de tolerancia
    });
  }

  /**
   * Genera códigos de respaldo
   */
  generateBackupCodes(count = 10) {
    const codes = [];
    for (let i = 0; i < count; i++) {
      codes.push(cryptoRandomString({ length: 10, type: 'alphanumeric' }));
    }
    return codes;
  }

  /**
   * Verifica un código de respaldo
   */
  verifyBackupCode(backupCodes, code) {
    const index = backupCodes.indexOf(code);
    if (index === -1) return false;

    // Remover el código usado (one-time use)
    backupCodes.splice(index, 1);
    return true;
  }

  /**
   * Valida el formato del token TOTP
   */
  validateTokenFormat(token) {
    return /^\d{6}$/.test(token);
  }

  /**
   * Obtiene información del secret
   */
  getSecretInfo(secret) {
    return speakeasy.otpauthURL({
      secret: secret,
      label: 'Twenty One Pilots App',
      issuer: 'Twenty One Pilots',
      encoding: 'base32'
    });
  }
}

module.exports = new TwoFactorService();