import React, { useState, useEffect } from 'react';
import { themes, applyTheme, getTheme } from '../utils/themeConfig';
import '../style/ThemeSwitcher.css';

const ThemeSwitcher = () => {
  const [currentTheme, setCurrentTheme] = useState(getTheme());
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    applyTheme(currentTheme);
  }, [currentTheme]);

  const handleThemeChange = (themeName) => {
    setCurrentTheme(themeName);
    setIsOpen(false);
  };

  return (
    <div className="theme-switcher">
      <button 
        className="theme-toggle-btn"
        onClick={() => setIsOpen(!isOpen)}
        title="Cambiar tema"
      >
        {themes[currentTheme]?.icon}
      </button>

      {isOpen && (
        <div className="theme-menu">
          {Object.entries(themes).map(([key, theme]) => (
            <button
              key={key}
              className={`theme-option ${currentTheme === key ? 'active' : ''}`}
              onClick={() => handleThemeChange(key)}
            >
              <span className="theme-icon">{theme.icon}</span>
              <span className="theme-name">{theme.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ThemeSwitcher;
