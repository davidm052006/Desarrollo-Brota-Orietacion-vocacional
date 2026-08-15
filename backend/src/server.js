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

const app = express();

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

// Límite general para toda la API (protección básica contra abuso/DoS)
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
