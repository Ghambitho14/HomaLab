DOCKER CONTROL PANEL  
 Informe Técnico de Arquitectura y Especificación

Versión 1.0 • Clasificación: Interno

1. Resumen Ejecutivo
   Este documento define la arquitectura, componentes, endpoints y flujos operativos del Docker Control Panel: una aplicación web que permite gestionar contenedores Docker desde una interfaz unificada, sin necesidad de acceder a la terminal.

✔ Instalar apps desde docker-compose.yml con puerto personalizado
✔ Iniciar / detener contenedores con un clic
✔ Desinstalar: elimina contenedor + imagen
✔ Cambiar puerto de una app ya instalada
✔ App principal fija en localhost:8014

2. Arquitectura del Sistema
   El sistema se divide en tres capas claramente separadas:

Capa Tecnología Responsabilidad
Frontend React / Vite UI, tabla de apps, formularios
Backend Node.js + Express + dockerode API REST, lógica de negocio
Motor Docker Engine Ejecución real de contenedores

3. Especificación de Endpoints
   3.1 Gestión básica

Método Ruta Descripción
GET /apps Lista todos los contenedores con nombre, estado y puerto
POST /apps/:id/start Inicia un contenedor detenido
POST /apps/:id/stop Detiene un contenedor activo

3.2 Instalación y desinstalación

Método Ruta Descripción
POST /apps/install Recibe compose.yml + puerto elegido → docker compose up -d
DELETE /apps/:id docker compose down + docker rmi (contenedor + imagen)
PATCH /apps/:id/port Cambia el puerto: down → edita compose → up

4. Flujos Operativos
   4.1 Instalar una aplicación
   • 1. El usuario sube su archivo
   • 2. Ingresa el puerto deseado (ej. 4500)
   • 3. El backend inyecta el puerto en la sección ports del compose
   • 4. Ejecuta docker compose up -d en el directorio de la app
   • 5. El panel muestra la app con enlace localhost:4500

Inyección de puerto (Node.js con js-yaml):
const doc = yaml.load(composeContent);
doc.services[serviceName].ports = [`${puertoElegido}:${puertoInterno}`];
const modified = yaml.dump(doc);
fs.writeFileSync(composePath, modified);
execSync('docker compose up -d', { cwd: appDir });

4.2 Desinstalar una aplicación
• 1. El usuario presiona Desinstalar en el panel
• 2. Se muestra modal de confirmación: ¿Eliminar contenedor e imagen?
• 3. Backend ejecuta docker compose down
• 4. Obtiene el nombre de imagen del compose y ejecuta docker rmi
• 5. La app desaparece de la lista

4.3 Cambiar puerto de una app
Docker no permite cambiar el puerto de un contenedor en caliente. El proceso internamente son tres pasos, pero para el usuario es un solo botón:

• 1. Detiene el contenedor (docker compose down)
• 2. Reescribe el puerto en docker-compose.yml con js-yaml
• 3. Vuelve a levantar el contenedor (docker compose up -d)

5. Modelo de Puertos
   Cada app expone su propio puerto en el host. No se usa reverse proxy.

App Puerto host Tipo
App principal 8014 Fijo (hardcoded)
Otras apps Elegido al instalar Configurable / editable

⚠️ El backend debe validar que el puerto no esté ya en uso antes de levantar un contenedor nuevo.

6. Stack Técnico y Dependencias

Paquete Versión sugerida Uso
react ^18 UI del panel
vite ^5 Build y dev server
express ^4 Servidor HTTP backend
dockerode ^4 SDK Docker para Node.js
js-yaml ^4 Leer y escribir compose.yml
multer ^1 Upload de archivos .yml
cors ^2 CORS entre frontend y backend

7. Pasos de Implementación
   • Scaffoldear backend Express con carpeta /apps para almacenar compose.yml de cada app
   • Implementar GET /apps usando dockerode para listar contenedores
   • Implementar POST /apps/install con multer para recibir el archivo y js-yaml para inyectar el puerto
   • Implementar DELETE /apps/:id con down + rmi
   • Implementar PATCH /apps/:id/port con el ciclo down → editar → up
   • Construir el frontend React: tabla de apps con badges de estado y botones
   • Agregar validación de puertos en uso antes de instalar o cambiar puerto
   • Opcional: polling cada 3s o WebSocket para actualizar estados en tiempo real

Docker Control Panel — Informe Técnico v1.0
