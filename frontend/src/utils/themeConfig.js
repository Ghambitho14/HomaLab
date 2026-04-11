export const themes = {
  dark: {
    name: 'Oscuro',
    icon: '🌙',
    colors: {
      '--glass-opacity': '0.4',
      '--glass-blur': '16px',
      '--accent-color': '#38bdf8',
      '--text-color': '#f8fafc',
      '--text-primary': '#f8fafc',
      '--text-secondary': 'rgba(255, 255, 255, 0.7)',
      '--sidebar-color': '#0b0f19',
      '--navbar-color': 'rgba(30, 35, 50, 0.4)',
      '--panel-color': 'rgba(30, 35, 50, 0.3)',
      '--background': '#0a0e18',
    }
  },
  neon: {
    name: 'Neón',
    icon: '⚡',
    colors: {
      '--glass-opacity': '0.5',
      '--glass-blur': '20px',
      '--accent-color': '#00ff88',
      '--text-color': '#00ff88',
      '--text-primary': '#00ff88',
      '--text-secondary': 'rgba(0, 255, 136, 0.7)',
      '--sidebar-color': '#0d1a15',
      '--navbar-color': 'rgba(13, 26, 21, 0.6)',
      '--panel-color': 'rgba(13, 26, 21, 0.5)',
      '--background': '#050f0a',
    }
  },
  purple: {
    name: 'Púrpura',
    icon: '💜',
    colors: {
      '--glass-opacity': '0.45',
      '--glass-blur': '18px',
      '--accent-color': '#a78bfa',
      '--text-color': '#e9d5ff',
      '--text-primary': '#e9d5ff',
      '--text-secondary': 'rgba(233, 213, 255, 0.7)',
      '--sidebar-color': '#1e1b4b',
      '--navbar-color': 'rgba(30, 27, 75, 0.5)',
      '--panel-color': 'rgba(30, 27, 75, 0.4)',
      '--background': '#14111f',
    }
  },
  ocean: {
    name: 'Océano',
    icon: '🌊',
    colors: {
      '--glass-opacity': '0.4',
      '--glass-blur': '16px',
      '--accent-color': '#06b6d4',
      '--text-color': '#cffafe',
      '--text-primary': '#cffafe',
      '--text-secondary': 'rgba(207, 250, 254, 0.7)',
      '--sidebar-color': '#082f49',
      '--navbar-color': 'rgba(8, 47, 73, 0.5)',
      '--panel-color': 'rgba(8, 47, 73, 0.4)',
      '--background': '#051119',
    }
  },
  sunset: {
    name: 'Atardecer',
    icon: '🌅',
    colors: {
      '--glass-opacity': '0.45',
      '--glass-blur': '18px',
      '--accent-color': '#f97316',
      '--text-color': '#fed7aa',
      '--text-primary': '#fed7aa',
      '--text-secondary': 'rgba(254, 215, 170, 0.7)',
      '--sidebar-color': '#3d1f00',
      '--navbar-color': 'rgba(61, 31, 0, 0.6)',
      '--panel-color': 'rgba(61, 31, 0, 0.5)',
      '--background': '#1a0d00',
    }
  },
};

export const applyTheme = (themeName) => {
  const theme = themes[themeName];
  if (!theme) return;
  
  Object.entries(theme.colors).forEach(([key, value]) => {
    document.documentElement.style.setProperty(key, value);
  });
  
  localStorage.setItem('selectedTheme', themeName);
};

export const getTheme = () => {
  return localStorage.getItem('selectedTheme') || 'dark';
};

export const initializeTheme = () => {
  const savedTheme = getTheme();
  applyTheme(savedTheme);
};
