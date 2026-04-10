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
  zoomLevel, handleZoomChange
}) => {
  return (
    <>
      {/* Settings Modal */}
      <div className={`modal-overlay ${isSettingsModalOpen ? 'open' : ''}`}>
        <div className="modal-content glass-panel blur-heavy settings-modal" style={{ maxWidth: '450px' }}>
          <div className="modal-header">
            <h3>⚙️ Ajustes de HomaLab</h3>
            <button className="close-btn" onClick={() => setIsSettingsModalOpen(false)}>×</button>
          </div>
          <div className="modal-body" style={{ maxHeight: '80vh' }}>
            <div className="settings-section">
              <h4>Visualización</h4>
              <p className="settings-desc">Ajusta el tamaño de la interfaz (Zoom).</p>
              
              <div className="zoom-control" style={{ 
                background: 'rgba(255,255,255,0.05)', 
                padding: '1rem', 
                borderRadius: '12px',
                marginBottom: '1rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.8rem', opacity: 0.7 }}>Escala:</span>
                  <span style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#38bdf8' }}>{zoomLevel}%</span>
                </div>
                <input 
                  type="range" 
                  min="50" 
                  max="150" 
                  step="5"
                  value={zoomLevel} 
                  onChange={(e) => handleZoomChange(parseInt(e.target.value))}
                  style={{ width: '100%', cursor: 'pointer', accentColor: '#38bdf8' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.3rem', fontSize: '0.65rem', opacity: 0.5 }}>
                  <span>50%</span>
                  <span>100%</span>
                  <span>150%</span>
                </div>
              </div>

              <h4>Personalización</h4>
              <p className="settings-desc">Cambia el fondo de pantalla de tu dashboard.</p>
              
              <div className="wallpaper-preview" style={{ 
                height: '100px', 
                borderRadius: '12px', 
                background: `url(${wallpaper?.startsWith('/') ? BACKEND_URL + wallpaper : wallpaper}) center/cover`,
                marginBottom: '1rem',
                border: '1px solid rgba(255,255,255,0.1)'
              }}></div>

              <div className="upload-zone" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <label className="btn btn-secondary" style={{ cursor: 'pointer', fontSize: '0.8rem' }}>
                  📁 Subir
                  <input 
                    type="file" 
                    accept="image/*" 
                    style={{ display: 'none' }} 
                    onChange={(e) => {
                      if (e.target.files[0]) {
                        handleWallpaperUpload(e.target.files[0]);
                      }
                    }}
                  />
                </label>
                <button 
                  className="btn btn-danger" 
                  style={{ fontSize: '0.8rem' }}
                  onClick={handleResetWallpaper}
                >
                  ↩️ Reset
                </button>
              </div>
            </div>

            <div className="settings-section" style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h4 style={{ margin: 0 }}>Identidad y Red</h4>
                <div style={{ fontSize: '0.7rem', padding: '4px 8px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', color: 'rgba(255,255,255,0.6)' }}>
                  📡 API: {BACKEND_URL}
                </div>
              </div>
              <p className="settings-desc">Configura cómo se identifica y conecta tu HomaLab.</p>
              
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label>Nombre del Sistema</label>
                <input 
                  type="text" 
                  value={dashboardName} 
                  onChange={(e) => setDashboardName(e.target.value)} 
                  placeholder="Ej. Mi HomaLab"
                />
              </div>

              <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <div className="form-group">
                  <label>Puerto Web (Vite)</label>
                  <input 
                    type="number" 
                    value={frontendPort} 
                    onChange={(e) => setFrontendPort(e.target.value)} 
                  />
                </div>
                <div className="form-group">
                  <label>Puerto API (Server)</label>
                  <input 
                    type="number" 
                    value={serverPort} 
                    onChange={(e) => setServerPort(e.target.value)} 
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <span className="tip" style={{ display: 'block', marginTop: '0.5rem', marginLeft: 0, fontSize: '0.7rem', color: '#ffbd2e' }}>
                  ⚠️ Cambiar puertos reiniciará las apps y podría requerir recarga manual.
                </span>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button 
                  className="btn btn-primary" 
                  style={{ flex: 2, padding: '12px' }}
                  onClick={() => handleSaveGeneralSettings(dashboardName, serverPort, frontendPort)}
                >
                  💾 Guardar Cambios
                </button>
                <button 
                  className="btn btn-danger" 
                  style={{ flex: 1, padding: '12px', fontSize: '0.8rem' }}
                  onClick={handleResetConnection}
                  title="Si pierdes la conexión, haz clic aquí para volver al puerto 3001"
                >
                  🆘 Reset Local
                </button>
              </div>
            </div>
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
