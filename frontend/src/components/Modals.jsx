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
  handleUpdateSetting,
  textColor, textSecondaryColor, bgColor, sidebarColor,
  navbarColor, searchbarColor, widgetTimeColor, widgetSecondaryColor, sidebarPanelColor, brandLogoColor,
  availableWallpapers, handleSetWallpaperAsDefault
}) => {
  const [activeTab, setActiveTab] = React.useState('general');

  React.useEffect(() => {
    if (activeTab === 'colors' || activeTab === 'wallpapers') setActiveTab('appearance');
  }, [activeTab]);

  /** Solo `uploads/backgrounds`: ahí se suben los fondos y vive el predeterminado `background.png`. */
  const wallpaperPickerItems = React.useMemo(() => {
    const bg = availableWallpapers.backgrounds || [];
    // Agregar opción de fondo transparente al inicio
    return [
      { path: 'transparent', scope: 'special' },
      ...bg.map((path) => ({ path, scope: 'backgrounds' }))
    ];
  }, [availableWallpapers]);

  const wallpaperSrc = (p) => (p.startsWith('/') ? BACKEND_URL + p : p);
  const wallpaperBasename = (p) => p.replace(/^.*\//, '') || p;

  const previewPath =
    wallpaper != null && String(wallpaper).trim() !== ''
      ? String(wallpaper).trim()
      : wallpaperPickerItems[0]?.path;
  const previewImageUrl = previewPath ? wallpaperSrc(previewPath) : null;

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
                  <h4>Colores de la interfaz</h4>

                  {/* --- Colores de texto y fondo --- */}
                  <p className="color-group-label">Texto y fondo</p>

                  <div className="color-picker-row">
                    <span>Texto principal</span>
                    <input type="color" value={textColor} onChange={(e) => handleUpdateSetting('textColor', e.target.value)} title={textColor} />
                  </div>

                  <div className="color-picker-row">
                    <span>Texto secundario</span>
                    <input type="color" value={textSecondaryColor} onChange={(e) => handleUpdateSetting('textSecondaryColor', e.target.value)} title={textSecondaryColor} />
                  </div>

                  <div className="color-picker-row">
                    <span>Acento (botones, enlaces)</span>
                    <input type="color" value={accentColor} onChange={(e) => handleUpdateSetting('accentColor', e.target.value)} title={accentColor} />
                  </div>

                  {/* --- Colores de elementos UI --- */}
                  <p className="color-group-label" style={{ marginTop: '1.25rem' }}>Elementos de la interfaz (deja vacío para transparente)</p>

                  <div className="color-picker-row">
                    <span>🔷 Navbar (barra superior)</span>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <input type="color" value={navbarColor || '#ffffff'} onChange={(e) => handleUpdateSetting('navbarColor', e.target.value)} title={navbarColor} />
                      {navbarColor && <button className="btn-clear-color" onClick={() => handleUpdateSetting('navbarColor', '')} title="Limpiar color">✕</button>}
                    </div>
                  </div>

                  <div className="color-picker-row">
                    <span>🔍 Barra de búsqueda</span>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <input type="color" value={searchbarColor || '#ffffff'} onChange={(e) => handleUpdateSetting('searchbarColor', e.target.value)} title={searchbarColor} />
                      {searchbarColor && <button className="btn-clear-color" onClick={() => handleUpdateSetting('searchbarColor', '')} title="Limpiar color">✕</button>}
                    </div>
                  </div>

                  <div className="color-picker-row">
                    <span>🕐 Widget de tiempo</span>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <input type="color" value={widgetTimeColor || '#ffffff'} onChange={(e) => handleUpdateSetting('widgetTimeColor', e.target.value)} title={widgetTimeColor} />
                      {widgetTimeColor && <button className="btn-clear-color" onClick={() => handleUpdateSetting('widgetTimeColor', '')} title="Limpiar color">✕</button>}
                    </div>
                  </div>

                  <div className="color-picker-row">
                    <span>📊 Widget de métricas</span>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <input type="color" value={widgetSecondaryColor || '#ffffff'} onChange={(e) => handleUpdateSetting('widgetSecondaryColor', e.target.value)} title={widgetSecondaryColor} />
                      {widgetSecondaryColor && <button className="btn-clear-color" onClick={() => handleUpdateSetting('widgetSecondaryColor', '')} title="Limpiar color">✕</button>}
                    </div>
                  </div>

                  <div className="color-picker-row">
                    <span>📌 Logo / Ícono marca</span>
                    <input type="color" value={brandLogoColor.startsWith('rgba') ? '#38bdf8' : brandLogoColor} onChange={(e) => handleUpdateSetting('brandLogoColor', e.target.value)} title={brandLogoColor} />
                  </div>
                  
                  <div className="color-reset-button-container" style={{ marginTop: '1.5rem', textAlign: 'center' }}>
                    <button 
                      className="btn btn-secondary" 
                      onClick={() => {
                        // Valores base para los colores
                        const baseColors = {
                          accentColor: '#38bdf8',
                          textColor: '#f8fafc',
                          textSecondaryColor: '#94a3b8',
                          navbarColor: '',
                          searchbarColor: '',
                          widgetTimeColor: '',
                          widgetSecondaryColor: '',
                          sidebarPanelColor: '',
                          brandLogoColor: '#38bdf8'
                        };
                        
                        // Actualizar cada color a su valor base
                        Object.entries(baseColors).forEach(([key, value]) => {
                          handleUpdateSetting(key, value);
                        });
                        
                        alert('🎨 Colores restablecidos a los valores base');
                      }}
                      style={{ width: '100%' }}
                    >
                      🎨 Restablecer Colores Base
                    </button>
                  </div>
                </div>

                <div className="settings-section">
                  <h4>Fondo de pantalla</h4>
                  <p className="wallpaper-picker-hint">
                    Todas las imágenes están en <code>uploads/backgrounds</code>. El fondo por defecto de la app es <code>background.png</code>. Pulsa un recuadro para usarlo; la vista previa arriba muestra el activo.
                  </p>
                  <div
                    className="wallpaper-preview"
                    style={{
                      height: '120px',
                      borderRadius: '12px',
                      marginBottom: '1rem',
                      border: '1px solid rgba(255,255,255,0.1)',
                      backgroundColor: 'rgba(0,0,0,0.35)',
                      backgroundImage: previewImageUrl ? `url("${previewImageUrl.replace(/"/g, '\\"')}")` : 'none',
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      backgroundRepeat: 'no-repeat'
                    }}
                  />

                  {wallpaperPickerItems.length > 0 ? (
                    <div className="wallpaper-picker-block">
                      <p className="wallpaper-picker-label">Selector de fondos</p>
                      <div className="wallpaper-picker-grid" role="listbox" aria-label="Fondos en uploads/backgrounds">
                        {wallpaperPickerItems.map(({ path: wp, scope }) => {
                          const isTransparent = scope === 'special' && wp === 'transparent';
                          const isPresetDefault = /\/background\.png$/i.test(wp);
                          
                          return (
                            <div
                              key={wp}
                              role="option"
                              aria-selected={wallpaper === wp || (wallpaper === '' && isTransparent)}
                              title={isTransparent ? 'Fondo Transparente' : wallpaperBasename(wp)}
                              className={`wallpaper-picker-tile${(wallpaper === wp || (wallpaper === '' && isTransparent)) ? ' is-selected' : ''}`}
                              onClick={() => handleWallpaperUpload(isTransparent ? '' : wp)}
                            >
                              {isTransparent ? (
                                <div className="transparent-bg-placeholder">
                                  <span className="transparent-icon">◻️</span>
                                  <span className="transparent-text">Transparente</span>
                                </div>
                              ) : (
                                <img src={wallpaperSrc(wp)} alt="" loading="lazy" />
                              )}
                              {!isPresetDefault && !isTransparent && (
                                <button
                                  type="button"
                                  className="wallpaper-picker-pin btn btn-secondary"
                                  title="Sustituir background.png (fondo por defecto al restablecer)"
                                  onClick={(e) => { e.stopPropagation(); handleSetWallpaperAsDefault(wp); }}
                                >
                                  ★
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <p className="wallpaper-picker-label" style={{ marginBottom: '1rem' }}>
                      No hay imágenes en <code>uploads/backgrounds</code>. Sube una abajo o reinicia el servidor para generar los presets del proyecto.
                    </p>
                  )}

                  <div style={{ border: '2px dashed rgba(255,255,255,0.2)', borderRadius: '12px', padding: '2rem', textAlign: 'center', cursor: 'pointer' }}>
                    <label style={{ cursor: 'pointer', display: 'block' }}>
                      <p style={{ marginTop: '0.5rem', color: 'rgba(255,255,255,0.6)' }}>Subir nuevo fondo</p>
                      <input type="file" accept="image/*,.svg" style={{ display: 'none' }} onChange={(e) => e.target.files[0] && handleWallpaperUpload(e.target.files[0])} />
                    </label>
                  </div>

                  <button type="button" className="btn btn-danger" style={{ width: '100%', marginTop: '1rem' }} onClick={handleResetWallpaper}>
                    Restablecer a background.png (predeterminado)
                  </button>
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
