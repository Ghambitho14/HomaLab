import React from 'react';
import { useAppLogic } from './utils/useAppLogic';

// UI Components
import Navbar from './Components/Navbar';
import SearchBar from './Components/SearchBar';
import AppCard from './Components/AppCard';
import Sidebar from './Components/Sidebar';
import Modals from './Components/Modals';

// Styles
import './App.css';

function App() {
  const logic = useAppLogic();

  return (
    <div className="app-wrapper">
      <div className="layout">
        <div className="main-wrapper">
          {/* Top Navbar */}
          <Navbar 
            connected={logic.connected} 
            dockerError={logic.dockerError} 
          />

          {/* Main Content Area */}
          <main className="main-content">
            {/* Search Bar */}
            <SearchBar 
              searchQuery={logic.searchQuery} 
              setSearchQuery={logic.setSearchQuery} 
            />

            {/* Apps Section */}
            <div className="apps-section">
              <div className="apps-header">
                <h2>Contenedores ({logic.filteredApps.length})</h2>
                <button 
                  className="add-app-btn" 
                  onClick={() => logic.setIsInstallModalOpen(true)}
                >
                  +
                </button>
              </div>

              {logic.filteredApps.length === 0 && !logic.dockerError && (
                <div className="empty-state glass-panel blur-medium">
                  <p>
                    {logic.connected 
                      ? '🐳 No hay contenedores Docker en ejecución' 
                      : '⏳ Conectando al servidor...'}
                  </p>
                </div>
              )}
              
              <div className="apps-grid">
                {logic.filteredApps.map(app => (
                  <AppCard 
                    key={app.id}
                    app={app}
                    activeMenuId={logic.activeMenuId}
                    setActiveMenuId={logic.setActiveMenuId}
                    toggleStatus={logic.toggleStatus}
                    openEdit={logic.openEdit}
                    openLogs={logic.openLogs}
                    deleteApp={logic.deleteApp}
                  />
                ))}
              </div>
            </div>
          </main>
        </div>

        {/* Sidebar on the RIGHT */}
        <Sidebar 
          time={logic.time} 
          metrics={logic.metrics} 
        />
      </div>

      {/* Modals Layer */}
      <Modals 
        {...logic}
      />
    </div>
  );
}

export default App;
