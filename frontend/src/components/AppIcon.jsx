import React, { useState } from 'react';
import { getAppIcon } from '../utils/appHelpers';

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

export default AppIcon;
