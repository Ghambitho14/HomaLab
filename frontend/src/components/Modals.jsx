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
  isUpdating, handleUpdate
}) => {
  return (
    <>
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
