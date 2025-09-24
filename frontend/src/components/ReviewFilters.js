import React, { useState } from 'react';
import ReviewFilters from '../utils/reviewFilters';
import './ReviewFilters.css';

const ReviewFiltersComponent = ({ onFiltersChange, onSortChange, currentFilters = {}, currentSort = {} }) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [searchTerm, setSearchTerm] = useState(currentFilters.search || '');

  const options = ReviewFilters.getFormattedOptions();

  const handleFilterChange = (filterType, value) => {
    const newFilters = { ...currentFilters, [filterType]: value };
    onFiltersChange(newFilters);
  };

  const handleSortChange = (sortKey) => {
    const sortOption = ReviewFilters.SORT_OPTIONS[sortKey];
    onSortChange({
      value: sortOption.value,
      order: sortOption.order
    });
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    handleFilterChange('search', searchTerm);
  };

  const clearAllFilters = () => {
    onFiltersChange({});
    setSearchTerm('');
  };

  const hasActiveFilters = () => {
    return Object.values(currentFilters).some(value =>
      value && value !== 'all' && value !== ''
    );
  };

  return (
    <div className="review-filters">
      <div className="filters-header">
        <h4>Filtros y Ordenamiento</h4>
        <button
          className="toggle-advanced"
          onClick={() => setShowAdvanced(!showAdvanced)}
        >
          {showAdvanced ? 'Ocultar filtros' : 'Mostrar filtros'}
        </button>
      </div>

      {/* Ordenamiento */}
      <div className="sort-section">
        <label htmlFor="sort-select">Ordenar por:</label>
        <select
          id="sort-select"
          value={Object.keys(ReviewFilters.SORT_OPTIONS).find(key =>
            ReviewFilters.SORT_OPTIONS[key].value === currentSort.value &&
            ReviewFilters.SORT_OPTIONS[key].order === currentSort.order
          ) || 'NEWEST'}
          onChange={(e) => handleSortChange(e.target.value)}
          className="sort-select"
        >
          {options.sortOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Búsqueda */}
      <form onSubmit={handleSearchSubmit} className="search-section">
        <input
          type="text"
          placeholder="Buscar en reseñas..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        <button type="submit" className="search-button">
          🔍
        </button>
      </form>

      {/* Filtros avanzados */}
      {showAdvanced && (
        <div className="advanced-filters">
          <div className="filter-group">
            <label>Calificación:</label>
            <select
              value={currentFilters.rating || 'all'}
              onChange={(e) => handleFilterChange('rating', e.target.value)}
              className="filter-select"
            >
              {options.ratingFilters.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Verificación:</label>
            <select
              value={currentFilters.verified || 'all'}
              onChange={(e) => handleFilterChange('verified', e.target.value)}
              className="filter-select"
            >
              {options.verifiedFilters.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Imágenes:</label>
            <select
              value={currentFilters.hasImages || 'all'}
              onChange={(e) => handleFilterChange('hasImages', e.target.value)}
              className="filter-select"
            >
              {options.imageFilters.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Período:</label>
            <select
              value={currentFilters.dateRange || 'all'}
              onChange={(e) => handleFilterChange('dateRange', e.target.value)}
              className="filter-select"
            >
              {options.dateFilters.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Limpiar filtros */}
      {hasActiveFilters() && (
        <div className="clear-filters">
          <button
            onClick={clearAllFilters}
            className="clear-button"
          >
            Limpiar todos los filtros
          </button>
        </div>
      )}
    </div>
  );
};

export default ReviewFiltersComponent;