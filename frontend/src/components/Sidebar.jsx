import React from 'react';
import { formatBytes, formatSpeed } from '../utils/formatters';
import '../style/Sidebar.css';
import CalendarWidget from './CalendarWidget';

const Sidebar = ({ time, metrics, openEdit }) => {
  const formatTime = (date) => date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  const formatDate = (date) => date.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  // Valores de métricas (con fallback)
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

  return (
    <aside className="sidebar">
      {/* Time Widget */}
      <div className="widget widget-time glass-panel blur-heavy">
        <button 
          className="widget-edit-btn"
          onClick={(e) => { e.stopPropagation(); openEdit('Calendario', 'widget-time', e); }}
          title="Editar widget"
        >
          ⚙️
        </button>
        <h2>{formatTime(time)}</h2>
        <p>{formatDate(time)}</p>
        <CalendarWidget date={time} />
      </div>

      {/* System Status Widget */}
      <div className="widget glass-panel blur-heavy">
        <button 
          className="widget-edit-btn"
          onClick={(e) => { e.stopPropagation(); openEdit('Estado del sistema', 'widget-system', e); }}
          title="Editar widget"
        >
          ⚙️
        </button>
        <div className="widget-header">
          <h3>Estado del sistema</h3>
        </div>
        <div className="meters">
          <div className="meter meter-cpu">
            <svg viewBox="0 0 36 36" className="circular-chart">
              <path className="circle-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
              <path className="circle" strokeDasharray={`${cpuLoad}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" style={{ stroke: '#38bdf8' }} />
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
        <button 
          className="widget-edit-btn"
          onClick={(e) => { e.stopPropagation(); openEdit('Almacenamiento', 'widget-storage', e); }}
          title="Editar widget"
        >
          ⚙️
        </button>
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
        <button 
          className="widget-edit-btn"
          onClick={(e) => { e.stopPropagation(); openEdit('Estado de la red', 'widget-network', e); }}
          title="Editar widget"
        >
          ⚙️
        </button>
        <div className="widget-header">
          <h3>Estado de la red</h3>
        </div>
        <div className="network-stats">
          <span className="up">↑ {formatSpeed(netUp)}</span>
          <span className="down">↓ {formatSpeed(netDown)}</span>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
