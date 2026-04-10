import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { BACKEND_URL } from './constants';

export const useAppLogic = () => {
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
  
  // Ajustes de Personalización y Generales
  const [wallpaper, setWallpaper] = useState('');
  const [dashboardName, setDashboardName] = useState('HomaLab');
  const [serverPort, setServerPort] = useState(3001);
  const [frontendPort, setFrontendPort] = useState(5173);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [glassOpacity, setGlassOpacity] = useState(40);
  const [glassBlur, setGlassBlur] = useState(16);
  const [accentColor, setAccentColor] = useState('#38bdf8');

  const updateUIStyle = (key, value) => {
    if (key === 'glassOpacity') document.documentElement.style.setProperty('--glass-opacity', value / 100);
    if (key === 'glassBlur') document.documentElement.style.setProperty('--glass-blur', `${value}px`);
    if (key === 'accentColor') document.documentElement.style.setProperty('--accent-color', value);
  };

  const handleUpdateSetting = async (key, value) => {
    // Actualizar UI instantáneamente
    if (key === 'glassOpacity') setGlassOpacity(value);
    if (key === 'glassBlur') setGlassBlur(value);
    if (key === 'accentColor') setAccentColor(value);
    updateUIStyle(key, value);

    try {
      await fetch(`${BACKEND_URL}/settings/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value })
      });
    } catch (err) {
      console.error('Error saving setting:', err);
    }
  };

  const handleZoomChange = async (newVal) => {
    setZoomLevel(newVal);
    document.documentElement.style.setProperty('--zoom-scale', newVal / 100);
    try {
      await fetch(`${BACKEND_URL}/settings/zoom`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ zoomLevel: newVal })
      });
    } catch (err) {
      console.error('Error saving zoom to backend:', err);
    }
  };

  useEffect(() => {
    document.documentElement.style.setProperty('--zoom-scale', zoomLevel / 100);
  }, [zoomLevel]);

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

    socket.on('system-metrics', (data) => setMetrics(data));
    socket.on('docker-containers', (containerList) => {
      setApps(containerList);
      setDockerError(null);
    });
    socket.on('docker-error', (msg) => setDockerError(msg));
    socket.on('container-log', (line) => {
      setLogLines(prev => [...prev.slice(-200), line]);
    });

    return () => socket.disconnect();
  }, []);

  // Cargar ajustes al inicio
  useEffect(() => {
    fetch(`${BACKEND_URL}/settings`)
      .then(res => res.json())
      .then(data => {
        if (data.wallpaper) setWallpaper(data.wallpaper);
        if (data.dashboardName) setDashboardName(data.dashboardName);
        if (data.serverPort) setServerPort(data.serverPort);
        if (data.frontendPort) setFrontendPort(data.frontendPort);
        if (data.zoomLevel) {
          setZoomLevel(data.zoomLevel);
          document.documentElement.style.setProperty('--zoom-scale', data.zoomLevel / 100);
        }
        if (data.glassOpacity) {
          setGlassOpacity(data.glassOpacity);
          document.documentElement.style.setProperty('--glass-opacity', data.glassOpacity / 100);
        }
        if (data.glassBlur) {
          setGlassBlur(data.glassBlur);
          document.documentElement.style.setProperty('--glass-blur', `${data.glassBlur}px`);
        }
        if (data.accentColor) {
          setAccentColor(data.accentColor);
          document.documentElement.style.setProperty('--accent-color', data.accentColor);
        }
      })
      .catch(err => console.error('Error cargando ajustes:', err));
  }, []);

  const handleSaveGeneralSettings = async (name, port, fPort) => {
    try {
      console.log(`[Settings] Intentando guardar con BACKEND_URL: ${BACKEND_URL}`);
      
      const res = await fetch(`${BACKEND_URL}/settings/general`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          dashboardName: name, 
          serverPort: port,
          frontendPort: fPort
        })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        // SOLO ahora que el servidor confirmó recepción lo guardamos localmente
        localStorage.setItem('homelab_api_port', port);
        
        setDashboardName(name);
        setServerPort(port);
        setFrontendPort(fPort);
        
        if (data.restartRequested) {
          alert("🚀 ¡Ajustes guardados! El servidor se está reiniciando en el nuevo puerto. La página se recargará en 3 segundos.");
          setTimeout(() => window.location.reload(), 3000);
        } else {
          alert("✅ Ajustes guardados correctamente");
        }
        return true;
      } else {
        alert("❌ Error del servidor: " + (data.error || "Desconocido"));
      }
    } catch (err) {
      console.error('[Fetch Error]', err);
      alert("❌ Fallo de conexión. Verifica que el servidor esté corriendo en el puerto actual o usa el botón de emergencia 'Resetear Conexión'.");
    }
    return false;
  };

  const handleResetConnection = () => {
    localStorage.removeItem('homelab_api_port');
    alert("🔄 Puerto local reseteado a 3001. Recargando...");
    window.location.reload();
  };

  const handleWallpaperUpload = async (file) => {
    const formData = new FormData();
    formData.append('wallpaper', file);
    
    try {
      const res = await fetch(`${BACKEND_URL}/settings/upload`, {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (res.ok) {
        setWallpaper(data.wallpaper);
        return true;
      } else {
        alert('❌ Error: ' + data.error);
      }
    } catch (err) {
      alert('❌ Error de conexión al subir imagen');
    }
    return false;
  };

  const handleResetWallpaper = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/settings/reset`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setWallpaper(data.wallpaper);
      }
    } catch (err) {
      alert('❌ Error al restablecer fondo');
    }
  };

  const openEdit = async (displayName, rawName, e) => {
    e.stopPropagation();
    try {
      const response = await fetch(`${BACKEND_URL}/apps/${rawName}/config`);
      const data = await response.json();
      if (response.ok) {
        setEditAppName(rawName);
        setEditFriendlyName(displayName);
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

  const filteredApps = apps.filter(app =>
    app.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return {
    apps,
    metrics,
    isInstallModalOpen, setIsInstallModalOpen,
    isLogsModalOpen, setIsLogsModalOpen,
    logsContainerName,
    logLines,
    dockerError,
    connected,
    searchQuery, setSearchQuery,
    time,
    wallpaper, setWallpaper,
    dashboardName, setDashboardName,
    serverPort, setServerPort,
    frontendPort, setFrontendPort,
    isSettingsModalOpen, setIsSettingsModalOpen,
    activeMenuId, setActiveMenuId,
    installName, setInstallName,
    installPort, setInstallPort,
    installCompose, setInstallCompose,
    isInstalling,
    isEditModalOpen, setIsEditModalOpen,
    editFriendlyName, setEditFriendlyName,
    editPort, setEditPort,
    editCompose, setEditCompose,
    isUpdating,
    logsEndRef,
    handleUpdate,
    handleDeploy,
    toggleStatus,
    deleteApp,
    openEdit,
    handleWallpaperUpload,
    handleResetWallpaper,
    handleSaveGeneralSettings,
    handleResetConnection,
    zoomLevel, handleZoomChange,
    glassOpacity, glassBlur, accentColor,
    handleUpdateSetting,
    BACKEND_URL,
    filteredApps
  };
};
