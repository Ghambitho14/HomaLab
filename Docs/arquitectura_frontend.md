# Arquitectura Frontend: Docker Control Panel

Este documento explica cómo estará estructurado y comunicado el Frontend basado en HTML/CSS/JS puro para el panel de control.

## Modelo Arquitectónico General

La aplicación seguirá el patrón de **Aplicación de Página Única Ligera (Lightweight SPA)**. No habrá un enrutador complejo ni recargas de página. Todo sucederá en un único `index.html` que mostrará u ocultará modales y secciones mediante manipulación del DOM (clases CSS auxiliadas por JS).

### Capa de UI (Vista)
1. **Layout Central:**
   - Una "App Shell" con la barra superior de marca y controles globales.
   - Un contenedor principal `main` enfocado en el listado de aplicaciones (Tarjetas o Tabla).
2. **Modales de Interacción:**
   - Los formularios para "Instalar App" o "Cambiar Puerto" existirán ocultos en el DOM pre-renderizados (`<dialog>` nativo o modales flotantes en CSS) e invocados vía JS.

### Capa Lógica (Controlador)
El ciclo de interacción sucederá de la siguiente manera:
1. **Event Listeners:** Los botones instancian funciones específicas delegadas desde `app.js` (Ej. `handleInstallSubmit(e)`).
2. **Estado (State):** El estado de la aplicación vivirá temporalmente en el DOM (en los atributos `data-*` de HTML) y en constantes internas de la sesión de JS, ya que al ser sólo un panel de control, los datos base provendrán directamente del GET de la API del servidor local.

### Capa de Red (API Client)
El Frontend será pasivo, es decir, dependerá del backend para saber qué mostrar. 
- Servirá como consumidor de los Endpoints definidos en tu archivo técnico (`GET /apps`, `POST /apps/install`, etc.).
- Las peticiones asíncronas se aislarán en funciones como `api.getApps()`, `api.installApp(file, port)` para mantener el código JavaScript limpio.

## Estructura de Ficheros Propuesta

El código fuente del frontend se organizará en una carpeta `public/` servida por Express en el backend:

```text
/public
 ├── index.html           # Plantilla base y toda la estructura semántica
 ├── /css
 │   ├── base.css         # Reset de estilos y variables de color
 │   ├── layout.css       # Layout general (header, grid del canvas)
 │   └── components.css   # Estilos modulares (botones, tabla, modales, badges)
 ├── /js
 │   ├── app.js           # Lógica principal, event listeners del UI
 │   └── api.js           # Peticiones Fetch al backend (Endpoints Docker)
 └── /assets
     └── logo.svg         # Recursos gráficos estáticos
```
