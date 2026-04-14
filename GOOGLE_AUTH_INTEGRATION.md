# Integrar Google OAuth 2.0 en HomaLab

Este documento te guía paso a paso para implementar autenticación con Google en tu app HomaLab.

---

## 📋 Tabla de Contenidos
1. [Obtener Credenciales de Google](#obtener-credenciales-de-google)
2. [Configurar Backend (Node.js)](#configurar-backend-nodejs)
3. [Configurar Frontend (React)](#configurar-frontend-react)
4. [Flujo de Autenticación](#flujo-de-autenticación)
5. [Testing](#testing)

---

## 🔐 Obtener Credenciales de Google

### Paso 1: Ir a Google Cloud Console
1. Abre https://console.cloud.google.com/
2. Crea un nuevo proyecto o selecciona uno existente
3. Nombre: `HomaLab` (o lo que prefieras)

### Paso 2: Habilitar OAuth 2.0
1. Ve a **Credenciales** (Credentials) en el menú lateral
2. Haz clic en **Crear credenciales** → **ID de cliente OAuth**
3. Selecciona **Aplicación web**

### Paso 3: Configurar Orígenes y Redirecciones
En la sección **URIs de redirección autorizados**, agrega:

```
http://localhost:5173
http://localhost:3001
http://tu-dominio.com
http://tu-dominio.com:5173
http://tu-dominio.com:3001
```

**Guarda el `Client ID` y `Client Secret`** - los necesitarás más adelante.

---

## 🔧 Configurar Backend (Node.js)

### Paso 1: Instalar Dependencias

```bash
cd backend
npm install passport passport-google-oauth20 passport-jwt jsonwebtoken cookie-parser cors
```

**Dependencias:**
- `passport` - Middleware de autenticación
- `passport-google-oauth20` - Estrategia Google OAuth
- `passport-jwt` - Verificación de JWT
- `jsonwebtoken` - Crear y verificar tokens
- `cookie-parser` - Parsear cookies
- `cors` - Compartir recursos entre orígenes

### Paso 2: Crear archivo `.env` en `/backend`

```bash
# Google OAuth
GOOGLE_CLIENT_ID=tu_client_id_aqui.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=tu_client_secret_aqui
GOOGLE_CALLBACK_URL=http://localhost:3001/auth/google/callback

# JWT
JWT_SECRET=tu_secreto_super_seguro_aqui
JWT_EXPIRY=7d

# Frontend
FRONTEND_URL=http://localhost:5173
```

### Paso 3: Actualizar `server.js` - Configurar Passport

Agrega esto **después de los imports** y **antes de los endpoints**:

```javascript
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');

// ========================================
// CONFIGURACIÓN: Passport & JWT
// ========================================

// Middlewares
app.use(cookieParser());
app.use(passport.initialize());
app.use(passport.session());

// Configurar Estrategia Google OAuth
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.GOOGLE_CALLBACK_URL
}, (accessToken, refreshToken, profile, done) => {
  // Aquí normalmente guardarías el usuario en BD
  // Por ahora usamos un objeto simple
  const user = {
    id: profile.id,
    email: profile.emails[0].value,
    name: profile.displayName,
    picture: profile.photos[0]?.value || null,
    provider: 'google'
  };
  
  return done(null, user);
}));

// Serializar usuario (para sesiones)
passport.serializeUser((user, done) => {
  done(null, user);
});

// Deserializar usuario
passport.deserializeUser((user, done) => {
  done(null, user);
});
```

### Paso 4: Agregar Endpoints de Autenticación

Agrega estos endpoints **antes de los endpoints de apps**:

```javascript
// ========================================
// AUTH ENDPOINTS
// ========================================

// 1. Iniciar login con Google
app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

// 2. Callback de Google (redirige aquí después de loguear)
app.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/auth/failed' }),
  (req, res) => {
    // Crear JWT token
    const token = jwt.sign(
      {
        id: req.user.id,
        email: req.user.email,
        name: req.user.name
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRY }
    );

    // Guardar token en cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 días
    });

    // Redirigir al frontend con el token
    res.redirect(`${process.env.FRONTEND_URL}?token=${token}`);
  }
);

// 3. Verificar si está logueado
app.get('/auth/user', (req, res) => {
  const token = req.cookies.token;
  
  if (!token) {
    return res.status(401).json({ error: 'No autenticado' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    res.json({ user: decoded });
  } catch (err) {
    res.status(401).json({ error: 'Token inválido' });
  }
});

// 4. Logout
app.get('/auth/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Deslogueado' });
});

// 5. Error de autenticación
app.get('/auth/failed', (req, res) => {
  res.status(401).json({ error: 'Falló la autenticación con Google' });
});
```

### Paso 5: Middleware de Verificación JWT (Opcional)

Para proteger rutas, crea este middleware:

```javascript
// ========================================
// MIDDLEWARE: Verificar JWT
// ========================================

const verifyToken = (req, res, next) => {
  const token = req.cookies.token;
  
  if (!token) {
    return res.status(401).json({ error: 'Token requerido' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Token inválido' });
  }
};

// Uso: app.get('/ruta-protegida', verifyToken, (req, res) => { ... })
```

---

## 🎨 Configurar Frontend (React)

### Paso 1: Instalar Dependencias

```bash
cd frontend
npm install @react-oauth/google axios
```

### Paso 2: Crear Componente de Login

Crea archivo `frontend/src/components/Login.jsx`:

```jsx
import React, { useEffect, useState } from 'react';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import axios from 'axios';
import '../style/Login.css';

const Login = ({ onLoginSuccess }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLoginSuccess = async (credentialResponse) => {
    setIsLoading(true);
    setError('');

    try {
      // El credentialResponse.credential es el JWT de Google
      // Lo enviamos al backend para validar
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001'}/auth/verify`,
        {
          token: credentialResponse.credential
        }
      );

      // Guardar token localmente
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));

      // Notificar al componente padre
      onLoginSuccess(response.data.user);
    } catch (err) {
      setError(err.response?.data?.error || 'Error en la autenticación');
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginError = () => {
    setError('Error al loguear con Google');
  };

  return (
    <GoogleOAuthProvider clientId="TU_CLIENT_ID_AQUI">
      <div className="login-container">
        <div className="login-box glass-panel blur-heavy">
          <h1>🏠 HomaLab</h1>
          <p>Bienvenido a tu Dashboard</p>

          <div className="login-form">
            {error && <div className="error-message">{error}</div>}

            <GoogleLogin
              onSuccess={handleLoginSuccess}
              onError={handleLoginError}
              text="signin_with"
              size="large"
              theme="dark"
            />
          </div>

          <p className="login-footer">
            Usa tu cuenta de Google para acceder
          </p>
        </div>
      </div>
    </GoogleOAuthProvider>
  );
};

export default Login;
```

### Paso 3: Actualizar `App.jsx`

```jsx
import { useState, useEffect } from 'react';
import Login from './components/Login';
import App from './App'; // Tu app principal
import axios from 'axios';

function MainApp() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Verificar si está logueado al cargar
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const response = await axios.get(
            `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001'}/auth/user`,
            {
              headers: { Authorization: `Bearer ${token}` }
            }
          );
          setUser(response.data.user);
          setIsAuthenticated(true);
        } catch (err) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setIsAuthenticated(false);
        }
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    setUser(null);
  };

  if (isLoading) {
    return <div>Cargando...</div>;
  }

  if (!isAuthenticated) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return <App user={user} onLogout={handleLogout} />;
}

export default MainApp;
```

### Paso 4: CSS para Login

Crea `frontend/src/style/Login.css`:

```css
.login-container {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100vh;
  width: 100%;
  background: linear-gradient(135deg, #0b0f19 0%, #1a2332 100%);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.login-box {
  padding: 3rem;
  border-radius: 1rem;
  text-align: center;
  max-width: 400px;
  width: 90%;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.login-box h1 {
  margin: 0 0 0.5rem;
  font-size: 2.5rem;
  color: var(--accent-color, #38bdf8);
}

.login-box p {
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 2rem;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin: 2rem 0;
}

.error-message {
  background: rgba(239, 68, 68, 0.2);
  border: 1px solid rgba(239, 68, 68, 0.4);
  color: #ff6b6b;
  padding: 0.75rem 1rem;
  border-radius: 0.5rem;
  font-size: 0.9rem;
}

.login-footer {
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.85rem;
}
```

---

## 🔄 Flujo de Autenticación

### Flujo OAuth 2.0 Completo

```
┌─────────────┐                    ┌──────────────┐
│   Frontend  │                    │   Backend    │
│  (React)    │                    │  (Node.js)   │
└──────┬──────┘                    └──────┬───────┘
       │                                  │
       │  1. Click "Login with Google"   │
       │──────────────────────────────────>
       │                                  │
       │  2. Redirige a Google OAuth     │
       │<──────────────────────────────────
       │                                  │
       └─────────────────────────────┐    │
       │                             │    │
       │  3. Usuario se autentica    │    │
       │      en Google              │    │
       │                             │    │
       └─────────────────────────────┘    │
       │                                  │
       │  4. Google redirige a callback  │
       │──────────────────────────────────>
       │                                  │
       │  5. Backend verifica con Google  │
       │  6. Crea JWT token              │
       │                                  │
       │  7. Redirige al frontend        │
       |<──────────────────────────────────
       │
       │  8. Frontend guarda token en localStorage
       │
       │  9. Acceso concedido ✅
```

---

## 🧪 Testing

### Test 1: Verificar Backend

```bash
# Desde la terminal del backend
curl http://localhost:3001/auth/google
```

Debe redirigirte a Google Login.

### Test 2: Verificar Token JWT

```bash
curl -b "token=TU_TOKEN_AQUI" http://localhost:3001/auth/user
```

Debe retornar tu información de usuario en JSON.

### Test 3: Frontend Login

1. Abre http://localhost:5173
2. Haz clic en "Sign in with Google"
3. Completa el login en Google
4. Deberías ser redirigido al dashboard

---

## 📝 Variables de Entorno

### Backend (.env)
```
GOOGLE_CLIENT_ID=XXXXX.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=XXXXX
GOOGLE_CALLBACK_URL=http://localhost:3001/auth/google/callback
JWT_SECRET=tu_secreto_aqui
JWT_EXPIRY=7d
FRONTEND_URL=http://localhost:5173
NODE_ENV=development
```

### Frontend (.env)
```
VITE_GOOGLE_CLIENT_ID=XXXXX.apps.googleusercontent.com
VITE_BACKEND_URL=http://localhost:3001
```

---

## 🔒 Opcionales pero Recomendados

### 1. Base de Datos para Usuarios

```javascript
// Guardar usuarios en BD (con sqlite3)
const saveOrUpdateUser = (profile) => {
  const user = {
    googleId: profile.id,
    email: profile.emails[0].value,
    name: profile.displayName,
    picture: profile.photos[0]?.value
  };

  db.run(
    `INSERT OR REPLACE INTO users (googleId, email, name, picture) VALUES (?, ?, ?, ?)`,
    [user.googleId, user.email, user.name, user.picture],
    (err) => {
      if (err) console.error('Error saving user:', err);
    }
  );
};
```

### 2. Proteger Rutas

```javascript
// Usar middleware verifyToken en rutas sensibles
app.get('/settings', verifyToken, (req, res) => {
  // Solo usuarios logueados pueden acceder
  res.json({ settings: { ...} });
});
```

### 3. Refresh Tokens

Para mejorar seguridad, implementa refresh tokens que expiren más lentamente.

---

## ⚠️ Considera en Producción

- [ ] Usa HTTPS en lugar de HTTP
- [ ] Almacena JWT en HttpOnly cookies (no localStorage)
- [ ] Implementa CSRF protection
- [ ] Valida tokens en backend para cada request
- [ ] Usa refresh tokens con corta duración en JWT principal
- [ ] Guarda usuarios en BD, no en memoria
- [ ] Implementa rate limiting en endpoints de auth

---

## 📖 Referencias

- [Google OAuth 2.0 Docs](https://developers.google.com/identity/oauth2)
- [Passport.js Docs](http://www.passportjs.org/)
- [JWT Docs](https://jwt.io/)
- [React OAuth Google](https://www.npmjs.com/package/@react-oauth/google)

---

¡Listo! Sigue estos pasos y tendrás autenticación con Google funcionando. 🎉
