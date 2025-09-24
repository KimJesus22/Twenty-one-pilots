const twoFactorService = require('../services/twoFactorService');
const auditService = require('../services/auditService');

/**
 * Middleware para verificar 2FA cuando está habilitado
 */
const requireTwoFactor = async (req, res, next) => {
  try {
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Skip 2FA for certain routes or if not enabled
    if (!user.twoFactorEnabled) {
      return next();
    }

    // Check if 2FA token is provided
    const { twoFactorToken, backupCode } = req.body;

    if (!twoFactorToken && !backupCode) {
      return res.status(400).json({
        success: false,
        message: '2FA verification required',
        requiresTwoFactor: true
      });
    }

    let isValid = false;

    if (twoFactorToken) {
      // Validate TOTP token format
      if (!twoFactorService.validateTokenFormat(twoFactorToken)) {
        await auditService.log2FAVerification(user._id, false, req.ip, req.get('User-Agent'));
        return res.status(400).json({
          success: false,
          message: 'Invalid 2FA token format'
        });
      }

      // Verify TOTP token
      isValid = twoFactorService.verifyToken(user.twoFactorSecret, twoFactorToken);
    } else if (backupCode) {
      // Verify backup code
      isValid = twoFactorService.verifyBackupCode(user.twoFactorBackupCodes, backupCode);
      if (isValid) {
        await auditService.logBackupCodeUsed(user._id, req.ip, req.get('User-Agent'));
        // Save the updated backup codes (with used code removed)
        await user.save();
      }
    }

    if (!isValid) {
      await auditService.log2FAVerification(user._id, false, req.ip, req.get('User-Agent'));
      return res.status(401).json({
        success: false,
        message: 'Invalid 2FA token or backup code'
      });
    }

    // Log successful 2FA verification
    await auditService.log2FAVerification(user._id, true, req.ip, req.get('User-Agent'));

    next();
  } catch (error) {
    console.error('2FA middleware error:', error);
    res.status(500).json({
      success: false,
      message: '2FA verification error'
    });
  }
};

/**
 * Middleware opcional para 2FA - solo verifica si está presente
 */
const optionalTwoFactor = async (req, res, next) => {
  try {
    const user = req.user;

    if (!user || !user.twoFactorEnabled) {
      return next();
    }

    const { twoFactorToken, backupCode } = req.body;

    // If 2FA is enabled but no token provided, continue without verification
    if (!twoFactorToken && !backupCode) {
      return next();
    }

    let isValid = false;

    if (twoFactorToken && twoFactorService.validateTokenFormat(twoFactorToken)) {
      isValid = twoFactorService.verifyToken(user.twoFactorSecret, twoFactorToken);
    } else if (backupCode) {
      isValid = twoFactorService.verifyBackupCode(user.twoFactorBackupCodes, backupCode);
      if (isValid) {
        await auditService.logBackupCodeUsed(user._id, req.ip, req.get('User-Agent'));
        await user.save();
      }
    }

    if (isValid) {
      await auditService.log2FAVerification(user._id, true, req.ip, req.get('User-Agent'));
      req.twoFactorVerified = true;
    }

    next();
  } catch (error) {
    console.error('Optional 2FA middleware error:', error);
    // Continue without failing for optional 2FA
    next();
  }
};

/**
 * Middleware para rutas que requieren 2FA verificado
 */
const requireTwoFactorVerified = (req, res, next) => {
  if (!req.twoFactorVerified) {
    return res.status(403).json({
      success: false,
      message: '2FA verification required for this action'
    });
  }
  next();
};

module.exports = {
  requireTwoFactor,
  optionalTwoFactor,
  requireTwoFactorVerified
};