import React from 'react';
import './SearchBar.css';

const SearchBar = ({ searchQuery, setSearchQuery, onSearch, loading }) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch();
  };

  return (
    <div className="search-bar">
      <form onSubmit={handleSubmit} className="search-form">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Buscar videos de Twenty One Pilots..."
          className="search-input"
          disabled={loading}
        />
        <button
          type="submit"
          className="search-button"
          disabled={loading || !searchQuery.trim()}
        >
          {loading ? 'Buscando...' : 'Buscar'}
        </button>
      </form>
    </div>
  );
};

export default SearchBar;