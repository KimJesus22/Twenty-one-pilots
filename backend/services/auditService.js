const fs = require('fs').promises;
const path = require('path');

class AuditService {
  constructor() {
    this.auditLogPath = path.join(process.cwd(), 'logs', 'audit.log');
    this.ensureLogDirectory();
  }

  async ensureLogDirectory() {
    const logDir = path.dirname(this.auditLogPath);
    try {
      await fs.access(logDir);
    } catch {
      await fs.mkdir(logDir, { recursive: true });
    }
  }

  async log(event, details = {}) {
    const auditEntry = {
      timestamp: new Date().toISOString(),
      event: event,
      ...details,
      ip: details.ip || 'unknown',
      userAgent: details.userAgent || 'unknown'
    };

    const logLine = JSON.stringify(auditEntry) + '\n';

    try {
      await fs.appendFile(this.auditLogPath, logLine);
    } catch (error) {
      console.error('Failed to write audit log:', error);
    }

    // Also log to console for immediate visibility
    console.log(`[AUDIT] ${event}:`, auditEntry);
  }

  // Authentication events
  async logLoginSuccess(userId, ip, userAgent) {
    await this.log('LOGIN_SUCCESS', { userId, ip, userAgent });
  }

  async logLoginFailure(email, reason, ip, userAgent) {
    await this.log('LOGIN_FAILURE', { email, reason, ip, userAgent });
  }

  async logLogout(userId, ip, userAgent) {
    await this.log('LOGOUT', { userId, ip, userAgent });
  }

  // 2FA events
  async log2FAEnabled(userId, ip, userAgent) {
    await this.log('2FA_ENABLED', { userId, ip, userAgent });
  }

  async log2FADisabled(userId, ip, userAgent) {
    await this.log('2FA_DISABLED', { userId, ip, userAgent });
  }

  async log2FAVerification(userId, success, ip, userAgent) {
    await this.log(success ? '2FA_VERIFICATION_SUCCESS' : '2FA_VERIFICATION_FAILURE',
      { userId, success, ip, userAgent });
  }

  async logBackupCodeUsed(userId, ip, userAgent) {
    await this.log('BACKUP_CODE_USED', { userId, ip, userAgent });
  }

  // Authorization events
  async logPermissionGranted(userId, targetUserId, resource, action, ip, userAgent) {
    await this.log('PERMISSION_GRANTED', { userId, targetUserId, resource, action, ip, userAgent });
  }

  async logPermissionRevoked(userId, targetUserId, resource, action, ip, userAgent) {
    await this.log('PERMISSION_REVOKED', { userId, targetUserId, resource, action, ip, userAgent });
  }

  async logUnauthorizedAccess(userId, resource, action, ip, userAgent) {
    await this.log('UNAUTHORIZED_ACCESS', { userId, resource, action, ip, userAgent });
  }

  // Account security events
  async logPasswordChange(userId, ip, userAgent) {
    await this.log('PASSWORD_CHANGED', { userId, ip, userAgent });
  }

  async logAccountLocked(userId, reason, ip, userAgent) {
    await this.log('ACCOUNT_LOCKED', { userId, reason, ip, userAgent });
  }

  async logAccountUnlocked(userId, ip, userAgent) {
    await this.log('ACCOUNT_UNLOCKED', { userId, ip, userAgent });
  }

  // Administrative events
  async logRoleChanged(adminId, targetUserId, oldRole, newRole, ip, userAgent) {
    await this.log('ROLE_CHANGED', { adminId, targetUserId, oldRole, newRole, ip, userAgent });
  }

  async logUserCreated(adminId, newUserId, ip, userAgent) {
    await this.log('USER_CREATED', { adminId, newUserId, ip, userAgent });
  }

  async logUserDeleted(adminId, deletedUserId, ip, userAgent) {
    await this.log('USER_DELETED', { adminId, deletedUserId, ip, userAgent });
  }

  // System events
  async logSecurityAlert(alertType, details, ip, userAgent) {
    await this.log('SECURITY_ALERT', { alertType, details, ip, userAgent });
  }

  async logSuspiciousActivity(userId, activity, ip, userAgent) {
    await this.log('SUSPICIOUS_ACTIVITY', { userId, activity, ip, userAgent });
  }

  // API access events
  async logApiAccess(userId, method, endpoint, statusCode, responseTime, ip, userAgent) {
    await this.log('API_ACCESS', {
      userId,
      method,
      endpoint,
      statusCode,
      responseTime,
      ip,
      userAgent
    });
  }

  // Deployment events
  async logDeploymentStart(userId, environment, version, ip, userAgent) {
    await this.log('DEPLOYMENT_START', { userId, environment, version, ip, userAgent });
  }

  async logDeploymentSuccess(userId, environment, version, duration, ip, userAgent) {
    await this.log('DEPLOYMENT_SUCCESS', { userId, environment, version, duration, ip, userAgent });
  }

  async logDeploymentFailure(userId, environment, version, error, ip, userAgent) {
    await this.log('DEPLOYMENT_FAILURE', { userId, environment, version, error, ip, userAgent });
  }

  // Security monitoring events
  async logSecurityAlert(alertType, severity, details, ip, userAgent) {
    await this.log('SECURITY_ALERT', {
      alertType,
      severity,
      details,
      ip,
      userAgent,
      requiresAttention: severity === 'critical' || severity === 'high'
    });
  }

  async logSuspiciousActivity(userId, activityType, details, ip, userAgent) {
    await this.log('SUSPICIOUS_ACTIVITY', {
      userId,
      activityType,
      details,
      ip,
      userAgent,
      riskLevel: this.calculateRiskLevel(activityType, details)
    });
  }

  // RBAC events
  async logRoleAssignment(adminId, targetUserId, role, ip, userAgent) {
    await this.log('ROLE_ASSIGNMENT', { adminId, targetUserId, role, ip, userAgent });
  }

  async logRoleRevocation(adminId, targetUserId, role, ip, userAgent) {
    await this.log('ROLE_REVOCATION', { adminId, targetUserId, role, ip, userAgent });
  }

  async logPermissionChange(adminId, targetUserId, resource, action, changeType, ip, userAgent) {
    await this.log('PERMISSION_CHANGE', {
      adminId,
      targetUserId,
      resource,
      action,
      changeType, // 'granted' or 'revoked'
      ip,
      userAgent
    });
  }

  // System security events
  async logRateLimitExceeded(identifier, endpoint, ip, userAgent) {
    await this.log('RATE_LIMIT_EXCEEDED', { identifier, endpoint, ip, userAgent });
  }

  async logBlockedIP(ip, reason, userAgent) {
    await this.log('IP_BLOCKED', { ip, reason, userAgent });
  }

  async logFailedSecurityCheck(checkType, details, ip, userAgent) {
    await this.log('SECURITY_CHECK_FAILED', { checkType, details, ip, userAgent });
  }

  // Calculate risk level for suspicious activities
  calculateRiskLevel(activityType, details) {
    const riskLevels = {
      'multiple_failed_logins': 'medium',
      'unusual_login_time': 'low',
      'unusual_login_location': 'medium',
      'password_brute_force': 'high',
      'suspicious_api_calls': 'medium',
      'privilege_escalation_attempt': 'critical',
      'data_exfiltration_attempt': 'critical'
    };

    return riskLevels[activityType] || 'low';
  }

  // Get security metrics for monitoring
  async getSecurityMetrics(timeRange = '24h') {
    try {
      const logs = await this.getAuditLogs();

      // Calculate time range
      const now = new Date();
      const timeRangeMs = this.parseTimeRange(timeRange);
      const startTime = new Date(now.getTime() - timeRangeMs);

      const relevantLogs = logs.filter(log =>
        new Date(log.timestamp) >= startTime
      );

      // Calculate metrics
      const metrics = {
        totalEvents: relevantLogs.length,
        securityEvents: relevantLogs.filter(log =>
          ['SECURITY_ALERT', 'SUSPICIOUS_ACTIVITY', 'SECURITY_CHECK_FAILED'].includes(log.event)
        ).length,
        authEvents: relevantLogs.filter(log =>
          log.event.includes('LOGIN') || log.event.includes('2FA')
        ).length,
        adminEvents: relevantLogs.filter(log =>
          log.event.includes('ADMIN') || log.event.includes('PERMISSION') || log.event.includes('ROLE')
        ).length,
        failedLogins: relevantLogs.filter(log => log.event === 'LOGIN_FAILURE').length,
        successfulLogins: relevantLogs.filter(log => log.event === 'LOGIN_SUCCESS').length,
        twoFactorVerifications: relevantLogs.filter(log =>
          log.event.includes('2FA_VERIFICATION')
        ).length,
        deploymentEvents: relevantLogs.filter(log =>
          log.event.includes('DEPLOYMENT')
        ).length,
        topFailingIPs: this.getTopFailingIPs(relevantLogs),
        recentAlerts: relevantLogs.filter(log =>
          log.event === 'SECURITY_ALERT' && log.requiresAttention
        ).slice(0, 10)
      };

      return metrics;
    } catch (error) {
      console.error('Error calculating security metrics:', error);
      return {};
    }
  }

  parseTimeRange(timeRange) {
    const unit = timeRange.slice(-1);
    const value = parseInt(timeRange.slice(0, -1));

    const multipliers = {
      'h': 60 * 60 * 1000,
      'd': 24 * 60 * 60 * 1000,
      'w': 7 * 24 * 60 * 60 * 1000
    };

    return value * (multipliers[unit] || 60 * 60 * 1000); // default to 1 hour
  }

  getTopFailingIPs(logs) {
    const ipCounts = {};

    logs.filter(log => log.event === 'LOGIN_FAILURE').forEach(log => {
      const ip = log.ip || 'unknown';
      ipCounts[ip] = (ipCounts[ip] || 0) + 1;
    });

    return Object.entries(ipCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([ip, count]) => ({ ip, count }));
  }

  // Export audit logs for compliance
  async exportAuditLogs(format = 'json', filters = {}) {
    try {
      const logs = await this.getAuditLogs(filters);

      switch (format) {
        case 'csv':
          return this.convertToCSV(logs);
        case 'json':
        default:
          return JSON.stringify(logs, null, 2);
      }
    } catch (error) {
      console.error('Error exporting audit logs:', error);
      throw new Error('Failed to export audit logs');
    }
  }

  convertToCSV(logs) {
    if (logs.length === 0) return '';

    const headers = Object.keys(logs[0]);
    const csvRows = [headers.join(',')];

    logs.forEach(log => {
      const row = headers.map(header => {
        const value = log[header];
        // Escape commas and quotes in CSV
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value || '';
      });
      csvRows.push(row.join(','));
    });

    return csvRows.join('\n');
  }

  // Query audit logs
  async getAuditLogs(filters = {}) {
    try {
      const logContent = await fs.readFile(this.auditLogPath, 'utf8');
      const logs = logContent.trim().split('\n').map(line => {
        try {
          return JSON.parse(line);
        } catch {
          return null;
        }
      }).filter(Boolean);

      // Apply filters
      let filteredLogs = logs;

      if (filters.event) {
        filteredLogs = filteredLogs.filter(log => log.event === filters.event);
      }

      if (filters.userId) {
        filteredLogs = filteredLogs.filter(log => log.userId === filters.userId);
      }

      if (filters.startDate) {
        filteredLogs = filteredLogs.filter(log => new Date(log.timestamp) >= new Date(filters.startDate));
      }

      if (filters.endDate) {
        filteredLogs = filteredLogs.filter(log => new Date(log.timestamp) <= new Date(filters.endDate));
      }

      return filteredLogs;
    } catch (error) {
      console.error('Failed to read audit logs:', error);
      return [];
    }
  }
}

module.exports = new AuditService();