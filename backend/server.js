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

const app = express();
const server = http.createServer(app);

// Directorio para apps
const APPS_DIR = path.join(__dirname, 'apps');
if (!fs.existsSync(APPS_DIR)) fs.mkdirSync(APPS_DIR);

// Initialize Socket.io with CORS supporting our local Vite frontend
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

app.use(cors());
app.use(express.json());

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
// BACKGROUND TASK: Ticker de Contenedores Docker (Stateless)
// ==========================================
setInterval(async () => {
  try {
    const containers = await docker.listContainers({ all: true });
    
    // Transformar los contenedores al formato que espera nuestro panel Grid
    const mappedApps = containers.map(container => {
      // 1. Obtener nombre del proyecto (Docker Compose)
      const projectName = container.Labels ? container.Labels['com.docker.compose.project'] : null;
      
      // 2. Definir rawName (nombre interno de la carpeta)
      // Intentamos con el proyecto de compose, si no con el nombre del contenedor limpio
      const containerRawName = container.Names[0].replace('/', '').replace(/_[0-9]+$/, '');
      const rawName = projectName || containerRawName;

      // 3. Priorizar la etiqueta 'homelab.name' o limpiar el nombre del contenedor
      let displayName = container.Labels && container.Labels['homelab.name'];
      if (!displayName) {
        displayName = rawName.replace(/-/g, ' ').replace(/_/g, ' ');
      }

      // 4. MEJORADO: Verificar si es gestionada (insensible a mayúsculas/minúsculas)
      const appsInDir = fs.readdirSync(APPS_DIR);
      const isManaged = appsInDir.some(dir => 
        dir.toLowerCase() === rawName.toLowerCase() || 
        dir.toLowerCase() === containerRawName.toLowerCase()
      );
      
      // Intentar encontrar el nombre real de la carpeta si es gestionada
      const actualDirName = isManaged ? appsInDir.find(dir => 
        dir.toLowerCase() === rawName.toLowerCase() || 
        dir.toLowerCase() === containerRawName.toLowerCase()
      ) : rawName;

      // 5. Buscar el puerto host
      let hostPort = 'n/a';
      if (container.Ports && container.Ports.length > 0) {
        const publicPortDef = container.Ports.find(p => p.PublicPort);
        if (publicPortDef) hostPort = publicPortDef.PublicPort.toString();
      }

      return {
        id: container.Id.substring(0, 12),
        name: displayName,
        rawName: actualDirName, // Usamos el nombre real de la carpeta encontrada
        status: container.State === 'running' ? 'running' : 'stopped',
        port: hostPort,
        image: container.Image,
        isManaged: isManaged,
        isSystem: displayName.includes('docker-control') || displayName.includes('portainer')
      };
    });

    // Emisión estado stateless completo a cada cliente conectado
    io.emit('docker-containers', mappedApps);
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
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 Docker Control Panel API + WebSocket corriendo en el puerto ${PORT}`);
});
