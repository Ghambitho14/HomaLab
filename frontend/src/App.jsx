import React, { useState } from 'react';
import { useAppLogic } from './utils/useAppLogic';

// UI Components
import Navbar from './components/Navbar.jsx';
import SecurityPanel from './components/SecurityPanel.jsx';
import SearchBar from './components/SearchBar.jsx';
import AppCard from './components/AppCard.jsx';
import Sidebar from './components/Sidebar.jsx';
import Modals from './components/Modals.jsx';

// Styles
import './App.css';

import { BACKEND_URL } from './utils/constants';

function App() {
  const logic = useAppLogic();
  const [activePanel, setActivePanel] = useState('dashboard');

  const wallpaperUrl = logic.wallpaper?.startsWith('/') 
    ? `${BACKEND_URL}${logic.wallpaper}` 
    : logic.wallpaper;

  const appStyle = {
    backgroundImage: logic.wallpaper && String(logic.wallpaper).trim() !== '' ? `url(${wallpaperUrl})` : 'none',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundAttachment: 'fixed',
    transition: 'background-image 0.5s ease-in-out'
  };

  return (
    <div className="app-wrapper" style={appStyle}>
      <div className="layout">
        {activePanel === 'security' ? (
          // Security Panel - Solo panel sin navbar ni sidebar
          <div className="main-wrapper security-view">
            <main className="main-content">
              <SecurityPanel />
            </main>
          </div>
        ) : (
          // Dashboard View - Con navbar y sidebar
          <>
            <div className="main-wrapper">
              {/* Top Navbar */}
              <Navbar 
                connected={logic.connected} 
                dockerError={logic.dockerError} 
                onOpenSettings={() => logic.setIsSettingsModalOpen(true)}
                dashboardName={logic.dashboardName}
              />

              {/* Main Content Area */}
              <main className="main-content">
                {/* Search Bar */}
                <SearchBar 
                  searchQuery={logic.searchQuery} 
                  setSearchQuery={logic.setSearchQuery} 
                />

                {/* Apps Sections grouped by category */}
                <div className="apps-container">
                  {Object.entries(
                    logic.filteredApps.reduce((acc, app) => {
                      const cat = app.category || 'Otros';
                      if (!acc[cat]) acc[cat] = [];
                      acc[cat].push(app);
                      return acc;
                    }, {})
                  ).map(([category, apps]) => (
                    <div key={category} className="category-section">
                      <div className="apps-header">
                        <h2>{category} ({apps.length})</h2>
                        {category === 'Docker' && (
                          <button 
                            className="add-app-btn" 
                            onClick={() => logic.setIsInstallModalOpen(true)}
                          >
                            +
                          </button>
                        )}
                      </div>
                      
                      <div className="apps-grid">
                        {apps.map(app => (
                          <AppCard 
                            key={app.id}
                            app={app}
                            activeMenuId={logic.activeMenuId}
                            setActiveMenuId={logic.setActiveMenuId}
                            toggleStatus={logic.toggleStatus}
                            openEdit={logic.openEdit}
                            openLogs={logic.openLogs}
                            deleteApp={logic.deleteApp}
                            isHidden={logic.hiddenApps.includes(app.id)}
                            onToggleHide={logic.toggleHideApp}
                          />
                        ))}
                      </div>
                    </div>
                  ))}

                  {/* SECCIÓN DE APPS OCULTAS */}
                  {logic.hiddenAppsList.length > 0 && (
                    <div className="category-section hidden-section">
                      <div className="apps-header">
                        <h2>🙈 Ocultas ({logic.hiddenAppsList.length})</h2>
                      </div>
                      
                      <div className="apps-grid">
                        {logic.hiddenAppsList.map(app => (
                          <AppCard 
                            key={app.id}
                            app={app}
                            activeMenuId={logic.activeMenuId}
                            setActiveMenuId={logic.setActiveMenuId}
                            toggleStatus={logic.toggleStatus}
                            openEdit={logic.openEdit}
                            openLogs={logic.openLogs}
                            deleteApp={logic.deleteApp}
                            isHidden={true}
                            onToggleHide={logic.toggleHideApp}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {logic.filteredApps.length === 0 && logic.hiddenAppsList.length === 0 && !logic.dockerError && (
                    <div className="empty-state glass-panel blur-medium">
                      <p>
                        {logic.connected 
                          ? '🐳 No hay aplicaciones detectadas' 
                          : '⏳ Conectando al servidor...'}
                      </p>
                    </div>
                  )}
                </div>
              </main>
            </div>

            {/* Sidebar on the RIGHT */}
            <Sidebar 
              time={logic.time} 
              metrics={logic.metrics}
              openEdit={logic.openEdit}
            />
          </>
        )}
      </div>

      {/* Modals Layer */}
      <Modals 
        {...logic}
      />
    </div>
  );
}

export default App;
