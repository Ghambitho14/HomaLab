import React from 'react';
import '../style/PanelNavbar.css';

const PanelNavbar = ({ activePanel, setActivePanel }) => {
  const panels = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'security', label: 'Seguridad', icon: '🔒' }
  ];

  return (
    <nav className="panel-navbar">
      {panels.map(panel => (
        <button
          key={panel.id}
          className={`panel-nav-btn ${activePanel === panel.id ? 'active' : ''}`}
          onClick={() => setActivePanel(panel.id)}
          title={panel.label}
        >
          <span className="panel-nav-icon">{panel.icon}</span>
          <span className="panel-nav-label">{panel.label}</span>
        </button>
      ))}
    </nav>
  );
};

export default PanelNavbar;
