import React from 'react';
import AppIcon from './AppIcon.jsx';
import { getAppColor } from '../utils/appHelpers';
import '../style/AppCard.css';

const AppCard = ({ 
  app, 
  activeMenuId, 
  setActiveMenuId, 
  toggleStatus, 
  openEdit, 
  openLogs, 
  deleteApp,
  isHidden,
  onToggleHide
}) => {
  return (
    <div 
      className={`app-card glass-panel blur-medium ${app.status}`} 
      onClick={() => app.port !== 'n/a' && window.open(`http://${window.location.hostname}:${app.port}`, '_blank')}
    >
      {/* ESTADO VISUAL */}
      <div className="status-badge-container">
        <span className={`status-badge ${app.status}`}>
          {app.status === 'running' ? '● ACTIVO' : '○ DESACTIVADO'}
        </span>
      </div>

      {/* ICONO CENTRAL */}
      <div className="app-icon-container" style={{ backgroundColor: getAppColor(app.name) }}>
        <AppIcon app={app} />
      </div>

      <div className="app-info">
        <div className="app-name">{app.name}</div>
        <div className="app-port">
          {app.port !== 'n/a' ? `Puerto: ${app.port}` : 'Sin puerto expuesto'}
        </div>
      </div>
      
      {/* BOTONES DE ACCIÓN EN LA ESQUINA SUPERIOR DERECHA */}
      <div className="app-actions-container">
        <button 
          className="action-btn edit-btn" 
          onClick={(e) => { e.stopPropagation(); openEdit(app.name, app.rawName, e); }}
          title="Editar configuración"
        >
          ⚙️
        </button>
        
        <button 
          className="menu-dots-btn" 
          onClick={(e) => {
            e.stopPropagation();
            setActiveMenuId(activeMenuId === app.id ? null : app.id);
          }}
          title="Más opciones"
        >
          ⋮
        </button>

        {activeMenuId === app.id && (
          <div className="dropdown-menu glass-panel">
            {app.type === 'docker' ? (
              <>
                <button className="menu-item toggle-btn" onClick={(e) => { setActiveMenuId(null); toggleStatus(app.id, app.status, e); }}>
                  {app.status === 'running' ? '⏹ Detener App' : '▶ Iniciar App'}
                </button>
                
                <button className="menu-item" onClick={(e) => { setActiveMenuId(null); openLogs(app.id, app.name, e); }}>
                  📋 Ver Logs en Vivo
                </button>
                
                <div className="menu-divider"></div>
                
                <button className="menu-item" onClick={(e) => { setActiveMenuId(null); onToggleHide(app.id, !isHidden); }}>
                  {isHidden ? '👁 Mostrar App' : '🙈 Ocultar App'}
                </button>
                
                <div className="menu-divider"></div>
                
                <button className="menu-item delete-btn" onClick={(e) => { setActiveMenuId(null); deleteApp(app.id, app.name, e); }}>
                  🗑 Eliminar Aplicación
                </button>
              </>
            ) : (
              <>
                <button className="menu-item" onClick={(e) => { setActiveMenuId(null); onToggleHide(app.id, !isHidden); }}>
                  {isHidden ? '👁 Mostrar App' : '🙈 Ocultar App'}
                </button>
                <div style={{ padding: '4px 8px', fontSize: '0.75rem', color: '#666', fontStyle: 'italic' }}>
                  Este es un servicio nativo del sistema.
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AppCard;
