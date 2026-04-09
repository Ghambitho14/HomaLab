import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import './App.css';

// Conexión al backend WebSocket
const BACKEND_URL = `http://${window.location.hostname}:3001`;

// Helpers de formato
const formatBytes = (bytes) => {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const formatSpeed = (bytesPerSec) => {
  if (!bytesPerSec || bytesPerSec === 0) return '0 B/s';
  const k = 1024;
  const sizes = ['B/s', 'KB/s', 'MB/s', 'GB/s'];
  const i = Math.floor(Math.log(bytesPerSec) / Math.log(k));
  return parseFloat((bytesPerSec / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

// Colores aleatorios por app (basados en el hash del nombre)
const appColors = ['#3b82f6', '#ec4899', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#0ea5e9', '#14b8a6'];
const getAppColor = (name) => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return appColors[Math.abs(hash) % appColors.length];
};

// Íconos oficiales o SVG de respaldo
const getAppIcon = (image, name) => {
  const lowerImg = (image || '').toLowerCase();
  const lowerName = (name || '').toLowerCase();
  const contains = (term) => lowerImg.includes(term) || lowerName.includes(term);

  // Base URL para iconos oficiales
  const ICON_BASE = 'https://cdn.jsdelivr.net/gh/walkxcode/dashboard-icons/png';

  // 1. Intentar normalizar el nombre para la URL (ej: "Home Assistant" -> "home-assistant")
  const normalizedName = lowerName.trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  
  // 2. Mapeos específicos para casos donde el nombre de la app no coincide con el archivo
  if (contains('hass') || contains('home-assistant')) return { type: 'img', src: `${ICON_BASE}/home-assistant.png`, fallback: 'M12 3L2 12h3v8h6v-6h2v6h6v-8h3L12 3z' };
  if (contains('adguard')) return { type: 'img', src: `${ICON_BASE}/adguard-home.png`, fallback: 'M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.5h7c-.51 4.12-3.14 7.74-7 8.92V11.5H5V6.3l7-3.11v8.31z' };
  
  // 3. Intento dinámico basado en el nombre (Excalidraw -> excalidraw.png)
  return { 
    type: 'img', 
    src: `${ICON_BASE}/${normalizedName}.png`,
    fallback: 'M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z'
  };
};

// Componente auxiliar para gestionar el icono con fallback automático
const AppIcon = ({ app }) => {
  const icon = getAppIcon(app.image, app.name);
  const [imgError, setImgError] = useState(false);

  if (icon.type === 'img' && !imgError) {
    return (
      <img 
        src={icon.src} 
        alt={app.name} 
        onError={() => setImgError(true)}
        style={{ width: '70%', height: '70%', objectFit: 'contain' }} 
      />
    );
  }

  // Si hubo error o es tipo SVG, mostramos el path
  return (
    <svg className="app-icon-svg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={icon.fallback || icon.value}></path>
    </svg>
  );
};

function App() {
  const [apps, setApps] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);
  const [isLogsModalOpen, setIsLogsModalOpen] = useState(false);
  const [logsContainerName, setLogsContainerName] = useState('');
  const [logLines, setLogLines] = useState([]);
  const [dockerError, setDockerError] = useState(null);
  const [connected, setConnected] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [time, setTime] = useState(new Date());

  // Estado para el menú desplegable (3 puntos)
  const [activeMenuId, setActiveMenuId] = useState(null);

  // Estados del formulario de instalación
  const [installName, setInstallName] = useState('');
  const [installPort, setInstallPort] = useState('');
  const [installCompose, setInstallCompose] = useState('');
  const [isInstalling, setIsInstalling] = useState(false);

  // Estados de edición
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editAppName, setEditAppName] = useState('');
  const [editFriendlyName, setEditFriendlyName] = useState('');
  const [editPort, setEditPort] = useState('');
  const [editCompose, setEditCompose] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const socketRef = useRef(null);
  const logsEndRef = useRef(null);

  // ... (reloj y efectos de socket omitidos pero permanecen)

  const openEdit = async (displayName, rawName, e) => {
    e.stopPropagation();
    try {
      const response = await fetch(`${BACKEND_URL}/apps/${rawName}/config`);
      const data = await response.json();
      if (response.ok) {
        setEditAppName(rawName);
        setEditFriendlyName(displayName);
        // El puerto host es el que se ve en la tarjeta
        const app = apps.find(a => a.rawName === rawName);
        setEditPort(app?.port !== 'n/a' ? app.port : '');
        setEditCompose(data.composeContent);
        setIsEditModalOpen(true);
      } else {
        alert('❌ Error al cargar configuración: ' + data.error);
      }
    } catch (err) {
      alert('❌ Error de conexión');
    }
  };

  const handleUpdate = async () => {
    setIsUpdating(true);
    try {
      const response = await fetch(`${BACKEND_URL}/apps/${editAppName}/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          composeContent: editCompose,
          newName: editFriendlyName,
          newPort: editPort
        })
      });

      const data = await response.json();
      if (response.ok) {
        alert('✅ Configuración actualizada y app re-desplegada');
        setIsEditModalOpen(false);
      } else {
        alert('❌ Error: ' + data.error);
      }
    } catch (err) {
      alert('❌ Error de conexión con el backend');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeploy = async () => {
    if (!installName || !installPort || !installCompose) {
      alert('Por favor, rellena todos los campos');
      return;
    }

    setIsInstalling(true);
    try {
      const response = await fetch(`${BACKEND_URL}/apps/install`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: installName,
          port: installPort,
          composeContent: installCompose
        })
      });

      const data = await response.json();
      if (response.ok) {
        alert('✅ App desplegada correctamente');
        setIsInstallModalOpen(false);
        setInstallName('');
        setInstallPort('');
        setInstallCompose('');
      } else {
        alert('❌ Error: ' + data.error);
      }
    } catch (err) {
      alert('❌ Error de conexión con el backend');
    } finally {
      setIsInstalling(false);
    }
  };

  // Reloj local
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Conexión WebSocket al backend
  useEffect(() => {
    const socket = io(BACKEND_URL);
    socketRef.current = socket;

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));

    // Métricas del sistema en tiempo real
    socket.on('system-metrics', (data) => {
      setMetrics(data);
    });

    // Contenedores Docker (stateless - siempre la lista completa)
    socket.on('docker-containers', (containerList) => {
      setApps(containerList);
      setDockerError(null);
    });

    // Errores de Docker
    socket.on('docker-error', (msg) => {
      setDockerError(msg);
    });

    // Logs en vivo
    socket.on('container-log', (line) => {
      setLogLines(prev => [...prev.slice(-200), line]); // Máx 200 líneas
    });

    return () => socket.disconnect();
  }, []);

  // Auto-scroll logs
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logLines]);

  const formatTime = (date) => date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  const formatDate = (date) => date.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  // Acciones reales vía WebSocket
  const toggleStatus = (id, status, e) => {
    e.stopPropagation();
    const action = status === 'running' ? 'stop' : 'start';
    socketRef.current?.emit('toggle-container', { id, action });
  };

  const deleteApp = (id, name, e) => {
    e.stopPropagation();
    if (confirm(`¿Eliminar contenedor ${name} e imagen?`)) {
      socketRef.current?.emit('delete-container', { id, name });
    }
  };

  const openLogs = (id, name, e) => {
    e.stopPropagation();
    setLogsContainerName(name);
    setLogLines([]);
    setIsLogsModalOpen(true);
    socketRef.current?.emit('stream-logs', { id });
  };

  const closeLogs = () => {
    setIsLogsModalOpen(false);
    socketRef.current?.emit('stop-logs');
    setLogLines([]);
  };

  // Valores de métricas (con fallback para cuando no hay conexión)
  const cpuLoad = metrics?.cpu?.load?.toFixed(0) || 0;
  const cpuTemp = metrics?.cpu?.temp || null;
  const ramUsed = metrics?.ram?.used || 0;
  const ramTotal = metrics?.ram?.total || 1;
  const ramPercent = ((ramUsed / ramTotal) * 100).toFixed(0);
  const diskUsed = metrics?.disk?.used || 0;
  const diskTotal = metrics?.disk?.total || 1;
  const diskPercent = ((diskUsed / diskTotal) * 100).toFixed(0);
  const diskHealth = metrics?.disk?.health || '—';
  const netUp = metrics?.network?.tx_sec || 0;
  const netDown = metrics?.network?.rx_sec || 0;

  // Filtro de búsqueda
  const filteredApps = apps.filter(app =>
    app.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="app-wrapper">
      <div className="layout">
        <div className="main-wrapper">
          {/* Top Navbar */}
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

          {/* Main Content Area */}
          <main className="main-content">
            {/* Search Bar */}
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

            {/* Apps Section */}
            <div className="apps-section">
              <div className="apps-header">
                <h2>Contenedores ({filteredApps.length})</h2>
                <button className="add-app-btn" onClick={() => setIsInstallModalOpen(true)}>+</button>
              </div>

              {filteredApps.length === 0 && !dockerError && (
                <div className="empty-state glass-panel blur-medium">
                  <p>{connected ? '🐳 No hay contenedores Docker en ejecución' : '⏳ Conectando al servidor...'}</p>
                </div>
              )}
              
              <div className="apps-grid">
                {filteredApps.map(app => (
                  <div key={app.id} className={`app-card glass-panel blur-medium ${app.status}`} 
                    onClick={() => app.port !== 'n/a' && window.open(`http://${window.location.hostname}:${app.port}`, '_blank')}
                    style={{ position: 'relative', height: '180px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px', transition: 'transform 0.2s', cursor: 'pointer' }}
                  >
                    {/* ESTADO VISUAL (NO CLICABLE) */}
                    <div style={{ position: 'absolute', top: '12px', left: '12px', pointerEvents: 'none' }}>
                      <span style={{ 
                        background: app.status === 'running' ? 'rgba(74, 222, 128, 0.1)' : 'rgba(255, 77, 77, 0.1)', 
                        border: `1px solid ${app.status === 'running' ? '#4ade8066' : '#ff4d4d66'}`,
                        color: app.status === 'running' ? '#4ade80' : '#ff4d4d', 
                        fontSize: '0.6rem', 
                        fontWeight: '700',
                        padding: '2px 8px', 
                        borderRadius: '4px',
                        textTransform: 'uppercase'
                      }}>
                        {app.status === 'running' ? '● ACTIVO' : '○ DESACTIVADO'}
                      </span>
                    </div>

                    {/* ICONO CENTRAL */}
                    <div className="app-icon-container" style={{ 
                      backgroundColor: getAppColor(app.name), 
                      width: '64px', 
                      height: '64px', 
                      borderRadius: '16px', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      marginBottom: '12px',
                      boxShadow: '0 8px 16px rgba(0,0,0,0.2)'
                    }}>
                      <AppIcon app={app} />
                    </div>

                    <div className="app-name" style={{ fontSize: '0.95rem', fontWeight: '600', color: '#fff', textAlign: 'center', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {app.name}
                    </div>
                    <div className="app-port" style={{ fontSize: '0.75rem', color: '#888', marginTop: '2px' }}>
                      {app.port !== 'n/a' ? `Puerto: ${app.port}` : 'Sin puerto expuesto'}
                    </div>
                    
                    {/* MENÚ DE 3 PUNTOS (DERECHA) */}
                    <div className="app-menu-container" style={{ position: 'absolute', top: '8px', right: '8px', zIndex: 100 }}>
                      <button 
                        className="menu-dots-btn" 
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMenuId(activeMenuId === app.id ? null : app.id);
                        }}
                        style={{ background: 'transparent', border: 'none', color: '#666', fontSize: '1.2rem', padding: '4px 8px', cursor: 'pointer', borderRadius: '4px' }}
                      >
                        ⋮
                      </button>

                      {activeMenuId === app.id && (
                        <div className="dropdown-menu glass-panel" style={{ position: 'absolute', right: 0, top: '30px', width: '190px', background: 'rgba(20, 25, 35, 0.98)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '8px', boxShadow: '0 12px 48px rgba(0,0,0,0.7)', backdropFilter: 'blur(20px)', zIndex: 1000 }}>
                          <button className="menu-item" onClick={(e) => { setActiveMenuId(null); toggleStatus(app.id, app.status, e); }} style={{ width: '100%', textAlign: 'left', padding: '10px 12px', background: 'transparent', border: 'none', color: app.status === 'running' ? '#ff4d4d' : '#4ade80', fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer', borderRadius: '8px' }}>
                            {app.status === 'running' ? '⏹ Detener App' : '▶ Iniciar App'}
                          </button>
                          
                          {app.isManaged && (
                            <button 
                              className="menu-item" 
                              onClick={(e) => { setActiveMenuId(null); openEdit(app.name, app.rawName, e); }} 
                              style={{ width: '100%', textAlign: 'left', padding: '10px 12px', background: 'transparent', border: 'none', color: '#fff', fontSize: '0.85rem', cursor: 'pointer', borderRadius: '8px' }}
                            >
                              ⚙️ Configurar / Editar
                            </button>
                          )}
                          
                          <button className="menu-item" onClick={(e) => { setActiveMenuId(null); openLogs(app.id, app.name, e); }} style={{ width: '100%', textAlign: 'left', padding: '10px 12px', background: 'transparent', border: 'none', color: '#fff', fontSize: '0.85rem', cursor: 'pointer', borderRadius: '8px' }}>
                            📋 Ver Logs en Vivo
                          </button>
                          
                          <div style={{ height: '1px', background: 'rgba(255,255,255,0.08)', margin: '6px 0' }}></div>
                          
                          <button className="menu-item" onClick={(e) => { setActiveMenuId(null); deleteApp(app.id, app.name, e); }} style={{ width: '100%', textAlign: 'left', padding: '10px 12px', background: 'transparent', border: 'none', color: '#ff4d4d', fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer', borderRadius: '8px' }}>
                            🗑 Eliminar Aplicación
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </main>
        </div>

        {/* Sidebar on the RIGHT */}
        <aside className="sidebar">
          {/* Time Widget */}
          <div className="widget widget-time glass-panel blur-heavy">
            <h2>{formatTime(time)}</h2>
            <p>{formatDate(time)}</p>
          </div>

          {/* System Status Widget */}
          <div className="widget glass-panel blur-heavy">
            <div className="widget-header">
              <h3>Estado del sistema</h3>
            </div>
            <div className="meters">
              <div className="meter meter-cpu">
                <svg viewBox="0 0 36 36" className="circular-chart">
                  <path className="circle-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                  <path className="circle" strokeDasharray={`${cpuLoad}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" style={{stroke: '#38bdf8'}} />
                  <text x="18" y="20.5" className="percentage">{cpuLoad}%</text>
                </svg>
                <div className="meter-label">CPU<br/><span>{cpuTemp ? `${cpuTemp}°C` : '—'}</span></div>
              </div>
              <div className="meter meter-ram">
                <svg viewBox="0 0 36 36" className="circular-chart">
                  <path className="circle-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                  <path className="circle" strokeDasharray={`${ramPercent}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" style={{stroke: '#4ade80'}} />
                  <text x="18" y="20.5" className="percentage">{ramPercent}%</text>
                </svg>
                <div className="meter-label">RAM<br/><span>{formatBytes(ramUsed)}</span></div>
              </div>
            </div>
          </div>

          {/* Storage Widget */}
          <div className="widget glass-panel blur-heavy">
            <div className="widget-header">
              <h3>Almacenamiento</h3>
            </div>
            <div className="storage-info">
              <div className="disk-icon">💽</div>
              <div className="disk-details">
                <span className="badge-healthy">{diskHealth}</span>
                <div className="disk-stats">Usado: {formatBytes(diskUsed)}<br/>Total: {formatBytes(diskTotal)}</div>
              </div>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{width: `${diskPercent}%`}}></div>
            </div>
          </div>

          {/* Network Widget */}
          <div className="widget glass-panel blur-heavy">
            <div className="widget-header">
              <h3>Estado de la red</h3>
            </div>
            <div className="network-stats" style={{ marginTop: '0.5rem' }}>
              <span className="up">↑ {formatSpeed(netUp)}</span>
              <span className="down">↓ {formatSpeed(netDown)}</span>
            </div>
          </div>
        </aside>
      </div>

      {/* Modals */}
      <div className={`modal-overlay ${isInstallModalOpen ? 'open' : ''}`}>
        <div className="modal-content glass-panel blur-heavy" style={{ padding: '0', maxWidth: '750px', width: '90%' }}>
          <div className="modal-header" style={{ padding: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#fff' }}>Desplegar Nueva Aplicación</h3>
            <button className="close-btn" onClick={() => setIsInstallModalOpen(false)} style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
          </div>
          <div className="modal-body" style={{ padding: '1.5rem', maxHeight: '65vh', overflowY: 'auto' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Nombre de la Aplicación</label>
                <input 
                  type="text" 
                  placeholder="Ej. nextcloud-app" 
                  value={installName}
                  onChange={(e) => setInstallName(e.target.value)}
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Puerto Exigido (Host)</label>
                <input 
                  type="number" 
                  placeholder="Ej. 8080" 
                  value={installPort}
                  onChange={(e) => setInstallPort(e.target.value)}
                />
              </div>
            </div>
            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label>Configuración de Docker Compose</label>
              <div className="compose-editor" style={{ background: 'rgba(10, 15, 25, 0.6)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', overflow: 'hidden' }}>
                <div className="editor-toolbar" style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 1rem', background: 'rgba(0,0,0,0.4)', fontSize: '0.85rem', color: '#888', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <span style={{ fontFamily: 'monospace' }}>docker-compose.yml</span>
                  <span style={{ cursor: 'pointer', color: '#38bdf8', fontWeight: 500 }}>📂 Importar archivo externo</span>
                </div>
                <textarea 
                  placeholder={"version: '3'\nservices:\n  app:\n    image: my-app:latest\n    ports:\n      - '8080:80'"}
                  style={{ width: '100%', height: '250px', background: 'transparent', border: 'none', color: '#a5b4fc', padding: '1rem', fontFamily: 'monospace', resize: 'vertical', outline: 'none', fontSize: '0.9rem', lineHeight: '1.5' }}
                  value={installCompose}
                  onChange={(e) => setInstallCompose(e.target.value)}
                ></textarea>
              </div>
            </div>
          </div>
          <div className="modal-footer" style={{ padding: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
            <button className="btn btn-secondary" onClick={() => setIsInstallModalOpen(false)} disabled={isInstalling}>Cancelar</button>
            <button className="btn btn-primary" onClick={handleDeploy} disabled={isInstalling}>
              {isInstalling ? '⌛ Desplegando...' : '🚀 Desplegar Contenedor'}
            </button>
          </div>
        </div>
      </div>

      <div className={`modal-overlay ${isLogsModalOpen ? 'open' : ''}`}>
        <div className="modal-content glass-panel blur-heavy" style={{ padding: '0', maxWidth: '900px', width: '95%' }}>
          <div className="modal-header" style={{ padding: '1rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: '1rem', color: '#fff', fontFamily: 'monospace' }}>📋 Logs: {logsContainerName}</h3>
            <button className="close-btn" onClick={closeLogs} style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
          </div>
          <div className="logs-body" style={{ background: '#0a0e17', height: '400px', overflowY: 'auto', padding: '1rem', fontFamily: 'monospace', fontSize: '0.8rem', lineHeight: '1.6', color: '#a0aec0' }}>
            {logLines.length === 0 && <p style={{ color: '#555' }}>Esperando logs del contenedor...</p>}
            {logLines.map((line, i) => (
              <div key={i} style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{line}</div>
            ))}
            <div ref={logsEndRef}></div>
          </div>
        </div>
      </div>
      <div className={`modal-overlay ${isEditModalOpen ? 'open' : ''}`}>
        <div className="modal-content glass-panel blur-heavy" style={{ padding: '0', maxWidth: '800px', width: '95%' }}>
          <div className="modal-header" style={{ padding: '1.2rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#fff' }}>⚙️ Configurar: {editFriendlyName}</h3>
            <button className="close-btn" onClick={() => setIsEditModalOpen(false)} style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
          </div>
          <div className="modal-body" style={{ padding: '1.5rem', maxHeight: '75vh', overflowY: 'auto' }}>
            {/* CAMPOS RÁPIDOS */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
              <div className="form-group">
                <label style={{ fontSize: '0.75rem', color: '#888', marginBottom: '6px', display: 'block' }}>Nombre en el Panel</label>
                <input 
                  type="text" 
                  value={editFriendlyName} 
                  onChange={(e) => setEditFriendlyName(e.target.value)} 
                  placeholder="Ej. Mi App Increíble"
                  style={{ width: '100%', padding: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', outline: 'none' }}
                />
              </div>
              <div className="form-group">
                <label style={{ fontSize: '0.75rem', color: '#888', marginBottom: '6px', display: 'block' }}>Puerto de Acceso (Host)</label>
                <input 
                  type="number" 
                  value={editPort} 
                  onChange={(e) => setEditPort(e.target.value)} 
                  placeholder="Ej. 8080"
                  style={{ width: '100%', padding: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', outline: 'none' }}
                />
              </div>
            </div>

            {/* EDITOR YAML */}
            <div className="form-group">
              <label style={{ fontSize: '0.75rem', color: '#888', marginBottom: '8px', display: 'block' }}>
                Configuración Avanzada (docker-compose.yml)
                <span style={{ marginLeft: '10px', color: '#38bdf8' }}>💡 TIP: Añade variables bajo 'environment:'</span>
              </label>
              <div className="compose-editor" style={{ background: 'rgba(10, 15, 25, 0.6)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', overflow: 'hidden' }}>
                <div style={{ padding: '8px 12px', background: 'rgba(0,0,0,0.3)', fontSize: '0.7rem', color: '#555', fontFamily: 'monospace', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  Ejemplo Env: environment: [ - VARIABLE=valor ]
                </div>
                <textarea 
                  value={editCompose}
                  onChange={(e) => setEditCompose(e.target.value)}
                  style={{ width: '100%', height: '350px', background: 'transparent', border: 'none', color: '#a5b4fc', padding: '1rem', fontFamily: 'monospace', resize: 'vertical', outline: 'none', fontSize: '0.9rem', lineHeight: '1.5' }}
                ></textarea>
              </div>
            </div>
          </div>
          <div className="modal-footer" style={{ padding: '1.2rem 1.5rem', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
            <button className="btn btn-secondary" onClick={() => setIsEditModalOpen(false)} disabled={isUpdating} style={{ padding: '8px 20px', borderRadius: '8px', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', cursor: 'pointer' }}>Cancelar</button>
            <button className="btn btn-primary" onClick={handleUpdate} disabled={isUpdating} style={{ padding: '8px 24px', borderRadius: '8px', background: '#38bdf8', border: 'none', color: '#000', fontWeight: 'bold', cursor: 'pointer' }}>
              {isUpdating ? '⌛ Aplicando Cambios...' : '🚀 Guardar y Reiniciar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
