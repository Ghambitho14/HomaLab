import React, { useState, useEffect, useRef } from 'react';
import '../style/SecurityPanel.css';

const SecurityPanel = () => {
  const [logs, setLogs] = useState([
    { id: 1, timestamp: '15:07:22', type: 'info', message: 'Aplicación iniciada correctamente' },
    { id: 2, timestamp: '15:07:25', type: 'success', message: 'Conexión con servidor establecida' },
    { id: 3, timestamp: '15:07:30', type: 'info', message: 'Cargando datos del dashboard' },
  ]);

  const [terminalInput, setTerminalInput] = useState('');
  const [terminalOutput, setTerminalOutput] = useState([
    { id: 1, type: 'output', text: 'Terminal conectada al servidor' },
    { id: 2, type: 'output', text: '> ' }
  ]);
  const terminalEndRef = useRef(null);
  const logsEndRef = useRef(null);

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [terminalOutput]);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const handleTerminalCommand = (e) => {
    if (e.key === 'Enter') {
      if (!terminalInput.trim()) return;

      const newOutput = [
        ...terminalOutput.slice(0, -1),
        { id: terminalOutput.length, type: 'input', text: `> ${terminalInput}` },
        { id: terminalOutput.length + 1, type: 'output', text: `Comando ejecutado: ${terminalInput}` },
        { id: terminalOutput.length + 2, type: 'output', text: '> ' }
      ];
      
      setTerminalOutput(newOutput);
      setTerminalInput('');
    }
  };

  return (
    <div className="security-panel">
      <div className="security-content-grid">
        {/* Panel de Logs - Izquierda */}
        <div className="security-section logs-section">
          <div className="logs-header">
            <h3>📋 Logs de la App</h3>
          </div>
          <div className="logs-container">
            {logs.map((log) => (
              <div key={log.id} className={`log-item log-${log.type}`}>
                <span className="log-time">{log.timestamp}</span>
                <span className="log-icon">
                  {log.type === 'info' && 'ℹ️'}
                  {log.type === 'success' && '✓'}
                  {log.type === 'warning' && '⚠️'}
                  {log.type === 'error' && '✕'}
                </span>
                <span className="log-message">{log.message}</span>
              </div>
            ))}
            <div ref={logsEndRef} />
          </div>
        </div>

        {/* Terminal - Centro */}
        <div className="security-section terminal-section">
          <div className="terminal-header">
            <h3>💻 Terminal del Servidor</h3>
          </div>
          <div className="terminal-container">
            {terminalOutput.map((line) => (
              <div key={line.id} className={`terminal-line terminal-${line.type}`}>
                {line.text}
              </div>
            ))}
            <div ref={terminalEndRef} />
          </div>
          <div className="terminal-input-wrapper">
            <input
              type="text"
              className="terminal-input"
              value={terminalInput}
              onChange={(e) => setTerminalInput(e.target.value)}
              onKeyPress={handleTerminalCommand}
              placeholder="Escribe un comando..."
              autoFocus
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SecurityPanel;
