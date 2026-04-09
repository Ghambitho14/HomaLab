import React from 'react';
import '../style/Navbar.css';

const Navbar = ({ connected, dockerError }) => {
  return (
    <nav className="top-navbar glass-panel blur-medium">
      <div className="navbar-brand">
        <div className="brand-logo">D</div>
        <span>Docker Control</span>
        <span className={`connection-badge ${connected ? 'online' : 'offline'}`}>
          {connected ? '● Conectado' : '○ Sin conexión'}
        </span>
      </div>
      <div className="navbar-actions">
        {dockerError && <span className="docker-error-badge">⚠️ {dockerError}</span>}
        <button className="nav-btn">⚙️ Ajustes</button>
      </div>
    </nav>
  );
};

export default Navbar;
