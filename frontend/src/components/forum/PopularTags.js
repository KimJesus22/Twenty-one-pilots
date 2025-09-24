import React, { memo } from 'react';
import { useTranslation } from 'react-i18next';

const PopularTags = memo(({
  tags,
  selectedTags = [],
  onTagClick,
  onTagRemove,
  maxDisplay = 10,
  showAll = false,
  t
}) => {
  if (!tags || tags.length === 0) {
    return (
      <div className="popular-tags">
        <h4>{t('forum.popularTags')}</h4>
        <p className="no-tags">{t('common.loading')}</p>
      </div>
    );
  }

  const displayTags = showAll ? tags : tags.slice(0, maxDisplay);
  const hasMore = !showAll && tags.length > maxDisplay;

  return (
    <div className="popular-tags">
      <h4>{t('forum.popularTags')}</h4>

      {/* Tags seleccionados */}
      {selectedTags.length > 0 && (
        <div className="selected-tags">
          <span className="selected-label">{t('forum.filterBy')}:</span>
          {selectedTags.map(tag => (
            <span key={tag} className="selected-tag">
              #{tag}
              <button
                onClick={() => onTagRemove(tag)}
                className="tag-remove"
                aria-label={`Remove ${tag} filter`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Lista de tags populares */}
      <div className="tags-list">
        {displayTags.map(tag => (
          <button
            key={tag.tag}
            onClick={() => onTagClick(tag.tag)}
            className={`tag-button ${selectedTags.includes(tag.tag) ? 'selected' : ''}`}
            title={`${tag.tag} (${tag.count} ${t('forum.replies')})`}
          >
            <span className="tag-name">#{tag.tag}</span>
            <span className="tag-count">({tag.count})</span>
          </button>
        ))}

        {hasMore && (
          <button
            onClick={() => {/* TODO: Implementar mostrar más */}}
            className="tag-button show-more"
          >
            +{tags.length - maxDisplay} {t('common.more')}
          </button>
        )}
      </div>

      {/* Acciones */}
      {selectedTags.length > 0 && (
        <div className="tag-actions">
          <button
            onClick={() => selectedTags.forEach(tag => onTagRemove(tag))}
            className="btn btn-sm btn-secondary"
          >
            {t('common.cancel')}
          </button>
        </div>
      )}
    </div>
  );
});

PopularTags.displayName = 'PopularTags';

export default PopularTags;