# Tecnología Frontend: Docker Control Panel

Este documento define las tecnologías exactas que se utilizarán para construir exclusivamente el apartado visual (Frontend) del Panel de Control de Docker, asegurando que se cumpla la petición de mantener todo en la capa de lenguajes base, sin frameworks adicionales.

## Stack Tecnológico Principal

- **Estructura (HTML5):**
  - Uso de etiquetas semánticas (`<header>`, `<main>`, `<section>`, `<nav>`).
  - Todo el contenido estático residirá en un archivo base `index.html`.

- **Estilos (CSS3 puro / Vanilla CSS):**
  - **Sin Preprocesadores ni Librerías:** No se utilizará Tailwind, SASS ni Bootstrap. Todo el estilo visual será codificado a mano para un control total.
  - **CSS Variables (Custom Properties):** Para mantener la paleta de colores y temas consistentes y facilitar un futuro "Modo Oscuro" o temas dinámicos.
  - **Flexbox y CSS Grid:** Para maquetar dashboards responsivos sin problemas de posicionamiento.
  - **Animaciones CSS:** Para transiciones suaves y efectos de interfaz tipo *Glassmorphism*.

- **Interactividad (Vanilla JavaScript - ES6+):**
  - Manipulación directa del DOM usando `document.querySelector` y manejadores de eventos.
  - **Fetch API:** Para realizar las peticiones HTTP (`GET`, `POST`, `DELETE`, `PATCH`) asíncronas hacia el backend Node.js.
  - Las funciones de JS se inyectarán en un archivo separado `app.js` mediante módulos si es necesario, o en formato clásico.

## Recursos Gráficos
- **Iconografía:** Se sugiere usar SVGs en línea o una fuente de iconos ligera (como Google Material Icons o Phosphor Icons) integrada por CDN.
- **Tipografía:** Google Fonts (por ejemplo *Inter*, *Roboto* o *Outfit*) cargadas directamente en el `<head>`.
