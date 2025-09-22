import React, { memo, useState } from 'react';

const ForumFilters = memo(({ filters, categories, onFilterChange, showFilters, onToggleFilters, t }) => {
  const [localFilters, setLocalFilters] = useState(filters);

  const handleInputChange = (field, value) => {
    const newFilters = { ...localFilters, [field]: value };
    setLocalFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleTagAdd = (tag) => {
    if (tag && !localFilters.tags.includes(tag)) {
      const newTags = [...localFilters.tags, tag.toLowerCase().trim()];
      handleInputChange('tags', newTags);
    }
  };

  const handleTagRemove = (tagToRemove) => {
    const newTags = localFilters.tags.filter(tag => tag !== tagToRemove);
    handleInputChange('tags', newTags);
  };

  const handleTagKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const tag = e.target.value.trim();
      if (tag) {
        handleTagAdd(tag);
        e.target.value = '';
      }
    }
  };

  const clearFilters = () => {
    const defaultFilters = {
      page: 1,
      limit: 20,
      category: 'all',
      search: '',
      sort: 'lastActivity',
      order: 'desc',
      tags: [],
      author: '',
      minDate: '',
      maxDate: ''
    };
    setLocalFilters(defaultFilters);
    onFilterChange(defaultFilters);
  };

  return (
    <div className="forum-filters">
      <div className="filters-header">
        <button
          onClick={onToggleFilters}
          className="toggle-filters-btn"
        >
          {showFilters ? '🔽' : '🔼'} {t('forum.filterBy')}
        </button>

        {(filters.search || filters.category !== 'all' || filters.tags.length > 0) && (
          <button onClick={clearFilters} className="clear-filters-btn">
            🗑️ {t('common.cancel')}
          </button>
        )}
      </div>

      {showFilters && (
        <div className="filters-content">
          <div className="filter-row">
            <div className="filter-group">
              <label>{t('forum.search')}</label>
              <input
                type="text"
                value={localFilters.search}
                onChange={(e) => handleInputChange('search', e.target.value)}
                placeholder={t('forum.search')}
              />
            </div>

            <div className="filter-group">
              <label>{t('forum.category')}</label>
              <select
                value={localFilters.category}
                onChange={(e) => handleInputChange('category', e.target.value)}
              >
                <option value="all">{t('forum.allCategories')}</option>
                {categories.map(category => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label>{t('forum.sortBy')}</label>
              <select
                value={localFilters.sort}
                onChange={(e) => handleInputChange('sort', e.target.value)}
              >
                <option value="lastActivity">{t('forum.recentActivity')}</option>
                <option value="createdAt">{t('forum.newest')}</option>
                <option value="popularity">{t('forum.mostPopular')}</option>
                <option value="comments">{t('forum.mostCommented')}</option>
                <option value="views">{t('forum.mostViewed')}</option>
              </select>
            </div>
          </div>

          <div className="filter-row">
            <div className="filter-group">
              <label>{t('forum.author')}</label>
              <input
                type="text"
                value={localFilters.author}
                onChange={(e) => handleInputChange('author', e.target.value)}
                placeholder={t('forum.author')}
              />
            </div>

            <div className="filter-group">
              <label>{t('forum.dateRange')}</label>
              <div className="date-range">
                <input
                  type="date"
                  value={localFilters.minDate}
                  onChange={(e) => handleInputChange('minDate', e.target.value)}
                  placeholder={t('forum.from')}
                />
                <span>-</span>
                <input
                  type="date"
                  value={localFilters.maxDate}
                  onChange={(e) => handleInputChange('maxDate', e.target.value)}
                  placeholder={t('forum.to')}
                />
              </div>
            </div>
          </div>

          <div className="filter-row">
            <div className="filter-group tags-group">
              <label>{t('forum.tags')}</label>
              <input
                type="text"
                onKeyPress={handleTagKeyPress}
                placeholder={t('forum.addTags')}
              />
              <div className="tags-list">
                {localFilters.tags.map(tag => (
                  <span key={tag} className="tag">
                    #{tag}
                    <button onClick={() => handleTagRemove(tag)}>×</button>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

ForumFilters.displayName = 'ForumFilters';

export default ForumFilters;