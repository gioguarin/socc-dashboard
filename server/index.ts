import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from './config.js';
import { authGuard } from './auth/middleware.js';
import { getDb, closeDb } from './db/index.js';
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

// Serve static files in production
if (config.nodeEnv === 'production') {
  const distPath = path.resolve(__dirname, '..', 'dist');
  app.use(express.static(distPath));
  app.get('*', (_req, res) => {
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
