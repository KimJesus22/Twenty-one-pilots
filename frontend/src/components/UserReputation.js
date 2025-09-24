import React from 'react';
import { useTranslation } from 'react-i18next';
import ForumUtils from '../utils/forumUtils';
import './UserReputation.css';

const UserReputation = ({ userStats, showDetails = false, compact = false }) => {
  const { t } = useTranslation();

  if (!userStats) return null;

  const reputation = ForumUtils.calculateReputation(userStats);
  const primaryBadge = ForumUtils.getPrimaryBadge(userStats);
  const nextBadge = ForumUtils.getNextBadge(userStats);
  const allBadges = ForumUtils.getUserBadges(userStats);

  if (compact) {
    return (
      <div className="user-reputation-compact">
        {primaryBadge && (
          <div className="primary-badge" title={t(primaryBadge.description)}>
            <span className="badge-icon">{primaryBadge.icon}</span>
            <span className="reputation-points">{reputation}</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="user-reputation">
      <div className="reputation-header">
        <h3>{t('forum.reputation.points')}</h3>
        <div className="reputation-score">
          <span className="score-number">{reputation}</span>
          <span className="score-label">{t('forum.reputation.points')}</span>
        </div>
      </div>

      {primaryBadge && (
        <div className="primary-badge-section">
          <h4>{t('forum.reputation.level')}</h4>
          <div className="primary-badge-display">
            <span className="badge-icon">{primaryBadge.icon}</span>
            <div className="badge-info">
              <span className="badge-name">{t(primaryBadge.name)}</span>
              <span className="badge-desc">{t(primaryBadge.description)}</span>
            </div>
          </div>
        </div>
      )}

      {nextBadge && (
        <div className="next-badge-section">
          <h4>{t('forum.reputation.nextBadge')}</h4>
          <div className="next-badge-display">
            <span className="badge-icon">{nextBadge.icon}</span>
            <div className="badge-info">
              <span className="badge-name">{t(nextBadge.name)}</span>
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{
                    width: `${Math.min(100, (reputation / nextBadge.minPoints) * 100)}%`
                  }}
                ></div>
              </div>
              <span className="points-needed">
                {nextBadge.minPoints - reputation} {t('forum.reputation.pointsToNext')}
              </span>
            </div>
          </div>
        </div>
      )}

      {showDetails && (
        <div className="reputation-details">
          <h4>{t('forum.reputation.stats')}</h4>
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-label">{t('forum.reputation.stats.threadsCreated')}</span>
              <span className="stat-value">{userStats.threadsCreated || 0}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">{t('forum.reputation.stats.commentsCreated')}</span>
              <span className="stat-value">{userStats.commentsCreated || 0}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">{t('forum.reputation.stats.likesReceived')}</span>
              <span className="stat-value">{userStats.likesReceived || 0}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">{t('forum.reputation.stats.helpfulComments')}</span>
              <span className="stat-value">{userStats.helpfulComments || 0}</span>
            </div>
          </div>
        </div>
      )}

      <div className="badges-section">
        <h4>{t('forum.reputation.badges')}</h4>
        <div className="badges-grid">
          {allBadges.map((badge) => (
            <div
              key={badge.key}
              className={`badge-item ${badge.unlocked ? 'unlocked' : 'locked'}`}
              title={t(badge.description)}
            >
              <span className="badge-icon">{badge.icon}</span>
              <span className="badge-name">{t(badge.name)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default UserReputation;