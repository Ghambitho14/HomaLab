// Configuración del Backend Dinámica
const savedApiPort = localStorage.getItem('homelab_api_port') || '3001';
export const BACKEND_URL = `http://${window.location.hostname}:${savedApiPort}`;
