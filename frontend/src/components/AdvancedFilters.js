import React, { useState } from 'react';
import './AdvancedFilters.css';

const AdvancedFilters = ({
  filters,
  onFiltersChange,
  genres = [],
  types = [],
  showAdvanced = false
}) => {
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(showAdvanced);

  const handleInputChange = (field, value) => {
    onFiltersChange({ [field]: value });
  };

  const clearFilters = () => {
    onFiltersChange({
      search: '',
      genre: 'all',
      type: 'all',
      minYear: '',
      maxYear: '',
      minPopularity: '',
      maxPopularity: '',
      sort: 'releaseYear',
      order: 'desc'
    });
  };

  const hasActiveFilters = () => {
    return filters.search ||
           filters.genre !== 'all' ||
           filters.type !== 'all' ||
           filters.minYear ||
           filters.maxYear ||
           filters.minPopularity ||
           filters.maxPopularity;
  };

  return (
    <div className="advanced-filters">
      <div className="filters-header">
        <h3>Filtros y Búsqueda</h3>
        <button
          className="toggle-advanced-btn"
          onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
        >
          {showAdvancedFilters ? 'Ocultar' : 'Mostrar'} filtros avanzados
        </button>
      </div>

      <div className="filters-content">
        {/* Filtros básicos siempre visibles */}
        <div className="basic-filters">
          <div className="filter-group">
            <input
              type="text"
              placeholder="Buscar álbumes o canciones..."
              value={filters.search}
              onChange={(e) => handleInputChange('search', e.target.value)}
              className="search-input"
            />
          </div>

          <div className="filter-group">
            <label>Ordenar por:</label>
            <select
              value={`${filters.sort}_${filters.order}`}
              onChange={(e) => {
                const [sort, order] = e.target.value.split('_');
                handleInputChange('sort', sort);
                handleInputChange('order', order);
              }}
            >
              <option value="releaseYear_desc">Año (más reciente)</option>
              <option value="releaseYear_asc">Año (más antiguo)</option>
              <option value="title_asc">Título (A-Z)</option>
              <option value="title_desc">Título (Z-A)</option>
              <option value="popularity_desc">Popularidad (mayor)</option>
              <option value="popularity_asc">Popularidad (menor)</option>
              <option value="views_desc">Vistas (más visto)</option>
              <option value="views_asc">Vistas (menos visto)</option>
            </select>
          </div>

          {hasActiveFilters() && (
            <button className="clear-filters-btn" onClick={clearFilters}>
              Limpiar filtros
            </button>
          )}
        </div>

        {/* Filtros avanzados colapsables */}
        {showAdvancedFilters && (
          <div className="advanced-filters-grid">
            <div className="filter-row">
              <div className="filter-group">
                <label>Género:</label>
                <select
                  value={filters.genre}
                  onChange={(e) => handleInputChange('genre', e.target.value)}
                >
                  <option value="all">Todos los géneros</option>
                  {genres.map(genre => (
                    <option key={genre} value={genre}>
                      {genre.charAt(0).toUpperCase() + genre.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="filter-group">
                <label>Tipo:</label>
                <select
                  value={filters.type}
                  onChange={(e) => handleInputChange('type', e.target.value)}
                >
                  <option value="all">Todos los tipos</option>
                  {types.map(type => (
                    <option key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="filter-row">
              <div className="filter-group">
                <label>Año de lanzamiento:</label>
                <div className="range-inputs">
                  <input
                    type="number"
                    placeholder="Desde"
                    value={filters.minYear}
                    onChange={(e) => handleInputChange('minYear', e.target.value)}
                    min="1900"
                    max="2030"
                  />
                  <span>-</span>
                  <input
                    type="number"
                    placeholder="Hasta"
                    value={filters.maxYear}
                    onChange={(e) => handleInputChange('maxYear', e.target.value)}
                    min="1900"
                    max="2030"
                  />
                </div>
              </div>

              <div className="filter-group">
                <label>Popularidad:</label>
                <div className="range-inputs">
                  <input
                    type="number"
                    placeholder="Mín"
                    value={filters.minPopularity}
                    onChange={(e) => handleInputChange('minPopularity', e.target.value)}
                    min="0"
                    max="100"
                  />
                  <span>-</span>
                  <input
                    type="number"
                    placeholder="Máx"
                    value={filters.maxPopularity}
                    onChange={(e) => handleInputChange('maxPopularity', e.target.value)}
                    min="0"
                    max="100"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdvancedFilters;