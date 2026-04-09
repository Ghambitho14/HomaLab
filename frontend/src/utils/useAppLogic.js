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
    openLogs,
    closeLogs,
    openEdit,
    filteredApps
  };
};
