import React from 'react';
import '../style/SearchBar.css';

const SearchBar = ({ searchQuery, setSearchQuery }) => {
  return (
    <div className="search-container glass-panel blur-light">
      <span className="search-icon">🔍</span>
      <input
        type="text"
        placeholder="Buscar contenedor..."
        className="search-input"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />
    </div>
  );
};

export default SearchBar;
