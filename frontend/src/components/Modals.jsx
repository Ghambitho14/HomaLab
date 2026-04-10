import React from 'react';
import '../style/Modals.css';

const Modals = ({
  isInstallModalOpen, setIsInstallModalOpen,
  isLogsModalOpen, closeLogs,
  isEditModalOpen, setIsEditModalOpen,
  installName, setInstallName,
  installPort, setInstallPort,
  installCompose, setInstallCompose,
  isInstalling, handleDeploy,
  logsContainerName, logLines, logsEndRef,
  editFriendlyName, setEditFriendlyName,
  editPort, setEditPort,
  editCompose, setEditCompose,
  isUpdating, handleUpdate,
  isSettingsModalOpen, setIsSettingsModalOpen,
  handleWallpaperUpload, handleResetWallpaper,
  wallpaper, BACKEND_URL,
  dashboardName, setDashboardName,
  serverPort, setServerPort,
  frontendPort, setFrontendPort,
  handleSaveGeneralSettings,
  handleResetConnection,
  zoomLevel, handleZoomChange,
  glassOpacity, glassBlur, accentColor,
  handleUpdateSetting
}) => {
  const [activeTab, setActiveTab] = React.useState('general');

  return (
    <>
      {/* Settings Modal */}
      <div className={`modal-overlay ${isSettingsModalOpen ? 'open' : ''}`}>
        <div className="modal-content glass-panel blur-heavy settings-modal" style={{ maxWidth: '650px', width: '90%' }}>
          <div className="modal-header">
            <h3>⚙️ Ajustes de HomaLab</h3>
            <button className="close-btn" onClick={() => setIsSettingsModalOpen(false)}>×</button>
          </div>
          
          <div className="settings-tabs">
            <button className={`tab-btn ${activeTab === 'general' ? 'active' : ''}`} onClick={() => setActiveTab('general')}>General</button>
            <button className={`tab-btn ${activeTab === 'appearance' ? 'active' : ''}`} onClick={() => setActiveTab('appearance')}>Apariencia</button>
          </div>

          <div className="modal-body" style={{ maxHeight: '70vh' }}>
            {activeTab === 'general' && (
              <div className="tab-content">
                <div className="settings-section">
                  <h4>Identidad del Sistema</h4>
                  <div className="form-group">
                    <label>Nombre del Dashboard</label>
                    <input type="text" value={dashboardName} onChange={(e) => setDashboardName(e.target.value)} />
                  </div>
                </div>

                <div className="settings-section">
                  <h4>Red y Puertos</h4>
                  <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                      <label>Puerto Web (Vite)</label>
                      <input type="number" value={frontendPort} onChange={(e) => setFrontendPort(e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label>Puerto API (Server)</label>
                      <input type="number" value={serverPort} onChange={(e) => setServerPort(e.target.value)} />
                    </div>
                  </div>
                  <button 
                    className="btn btn-primary" 
                    style={{ width: '100%', marginTop: '1rem' }}
                    onClick={() => handleSaveGeneralSettings(dashboardName, serverPort, frontendPort)}
                  >
                    💾 Guardar Cambios de Red
                  </button>
                </div>

                <div className="settings-section">
                  <h4>Emergencia</h4>
                  <button className="btn btn-danger" style={{ width: '100%' }} onClick={handleResetConnection}>
                    🆘 Resetear Conexión Local
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'appearance' && (
              <div className="tab-content">
                <div className="settings-section">
                  <h4>Escala Global</h4>
                  <div className="control-group">
                    <div className="control-header">
                      <span>Zoom Interfaz</span>
                      <span>{zoomLevel}%</span>
                    </div>
                    <input type="range" min="50" max="150" step="5" value={zoomLevel} onChange={(e) => handleZoomChange(parseInt(e.target.value))} />
                  </div>
                </div>

                <div className="settings-section">
                  <h4>Efecto Cristal (Glassmorphism)</h4>
                  <div className="control-group">
                    <div className="control-header">
                      <span>Opacidad de Paneles</span>
                      <span>{glassOpacity}%</span>
                    </div>
                    <input type="range" min="10" max="90" step="5" value={glassOpacity} onChange={(e) => handleUpdateSetting('glassOpacity', parseInt(e.target.value))} />
                  </div>
                  
                  <div className="control-group" style={{ marginTop: '1rem' }}>
                    <div className="control-header">
                      <span>Nivel de Desenfoque (Blur)</span>
                      <span>{glassBlur}px</span>
                    </div>
                    <input type="range" min="0" max="40" step="2" value={glassBlur} onChange={(e) => handleUpdateSetting('glassBlur', parseInt(e.target.value))} />
                  </div>
                </div>

                <div className="settings-section">
                  <h4>Color de Acento</h4>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <input type="color" value={accentColor} onChange={(e) => handleUpdateSetting('accentColor', e.target.value)} style={{ width: '50px', height: '50px', border: 'none', borderRadius: '8px', cursor: 'pointer' }} />
                    <span style={{ fontFamily: 'monospace' }}>{accentColor}</span>
                  </div>
                </div>

                <div className="settings-section">
                  <h4>Fondo de Pantalla</h4>
                  <div className="wallpaper-preview" style={{ 
                    height: '120px', 
                    borderRadius: '12px', 
                    background: `url(${wallpaper?.startsWith('/') ? BACKEND_URL + wallpaper : wallpaper}) center/cover`,
                    marginBottom: '1rem',
                    border: '1px solid rgba(255,255,255,0.1)'
                  }}></div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                    <label className="btn btn-secondary" style={{ cursor: 'pointer' }}>
                      📁 Subir Imagen
                      <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => e.target.files[0] && handleWallpaperUpload(e.target.files[0])} />
                    </label>
                    <button className="btn btn-danger" onClick={handleResetWallpaper}>↩️ Reset</button>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="modal-footer">
            <button className="btn btn-secondary" style={{ width: '100%' }} onClick={() => setIsSettingsModalOpen(false)}>Cerrar</button>
          </div>
        </div>
      </div>

      {/* Install Modal */}
      <div className={`modal-overlay ${isInstallModalOpen ? 'open' : ''}`}>
        <div className="modal-content glass-panel blur-heavy install-modal">
          <div className="modal-header">
            <h3>Desplegar Nueva Aplicación</h3>
            <button className="close-btn" onClick={() => setIsInstallModalOpen(false)}>×</button>
          </div>
          <div className="modal-body">
            <div className="form-row">
              <div className="form-group">
                <label>Nombre de la Aplicación</label>
                <input 
                  type="text" 
                  placeholder="Ej. nextcloud-app" 
                  value={installName}
                  onChange={(e) => setInstallName(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Puerto Exigido (Host)</label>
                <input 
                  type="number" 
                  placeholder="Ej. 8080" 
                  value={installPort}
                  onChange={(e) => setInstallPort(e.target.value)}
                />
              </div>
            </div>
            <div className="form-group">
              <label>Configuración de Docker Compose</label>
              <div className="compose-editor">
                <div className="editor-toolbar">
                  <span className="file-name">docker-compose.yml</span>
                  <span className="import-btn">📂 Importar archivo externo</span>
                </div>
                <textarea 
                  placeholder={"version: '3'\nservices:\n  app:\n    image: my-app:latest\n    ports:\n      - '8080:80'"}
                  value={installCompose}
                  onChange={(e) => setInstallCompose(e.target.value)}
                ></textarea>
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={() => setIsInstallModalOpen(false)} disabled={isInstalling}>Cancelar</button>
            <button className="btn btn-primary" onClick={handleDeploy} disabled={isInstalling}>
              {isInstalling ? '⌛ Desplegando...' : '🚀 Desplegar Contenedor'}
            </button>
          </div>
        </div>
      </div>

      {/* Logs Modal */}
      <div className={`modal-overlay ${isLogsModalOpen ? 'open' : ''}`}>
        <div className="modal-content glass-panel blur-heavy logs-modal">
          <div className="modal-header">
            <h3 className="monospace">📋 Logs: {logsContainerName}</h3>
            <button className="close-btn" onClick={closeLogs}>×</button>
          </div>
          <div className="logs-body">
            {logLines.length === 0 && <p className="empty-logs">Esperando logs del contenedor...</p>}
            {logLines.map((line, i) => (
              <div key={i} className="log-line">{line}</div>
            ))}
            <div ref={logsEndRef}></div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      <div className={`modal-overlay ${isEditModalOpen ? 'open' : ''}`}>
        <div className="modal-content glass-panel blur-heavy edit-modal">
          <div className="modal-header">
            <h3>⚙️ Configurar: {editFriendlyName}</h3>
            <button className="close-btn" onClick={() => setIsEditModalOpen(false)}>×</button>
          </div>
          <div className="modal-body">
            <div className="form-row">
              <div className="form-group">
                <label>Nombre en el Panel</label>
                <input 
                  type="text" 
                  value={editFriendlyName} 
                  onChange={(e) => setEditFriendlyName(e.target.value)} 
                  placeholder="Ej. Mi App Increíble"
                />
              </div>
              <div className="form-group">
                <label>Puerto de Acceso (Host)</label>
                <input 
                  type="number" 
                  value={editPort} 
                  onChange={(e) => setEditPort(e.target.value)} 
                  placeholder="Ej. 8080"
                />
              </div>
            </div>

            <div className="form-group">
              <label>
                Configuración Avanzada (docker-compose.yml)
                <span className="tip">💡 TIP: Añade variables bajo 'environment:'</span>
              </label>
              <div className="compose-editor">
                <div className="editor-subbar">
                  Ejemplo Env: environment: [ - VARIABLE=valor ]
                </div>
                <textarea 
                  value={editCompose}
                  onChange={(e) => setEditCompose(e.target.value)}
                ></textarea>
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={() => setIsEditModalOpen(false)} disabled={isUpdating}>Cancelar</button>
            <button className="btn btn-primary" onClick={handleUpdate} disabled={isUpdating}>
              {isUpdating ? '⌛ Aplicando Cambios...' : '🚀 Guardar y Reiniciar'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Modals;
