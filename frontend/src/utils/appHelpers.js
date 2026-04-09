// Colores aleatorios por app (basados en el hash del nombre)
const appColors = ['#3b82f6', '#ec4899', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#0ea5e9', '#14b8a6'];

export const getAppColor = (name) => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return appColors[Math.abs(hash) % appColors.length];
};

// Íconos oficiales o SVG de respaldo
export const getAppIcon = (image, name) => {
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
