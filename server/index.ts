import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import swaggerUi from 'swagger-ui-express';
import { config } from './config.js';
import { authGuard } from './auth/middleware.js';
import { getDb, closeDb } from './db/index.js';
import { swaggerSpec } from './swagger.js';
import authRouter from './routes/auth.js';
import newsRouter from './routes/news.js';
import threatsRouter from './routes/threats.js';
import stocksRouter from './routes/stocks.js';
import briefingsRouter from './routes/briefings.js';
import sourcesRouter from './routes/sources.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize SQLite database on startup
getDb();

const app = express();

// CORS config
const corsOptions = config.allowedOrigins.includes('*')
  ? {}
  : { origin: config.allowedOrigins };

app.use(cors(corsOptions));
app.use(express.json());

// Auth middleware — protects /api/* when SOCC_AUTH_ENABLED=true
// Auth routes (/api/auth/*) are always exempt
app.use(authGuard);

// Auth routes (login, logout, status)
app.use('/api/auth', authRouter);

// API routes
app.use('/api/news', newsRouter);
app.use('/api/threats', threatsRouter);
app.use('/api/stocks', stocksRouter);
app.use('/api/briefings', briefingsRouter);
app.use('/api/sources', sourcesRouter);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

// API documentation (Swagger UI) - accessible without auth
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'SOCC Dashboard API Documentation',
}));

// Serve raw OpenAPI spec as JSON
app.get('/api/openapi.json', (_req, res) => {
  res.json(swaggerSpec);
});

// Serve static files in production
if (config.nodeEnv === 'production') {
  const distPath = path.resolve(__dirname, '..', 'dist');

  // Hashed assets (JS/CSS) — long cache (Vite adds content hashes to filenames)
  app.use('/assets', express.static(path.join(distPath, 'assets'), {
    maxAge: '1y',
    immutable: true,
  }));

  // Everything else — no cache (index.html, manifest, icons)
  app.use(express.static(distPath, {
    maxAge: 0,
    etag: false,
    lastModified: false,
    setHeaders: (res) => {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    },
  }));

  app.get('*', (_req, res) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

app.listen(config.port, () => {
  console.log(`🛡️  SOCC Dashboard server running on http://localhost:${config.port}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  closeDb();
  process.exit(0);
});
process.on('SIGTERM', () => {
  closeDb();
  process.exit(0);
});
