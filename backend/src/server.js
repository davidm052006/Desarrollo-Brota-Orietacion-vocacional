require('dotenv').config();

const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const authRoutes      = require('./routes/auth');
const perfilRoutes    = require('./routes/perfil');
const adminRoutes     = require('./routes/admin');
const programasRoutes = require('./routes/programas');
const contactoRoutes  = require('./routes/contacto');
const comunidadRoutes = require('./routes/comunidad');
const rutasRoutes     = require('./routes/rutas');

const app = express();

// Necesario para que Express (y express-rate-limit) lean la IP real del
// visitante desde X-Forwarded-For en vez de ver siempre 127.0.0.1. La
// cadena real cuando se prueba por túnel es: navegador → borde del túnel
// (Cloudflare/ngrok) → agente del túnel (local) → proxy /api de Vite →
// Express — un solo salto agrega ese header (Vite solo lo reenvía tal
// cual, no agrega otro). Sin esto, express-rate-limit tira
// ERR_ERL_UNEXPECTED_X_FORWARDED_FOR en cada petición que llega por el
// túnel y además el límite general terminaba compartido entre TODOS los
// que probaban a la vez, no por persona.
// OJO: `true` (confiar en cualquier cantidad de proxies) dispara
// ERR_ERL_PERMISSIVE_TRUST_PROXY — cualquiera podría spoofear su IP
// agregando su propio X-Forwarded-For. Usar el número exacto de saltos.
app.set('trust proxy', 1);

const ORIGENES_PERMITIDOS = [
  process.env.FRONTEND_URL,
  'http://localhost:5173',
  'http://localhost:5174',
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    callback(null, !origin || ORIGENES_PERMITIDOS.includes(origin));
  },
}));
app.use(express.json());

// Límite general para toda la API (protección básica contra abuso/DoS).
app.use('/api', rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
}));

// Límite más estricto para el formulario de contacto: es público, sin auth,
// y el vector de abuso más obvio (spam) es enviarlo en bucle.
const contactoLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Demasiadas solicitudes. Intenta de nuevo más tarde.' },
});

app.use('/api/auth',      authRoutes);
app.use('/api/perfil',   perfilRoutes);
app.use('/api/admin',    adminRoutes);
app.use('/api/programas', programasRoutes);
app.use('/api/contacto', contactoLimiter, contactoRoutes);
app.use('/api/comunidad', comunidadRoutes);
app.use('/api/rutas',    rutasRoutes);

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Servidor funcionando',
    timestamp: new Date().toISOString()
  });
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Servidor iniciado en http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});
