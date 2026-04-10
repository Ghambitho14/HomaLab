const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const si = require('systeminformation');
const Docker = require('dockerode');
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const { execSync } = require('child_process');
require('dotenv').config();

const multer = require('multer');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const server = http.createServer(app);

// Directorios necesarios
const APPS_DIR = path.join(__dirname, 'apps');
const UPLOADS_DIR = path.join(__dirname, 'uploads/backgrounds');
const SETTINGS_FILE = path.join(__dirname, 'settings.json');
const DB_FILE = path.join(__dirname, 'homelab.db');

// Iniciar base de datos
const db = new sqlite3.Database(DB_FILE, (err) => {
  if (err) console.error('[SQLite] Error al conectar:', err.message);
  else console.log('[SQLite] Conectado a homelab.db');
});

// Crear tabla de ajustes si no existe
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
  )`);
  
  // Migrar de settings.json a SQLite si existe settings.json y la tabla está vacía
  db.get("SELECT COUNT(*) as count FROM settings", (err, row) => {
    if (!err && row.count === 0 && fs.existsSync(SETTINGS_FILE)) {
      try {
        const settings = JSON.parse(fs.readFileSync(SETTINGS_FILE));
        Object.entries(settings).forEach(([key, value]) => {
          db.run("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)", [key, JSON.stringify(value)]);
        });
        console.log('[SQLite] Migración de settings.json completada');
      } catch (e) {
        console.error('[SQLite] Error en migración:', e);
      }
    }
  });
});

const getSetting = (key, defaultValue) => {
  return new Promise((resolve) => {
    db.get("SELECT value FROM settings WHERE key = ?", [key], (err, row) => {
      if (err || !row) resolve(defaultValue);
      else {
        try { resolve(JSON.parse(row.value)); }
        catch (e) { resolve(row.value); }
      }
    });
  });
};

const saveSetting = (key, value) => {
  return new Promise((resolve, reject) => {
    db.run("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)", [key, JSON.stringify(value)], (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
};

if (!fs.existsSync(APPS_DIR)) fs.mkdirSync(APPS_DIR);
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

// Configuración de Multer para wallpapers
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `wallpaper_${Date.now()}${ext}`);
  }
});
const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // Límite 10MB
});

// Initialize Socket.io with CORS supporting our local Vite frontend
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ==========================================
// ENDPOINTS: Ajustes y Personalización
// ==========================================

app.get('/settings', async (req, res) => {
  try {
    db.all("SELECT key, value FROM settings", (err, rows) => {
      if (err) return res.status(500).json({ error: 'Error al leer base de datos' });
      
      const settings = {};
      rows.forEach(row => {
        try { settings[row.key] = JSON.parse(row.value); }
        catch (e) { settings[row.key] = row.value; }
      });

      // Valores por defecto si no existen
      if (!settings.wallpaper) settings.wallpaper = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop";
      if (!settings.dashboardName) settings.dashboardName = "HomaLab";
      if (!settings.serverPort) settings.serverPort = 3001;
      if (settings.zoomLevel === undefined) settings.zoomLevel = 100;

      res.json(settings);
    });
  } catch (err) {
    res.status(500).json({ error: 'Error al procesar ajustes' });
  }
});

app.post('/settings/upload', upload.single('wallpaper'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No se subió ningún archivo' });
  
  try {
    const wallpaperUrl = `/uploads/backgrounds/${req.file.filename}`;
    await saveSetting('wallpaper', wallpaperUrl);
    await saveSetting('isLocal', true);
    
    res.json({ message: 'Fondo de pantalla actualizado', wallpaper: wallpaperUrl });
  } catch (err) {
    res.status(500).json({ error: 'Error al guardar ajustes' });
  }
});

app.post('/settings/general', async (req, res) => {
  const { dashboardName, serverPort, frontendPort } = req.body;
  try {
    const oldServerPort = await getSetting('serverPort', 3001);
    const oldFrontendPort = await getSetting('frontendPort', 5173);
    
    await saveSetting('dashboardName', dashboardName || "HomaLab");
    await saveSetting('serverPort', parseInt(serverPort) || 3001);
    await saveSetting('frontendPort', parseInt(frontendPort) || 5173);
    
    // Sincronizar con settings.json por legado si es necesario
    const currentSettings = {
      dashboardName: dashboardName || "HomaLab",
      serverPort: parseInt(serverPort) || 3001,
      frontendPort: parseInt(frontendPort) || 5173,
      wallpaper: await getSetting('wallpaper', '')
    };
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(currentSettings, null, 2));

    // 1. Actualizar vite.config.js si cambió el puerto del frontend
    if (oldFrontendPort != frontendPort) {
      const viteConfigPath = path.join(__dirname, '../frontend/vite.config.js');
      if (fs.existsSync(viteConfigPath)) {
        let content = fs.readFileSync(viteConfigPath, 'utf8');
        if (content.includes('port:')) {
          content = content.replace(/port:\s*\d+/, `port: ${frontendPort}`);
        } else if (content.includes('server: {')) {
          content = content.replace(/server:\s*{/, `server: {\n    port: ${frontendPort},`);
        }
        fs.writeFileSync(viteConfigPath, content);
      }
    }

    const portChanged = oldServerPort != serverPort;
    res.json({ 
      success: true,
      message: portChanged ? 'Restaurando... El servidor está cambiando al nuevo puerto.' : 'Ajustes guardados correctamente',
      restartRequested: portChanged
    });

    if (portChanged) {
      setTimeout(() => process.exit(0), 1000);
    }
  } catch (err) {
    res.status(500).json({ error: 'Fallo al guardar ajustes' });
  }
});

app.post('/settings/zoom', async (req, res) => {
  const { zoomLevel } = req.body;
  try {
    await saveSetting('zoomLevel', parseInt(zoomLevel) || 100);
    res.json({ success: true, zoomLevel });
  } catch (err) {
    res.status(500).json({ error: 'Error al guardar zoom' });
  }
});

app.post('/settings/reset', async (req, res) => {
  try {
    const originalWallpaper = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop";
    await saveSetting('wallpaper', originalWallpaper);
    await saveSetting('isLocal', false);
    res.json({ message: 'Fondo de pantalla restablecido', wallpaper: originalWallpaper });
  } catch (err) {
    res.status(500).json({ error: 'Error al restablecer ajustes' });
  }
});

// ==========================================
// ENDPOINT: Instalación de Apps (HTTP)
// ==========================================
app.post('/apps/install', async (req, res) => {
  const { name, port, composeContent } = req.body;

  if (!name || !port || !composeContent) {
    return res.status(400).json({ error: 'Faltan campos obligatorios (name, port, composeContent)' });
  }

  try {
    // Validación: ¿Puerto en uso por Docker?
    const containers = await docker.listContainers({ all: true });
    const portInUse = containers.some(c => 
      c.Ports && c.Ports.some(p => p.PublicPort == port)
    );

    if (portInUse) {
      return res.status(400).json({ error: `El puerto ${port} ya está siendo utilizado por otro contenedor.` });
    }

    const appDir = path.join(APPS_DIR, name);
    const composePath = path.join(appDir, 'docker-compose.yml');
    // 1. Crear carpeta de la app
    if (!fs.existsSync(appDir)) fs.mkdirSync(appDir, { recursive: true });

    // 2. Parsear YAML e inyectar puerto
    const doc = yaml.load(composeContent);
    const serviceName = Object.keys(doc.services)[0]; // Tomamos el primer servicio
    
    if (!doc.services[serviceName].ports) {
      doc.services[serviceName].ports = [];
    }
    
    // El formato esperado es [puertoHost:puertoInterno]
    // Intentamos detectar el puerto interno si ya existe, si no asumimos 80 (por defecto para muchas apps)
    let internalPort = '80';
    if (doc.services[serviceName].ports && doc.services[serviceName].ports.length > 0) {
      const firstPort = doc.services[serviceName].ports[0].toString();
      internalPort = firstPort.includes(':') ? firstPort.split(':')[1] : firstPort;
    }
    
    doc.services[serviceName].ports = [`${port}:${internalPort}`];
    
    // MEJORA: Inyectar etiqueta de nombre amigable
    if (!doc.services[serviceName].labels) doc.services[serviceName].labels = {};
    if (Array.isArray(doc.services[serviceName].labels)) {
      doc.services[serviceName].labels.push(`homelab.name=${name}`);
    } else {
      doc.services[serviceName].labels['homelab.name'] = name;
    }
    
    // 3. Guardar archivo modificado
    fs.writeFileSync(composePath, yaml.dump(doc));

    // 4. Ejecutar docker compose up -d
    console.log(`[Instalando] ${name} en puerto ${port}...`);
    execSync('docker compose up -d', { cwd: appDir });

    res.json({ message: `App ${name} desplegada con éxito en el puerto ${port}` });
  } catch (error) {
    console.error(`[Error Instalación ${name}]`, error.message);
    res.status(500).json({ error: error.message });
  }
});

// Initialize Dockerode
// Por defecto se conecta al socket unix /var/run/docker.sock (Linux/Mac) 
// o un pipe con nombre en Windows (//./pipe/docker_engine)
const docker = new Docker();

// ==========================================
// BACKGROUND TASK: Ticker de Métricas del Sistema (Cada 2 segundos)
// ==========================================
setInterval(async () => {
  try {
    // 1. Obtener carga CPU (%) y Temperaturas
    const load = await si.currentLoad();
    const cpuTemp = await si.cpuTemperature();
    
    // 2. Obtener Memoria RAM consumida
    const mem = await si.mem();

    // 3. Almacenamiento (tomamos el principal o montado en '/')
    const fsSize = await si.fsSize();
    const mainDisk = fsSize.find(d => d.mount === '/' || d.mount === 'C:') || fsSize[0];

    // 4. Métrica de Red
    const networkInfo = await si.networkStats();
    // Sumar interfaces activas 
    const rxSec = networkInfo.reduce((acc, curr) => acc + (curr.rx_sec || 0), 0);
    const txSec = networkInfo.reduce((acc, curr) => acc + (curr.tx_sec || 0), 0);

    // Emisión de las métricas puras al cliente
    io.emit('system-metrics', {
      cpu: {
        load: load.currentLoad,
        temp: cpuTemp.main
      },
      ram: {
        used: mem.active, // bytes
        total: mem.total
      },
      disk: {
        used: mainDisk ? mainDisk.used : 0,
        total: mainDisk ? mainDisk.size : 0,
        health: 'Saludable' // En un futuro se puede sacar con S.M.A.R.T.
      },
      network: {
        rx_sec: rxSec, // bajada / sec
        tx_sec: txSec  // subida / sec
      }
    });

  } catch (error) {
    console.error('[Error de Métricas]', error.message);
  }
}, 2000); // Actualiza cada 2 segundos para no ahogar la máquina

// ==========================================
// BACKGROUND TASK: Ticker de Contenedores Docker + Auto-Descubrimiento (Stateless)
// ==========================================
let nativeApps = [];

// Intervalo separado para descubrimiento de servicios nativos (más pesado, cada 10s)
setInterval(async () => {
  try {
    const connections = await si.networkConnections();
    const processes = await si.processes();
    const found = [];

    // 1. Detectar Coolify (Puerto 8000 o procesos relacionados)
    const hasCoolifyProc = processes.list.some(p => p.name.toLowerCase().includes('coolify'));
    const hasCoolifyPort = connections.some(c => c.localPort === 8000 && c.state === 'LISTEN');
    
    if (hasCoolifyProc || hasCoolifyPort) {
      found.push({
        id: 'native-coolify',
        name: 'Coolify',
        rawName: 'coolify',
        status: 'running',
        port: '8000',
        image: 'native-service',
        isManaged: false,
        isSystem: true,
        category: 'Infraestructura',
        type: 'native'
      });
    }

    // 2. Detectar otros servicios comunes (ej: Nginx nativo)
    const hasNginx = processes.list.some(p => p.name.toLowerCase() === 'nginx');
    if (hasNginx) {
      found.push({
        id: 'native-nginx',
        name: 'Nginx Local',
        rawName: 'nginx',
        status: 'running',
        port: '80',
        image: 'native-service',
        isManaged: false,
        isSystem: true,
        category: 'Sistema',
        type: 'native'
      });
    }

    // 3. Detectar cualquier servicio escuchando en puertos comunes no mapeados
    const commonPorts = [3000, 5000, 8080, 8443];
    commonPorts.forEach(port => {
      const conn = connections.find(c => c.localPort === port && c.state === 'LISTEN');
      if (conn && !found.some(f => f.port == port)) {
        found.push({
          id: `native-port-${port}`,
          name: `Servicio Puerto ${port}`,
          rawName: `port-${port}`,
          status: 'running',
          port: port.toString(),
          image: 'unknown',
          isManaged: false,
          isSystem: false,
          category: 'Sistema',
          type: 'native'
        });
      }
    });

    nativeApps = found;
  } catch (error) {
    console.error('[Discovery Error]', error.message);
  }
}, 10000);

// Intervalo principal para enviar todo al cliente (cada 2s)
setInterval(async () => {
  try {
    const containers = await docker.listContainers({ all: true });
    
    // Transformar los contenedores al formato que espera nuestro panel Grid
    const mappedContainers = containers.map(container => {
      const projectName = container.Labels ? container.Labels['com.docker.compose.project'] : null;
      const containerRawName = container.Names[0].replace('/', '').replace(/_[0-9]+$/, '');
      const rawName = projectName || containerRawName;

      let displayName = container.Labels && container.Labels['homelab.name'];
      if (!displayName) {
        displayName = rawName.replace(/-/g, ' ').replace(/_/g, ' ');
      }

      const appsInDir = fs.readdirSync(APPS_DIR);
      const isManaged = appsInDir.some(dir => 
        dir.toLowerCase() === rawName.toLowerCase() || 
        dir.toLowerCase() === containerRawName.toLowerCase()
      );
      
      const actualDirName = isManaged ? appsInDir.find(dir => 
        dir.toLowerCase() === rawName.toLowerCase() || 
        dir.toLowerCase() === containerRawName.toLowerCase()
      ) : rawName;

      let hostPort = 'n/a';
      if (container.Ports && container.Ports.length > 0) {
        const publicPortDef = container.Ports.find(p => p.PublicPort);
        if (publicPortDef) hostPort = publicPortDef.PublicPort.toString();
      }

      // Definir Categoría
      let category = 'Docker';
      const isInfra = displayName.toLowerCase().includes('docker-control') || 
                      displayName.toLowerCase().includes('portainer') ||
                      displayName.toLowerCase().includes('traefik') ||
                      displayName.toLowerCase().includes('nginx');
      
      if (isInfra) category = 'Infraestructura';

      return {
        id: container.Id.substring(0, 12),
        name: displayName,
        rawName: actualDirName,
        status: container.State === 'running' ? 'running' : 'stopped',
        port: hostPort,
        image: container.Image,
        isManaged: isManaged,
        isSystem: isInfra,
        category: category,
        type: 'docker'
      };
    });

    // Combinar contenedores con apps nativas detectadas
    const allApps = [...mappedContainers, ...nativeApps];

    // Emisión estado stateless completo
    io.emit('docker-containers', allApps);
  } catch (error) {
    console.error('[Docker Error]', error.message);
    io.emit('docker-error', 'El Node no puede comunicarse con Docker Daemon. ¿Está Docker corriendo y con permisos?');
  }
}, 2000);

// ==========================================
// ENDPOINTS DE CONFIGURACIÓN (HTTP)
// ==========================================

// Obtener configuración YAML
app.get('/apps/:name/config', (req, res) => {
  const appDir = path.join(APPS_DIR, req.params.name);
  const composePath = path.join(appDir, 'docker-compose.yml');

  if (fs.existsSync(composePath)) {
    const content = fs.readFileSync(composePath, 'utf8');
    res.json({ composeContent: content });
  } else {
    res.status(404).json({ error: 'Configuración no encontrada' });
  }
});

// Actualizar configuración y re-desplegar
app.post('/apps/:name/update', (req, res) => {
  const { composeContent, newName, newPort } = req.body;
  const appDir = path.join(APPS_DIR, req.params.name);
  const composePath = path.join(appDir, 'docker-compose.yml');

  if (!fs.existsSync(appDir)) {
    return res.status(404).json({ error: 'La aplicación no existe' });
  }

  try {
    let finalYaml = composeContent;

    // Si se enviaron nombre o puerto, los inyectamos en el YAML
    if (newName || newPort) {
      const doc = yaml.load(composeContent);
      const serviceName = Object.keys(doc.services)[0];

      if (newName) {
        if (!doc.services[serviceName].labels) doc.services[serviceName].labels = {};
        if (Array.isArray(doc.services[serviceName].labels)) {
          // Si es un array, buscamos si ya existe la etiqueta para actualizarla
          const labelIdx = doc.services[serviceName].labels.findIndex(l => l.startsWith('homelab.name='));
          if (labelIdx !== -1) doc.services[serviceName].labels[labelIdx] = `homelab.name=${newName}`;
          else doc.services[serviceName].labels.push(`homelab.name=${newName}`);
        } else {
          doc.services[serviceName].labels['homelab.name'] = newName;
        }
      }

      if (newPort) {
        let internalPort = '80';
        if (doc.services[serviceName].ports && doc.services[serviceName].ports.length > 0) {
          const firstPort = doc.services[serviceName].ports[0].toString();
          internalPort = firstPort.includes(':') ? firstPort.split(':')[1] : firstPort;
        }
        doc.services[serviceName].ports = [`${newPort}:${internalPort}`];
      }

      finalYaml = yaml.dump(doc);
    }

    // 1. Guardar el contenido final
    fs.writeFileSync(composePath, finalYaml);

    // 2. Re-desplegar (Docker Compose detecta cambios y recrea solo lo necesario)
    console.log(`[Actualizando] ${req.params.name}...`);
    execSync('docker compose up -d', { cwd: appDir });

    res.json({ message: 'Configuración actualizada y contenedor re-desplegado' });
  } catch (error) {
    console.error(`[Error Update ${req.params.name}]`, error.message);
    res.status(500).json({ error: error.message });
  }
});


// ==========================================
// ENDPOINTS Y EVENTOS WEB SOCKETS 
// (Para acciones comandadas desde la UI)
// ==========================================

io.on('connection', (socket) => {
  console.log('🔗 Cliente React conectado al Dashboard:', socket.id);

  // ACCIÓN: Iniciar/Detener un contenedor
  socket.on('toggle-container', async ({ id, action }) => {
    try {
      const container = docker.getContainer(id);
      if(action === 'start') {
        await container.start();
        console.log(`[+] Contenedor ${id} arrancado`);
      } else if (action === 'stop') {
        await container.stop();
        console.log(`[-] Contenedor ${id} detenido`);
      }
    } catch(err) {
      console.error(`[Error Toggle ${action} ${id}]`, err.message);
      socket.emit('docker-error', err.message);
    }
  });

  // ACCIÓN: Eliminar contenedor
  socket.on('delete-container', async ({ id, name }) => {
    try {
      const container = docker.getContainer(id);
      await container.stop().catch(e => {}); // Omitimos fallo si ya está detenido
      await container.remove();
      console.log(`[🗑] Contenedor ${id} eliminado totalmente`);

      // Mejorado: Borrar carpeta de la app si existe
      if (name) {
        const appDir = path.join(APPS_DIR, name);
        if (fs.existsSync(appDir)) {
          fs.rmSync(appDir, { recursive: true, force: true });
          console.log(`[🗑] Carpeta de app ${name} eliminada`);
        }
      }
    } catch(err) {
      console.error(`[Error Delete ${id}]`, err.message);
      socket.emit('docker-error', err.message);
    }
  });

  // ACCIÓN: Stream de Logs en vivo
  let currentLogStream = null;
  socket.on('stream-logs', async ({ id }) => {
    try {
      // Cerrar stream anterior si existe
      if (currentLogStream) {
        currentLogStream.destroy();
        currentLogStream = null;
      }

      const container = docker.getContainer(id);
      const stream = await container.logs({
        follow: true,
        stdout: true,
        stderr: true,
        tail: 50 // Últimas 50 líneas al conectar
      });

      currentLogStream = stream;

      stream.on('data', (chunk) => {
        // Docker streams usan un header de 8 bytes por frame
        const text = chunk.toString('utf8').replace(/[\x00-\x08]/g, '');
        const lines = text.split('\n').filter(l => l.trim());
        lines.forEach(line => socket.emit('container-log', line));
      });

      stream.on('end', () => {
        socket.emit('container-log', '--- Stream finalizado ---');
      });

    } catch(err) {
      console.error(`[Error Logs ${id}]`, err.message);
      socket.emit('container-log', `[Error] ${err.message}`);
    }
  });

  // ACCIÓN: Detener stream de logs
  socket.on('stop-logs', () => {
    if (currentLogStream) {
      currentLogStream.destroy();
      currentLogStream = null;
    }
  });

  // DISCONNECT
  socket.on('disconnect', () => {
    if (currentLogStream) {
      currentLogStream.destroy();
      currentLogStream = null;
    }
    console.log('❌ Cliente React desconectado');
  });
});

// Iniciamos el Servidor
let appPort = process.env.PORT || 3001;

// Cargar puerto desde ajustes si existe
if (fs.existsSync(SETTINGS_FILE)) {
  try {
    const settings = JSON.parse(fs.readFileSync(SETTINGS_FILE));
    if (settings.serverPort) appPort = settings.serverPort;
  } catch(e) {}
}

server.listen(appPort, () => {
  console.log(`🚀 HomaLab Dashboard corriendo en el puerto ${appPort}`);
});
