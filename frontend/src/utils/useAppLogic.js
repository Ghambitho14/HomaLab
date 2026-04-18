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
  const [textColor, setTextColor] = useState('#f8fafc');
  const [textSecondaryColor, setTextSecondaryColor] = useState('#94a3b8');
  const [bgColor, setBgColor] = useState('#0b0f19');
  const [sidebarColor, setSidebarColor] = useState('#0b0f19');
  const [availableWallpapers, setAvailableWallpapers] = useState({ backgrounds: [], defaul: [] });

  // Colores de elementos de interfaz (sin opacidad, se aplica con --glass-opacity)
  const [navbarColor, setNavbarColor] = useState('');
  const [searchbarColor, setSearchbarColor] = useState('');
  const [widgetTimeColor, setWidgetTimeColor] = useState('');
  const [widgetSecondaryColor, setWidgetSecondaryColor] = useState('');
  const [sidebarPanelColor, setSidebarPanelColor] = useState('');
  const [brandLogoColor, setBrandLogoColor] = useState('#38bdf8');

  // Helper para convertir hex a rgba con opacidad
  const applyColorWithOpacity = (colorVar, colorHex, opacity) => {
    if (!colorHex || colorHex.trim() === '') {
      document.documentElement.style.removeProperty(colorVar);
      return;
    }
    const rgba = parseInt(colorHex.slice(1), 16);
    const r = (rgba >> 16) & 255;
    const g = (rgba >> 8) & 255;
    const b = rgba & 255;
    document.documentElement.style.setProperty(colorVar, `rgba(${r}, ${g}, ${b}, ${opacity / 100})`);
  };

  const updateUIStyle = (key, value) => {
    // Helper para reaplica colores con opacidad
    const reapplyAllColors = (opacity) => {
      applyColorWithOpacity('--navbar-color', navbarColor, opacity);
      applyColorWithOpacity('--searchbar-color', searchbarColor, opacity);
      applyColorWithOpacity('--widget-time-color', widgetTimeColor, opacity);
      applyColorWithOpacity('--widget-secondary-color', widgetSecondaryColor, opacity);
      applyColorWithOpacity('--sidebar-panel-color', sidebarPanelColor, opacity);
    };

    // Actualizar variables CSS
    switch(key) {
      case 'glassOpacity':
        document.documentElement.style.setProperty('--glass-opacity', value / 100);
        reapplyAllColors(value);
        break;
      case 'glassBlur':
        document.documentElement.style.setProperty('--glass-blur', `${value}px`);
        reapplyAllColors(glassOpacity);
        break;
      case 'accentColor':
        document.documentElement.style.setProperty('--accent-color', value);
        document.documentElement.style.setProperty('--accent-cyan', value);
        document.documentElement.style.setProperty('--accent-cyan-hover', value);
        break;
      case 'textColor':
        document.documentElement.style.setProperty('--text-color', value);
        document.documentElement.style.setProperty('--text-primary', value);
        break;
      case 'textSecondaryColor':
        document.documentElement.style.setProperty('--text-secondary', value);
        break;
      case 'bgColor':
        document.documentElement.style.setProperty('--bg-color', value);
        break;
      case 'sidebarColor':
        document.documentElement.style.setProperty('--sidebar-color', value);
        break;
      case 'navbarColor':
        setNavbarColor(value);
        applyColorWithOpacity('--navbar-color', value, glassOpacity);
        break;
      case 'searchbarColor':
        setSearchbarColor(value);
        applyColorWithOpacity('--searchbar-color', value, glassOpacity);
        break;
      case 'widgetTimeColor':
        setWidgetTimeColor(value);
        applyColorWithOpacity('--widget-time-color', value, glassOpacity);
        break;
      case 'widgetSecondaryColor':
        setWidgetSecondaryColor(value);
        applyColorWithOpacity('--widget-secondary-color', value, glassOpacity);
        break;
      case 'sidebarPanelColor':
        setSidebarPanelColor(value);
        applyColorWithOpacity('--sidebar-panel-color', value, glassOpacity);
        break;
      case 'brandLogoColor':
        document.documentElement.style.setProperty('--brand-logo-color', value);
        break;
      default:
        break;
    }
  };

  const handleUpdateSetting = async (key, value) => {
    // Actualizar estilo global (esto también actualiza el estado)
    updateUIStyle(key, value);
    
    // Actualizar resto de estados locales si es necesario
    if (key === 'glassOpacity') setGlassOpacity(value);
    if (key === 'glassBlur') setGlassBlur(value);
    if (key === 'accentColor') setAccentColor(value);
    if (key === 'textColor') setTextColor(value);
    if (key === 'textSecondaryColor') setTextSecondaryColor(value);
    if (key === 'bgColor') setBgColor(value);
    if (key === 'sidebarColor') setSidebarColor(value);
    if (key === 'brandLogoColor') setBrandLogoColor(value);

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
  const [installEnvironment, setInstallEnvironment] = useState([{ key: '', value: '' }]);
  const [isInstalling, setIsInstalling] = useState(false);

  // Estados de edición
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editAppName, setEditAppName] = useState('');
  const [editFriendlyName, setEditFriendlyName] = useState('');
  const [editPort, setEditPort] = useState('');
  const [editCompose, setEditCompose] = useState('');
  const [editEnvironment, setEditEnvironment] = useState([{ key: '', value: '' }]);
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
        const w = data.wallpaper;
        if (w != null && String(w).trim() !== '') setWallpaper(w);
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
          document.documentElement.style.setProperty('--accent-cyan', data.accentColor);
          document.documentElement.style.setProperty('--accent-cyan-hover', data.accentColor);
        }
        if (data.textColor) {
          setTextColor(data.textColor);
          document.documentElement.style.setProperty('--text-color', data.textColor);
          document.documentElement.style.setProperty('--text-primary', data.textColor);
        }
        if (data.sidebarColor) {
          setSidebarColor(data.sidebarColor);
          document.documentElement.style.setProperty('--sidebar-color', data.sidebarColor);
        }
        if (data.textSecondaryColor) {
          setTextSecondaryColor(data.textSecondaryColor);
          document.documentElement.style.setProperty('--text-secondary', data.textSecondaryColor);
        }
        if (data.bgColor) {
          setBgColor(data.bgColor);
          document.documentElement.style.setProperty('--bg-color', data.bgColor);
        }
        if (data.navbarColor) {
          setNavbarColor(data.navbarColor);
          applyColorWithOpacity('--navbar-color', data.navbarColor, data.glassOpacity || 40);
        }
        if (data.searchbarColor) {
          setSearchbarColor(data.searchbarColor);
          applyColorWithOpacity('--searchbar-color', data.searchbarColor, data.glassOpacity || 40);
        }
        if (data.widgetTimeColor) {
          setWidgetTimeColor(data.widgetTimeColor);
          applyColorWithOpacity('--widget-time-color', data.widgetTimeColor, data.glassOpacity || 40);
        }
        if (data.widgetSecondaryColor) {
          setWidgetSecondaryColor(data.widgetSecondaryColor);
          applyColorWithOpacity('--widget-secondary-color', data.widgetSecondaryColor, data.glassOpacity || 40);
        }
        if (data.sidebarPanelColor) {
          setSidebarPanelColor(data.sidebarPanelColor);
          applyColorWithOpacity('--sidebar-panel-color', data.sidebarPanelColor, data.glassOpacity || 40);
        }
        if (data.brandLogoColor) {
          setBrandLogoColor(data.brandLogoColor);
          document.documentElement.style.setProperty('--brand-logo-color', data.brandLogoColor);
        }
      })
      .then(() => {
        return fetch(`${BACKEND_URL}/settings/wallpapers`);
      })
      .then(res => res.json())
      .then((wpData) => {
        setAvailableWallpapers(wpData);
        const first = wpData.backgrounds?.[0];
        if (first) {
          setWallpaper((prev) => (prev != null && String(prev).trim() !== '' ? prev : first));
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

  const handleWallpaperUpload = async (fileOrPath) => {
    if (typeof fileOrPath === 'string') {
      try {
        const res = await fetch(`${BACKEND_URL}/settings/update`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key: 'wallpaper', value: fileOrPath })
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok) {
          setWallpaper(fileOrPath);
          return true;
        }
        alert('❌ Error: ' + (data.error || res.statusText));
      } catch (_err) {
        alert('❌ Error de conexión al elegir fondo');
      }
      return false;
    }

    const formData = new FormData();
    formData.append('wallpaper', fileOrPath);

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
    } catch (_err) {
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
    } catch (_err) {
      alert('❌ Error al restablecer fondo');
    }
  };

  const handleSetWallpaperAsDefault = async (wallpaperPath) => {
    try {
      const res = await fetch(`${BACKEND_URL}/settings/wallpaper/set-default`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallpaper: wallpaperPath })
      });
      const data = await res.json();
      if (res.ok) {
        setWallpaper(data.wallpaper);
      }
    } catch (_err) {
      alert('❌ Error al establecer default');
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
        
        // Cargar variables de entorno si existen
        if (data.environment && Object.keys(data.environment).length > 0) {
          const envArray = Object.entries(data.environment).map(([key, value]) => ({
            key,
            value: String(value)
          }));
          setEditEnvironment(envArray.length > 0 ? envArray : [{ key: '', value: '' }]);
        } else {
          setEditEnvironment([{ key: '', value: '' }]);
        }
        
        setIsEditModalOpen(true);
      } else {
        alert('❌ Error al cargar configuración: ' + data.error);
      }
    } catch (_err) {
      alert('❌ Error de conexión');
    }
  };

  const handleUpdate = async () => {
    // Convertir array de variables en objeto
    const environment = {};
    editEnvironment.forEach(({ key, value }) => {
      if (key.trim() !== '') {
        environment[key.trim()] = value;
      }
    });

    setIsUpdating(true);
    try {
      const response = await fetch(`${BACKEND_URL}/apps/${editAppName}/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          composeContent: editCompose,
          newName: editFriendlyName,
          newPort: editPort,
          environment: environment
        })
      });

      const data = await response.json();
      if (response.ok) {
        alert('✅ Configuración actualizada y app re-desplegada');
        setIsEditModalOpen(false);
        setEditEnvironment([{ key: '', value: '' }]);
      } else {
        alert('❌ Error: ' + data.error);
      }
    } catch (_err) {
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

    // Convertir array de variables en objeto, filtrando vacíos
    const environment = {};
    installEnvironment.forEach(({ key, value }) => {
      if (key.trim() !== '') {
        environment[key.trim()] = value;
      }
    });

    setIsInstalling(true);
    try {
      const response = await fetch(`${BACKEND_URL}/apps/install`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: installName,
          port: installPort,
          composeContent: installCompose,
          environment: environment
        })
      });

      const data = await response.json();
      if (response.ok) {
        alert('✅ App desplegada correctamente');
        setIsInstallModalOpen(false);
        setInstallName('');
        setInstallPort('');
        setInstallCompose('');
        setInstallEnvironment([{ key: '', value: '' }]);
      } else {
        alert('❌ Error: ' + data.error);
      }
    } catch (_err) {
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

  // Estado para apps ocultas
  const [hiddenApps, setHiddenApps] = useState([]);

  // Cargar apps ocultas al inicio
  useEffect(() => {
    fetch(`${BACKEND_URL}/settings`)
      .then(res => res.json())
      .then(data => {
        if (data.hiddenApps && Array.isArray(data.hiddenApps)) {
          setHiddenApps(data.hiddenApps);
        }
      })
      .catch(err => console.error('Error cargando apps ocultas:', err));
  }, []);

  // Función para ocultar/mostrar app
  const toggleHideApp = async (appId, isHidden) => {
    const newHiddenApps = isHidden 
      ? [...hiddenApps, appId]
      : hiddenApps.filter(id => id !== appId);
    
    setHiddenApps(newHiddenApps);
    
    // Guardar en backend
    try {
      await fetch(`${BACKEND_URL}/settings/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'hiddenApps', value: newHiddenApps })
      });
    } catch (err) {
      console.error('Error guardando apps ocultas:', err);
    }
  };

  // Filtrar apps visibles (excluyendo ocultas)
  const visibleApps = apps.filter(app =>
    !hiddenApps.includes(app.id) &&
    app.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Apps ocultas
  const hiddenAppsList = apps.filter(app =>
    hiddenApps.includes(app.id) &&
    app.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Combinar para mantener compatibilidad con código existente
  const filteredApps = visibleApps;

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
    installEnvironment, setInstallEnvironment,
    isInstalling,
    isEditModalOpen, setIsEditModalOpen,
    editFriendlyName, setEditFriendlyName,
    editPort, setEditPort,
    editCompose, setEditCompose,
    editEnvironment, setEditEnvironment,
    isUpdating,
    logsEndRef,
    handleUpdate,
    handleDeploy,
    toggleStatus,
    deleteApp,
    openEdit,
    openLogs,
    closeLogs,
    handleWallpaperUpload,
    handleResetWallpaper,
    handleSaveGeneralSettings,
    handleResetConnection,
    zoomLevel, handleZoomChange,
    glassOpacity, glassBlur, accentColor, textColor, textSecondaryColor, bgColor, sidebarColor,
    navbarColor, searchbarColor, widgetTimeColor, widgetSecondaryColor, sidebarPanelColor, brandLogoColor,
    handleUpdateSetting,
    availableWallpapers, handleSetWallpaperAsDefault,
    BACKEND_URL,
    filteredApps,
    hiddenApps,
    hiddenAppsList,
    toggleHideApp
  };
};
