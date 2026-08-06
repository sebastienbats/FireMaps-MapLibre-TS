import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import fs from 'fs';
import { connectDB } from './config/database';
import { apiLimiter } from './middleware/rateLimiter';
import { errorHandler } from './middleware/errorHandler';
import logger from './config/logger';
import fireRoutes from './routes/fires';
import copernicusRoutes from './routes/copernicus';
import meteoRoutes from './routes/meteo';
import sdisRoutes from './routes/sdis';
import exportRoutes from './routes/exports';

const app = express();
const PORT = parseInt(process.env.PORT || '5000', 10);

void connectDB();

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

const origins = (process.env.CORS_ORIGIN || 'http://localhost:3000').split(',');
app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);
    if (origins.indexOf(origin) === -1) return cb(new Error('CORS non autorisé'), false);
    cb(null, true);
  },
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/api/', apiLimiter);

app.use('/api/fires', fireRoutes);
app.use('/api/copernicus', copernicusRoutes);
app.use('/api/meteo', meteoRoutes);
app.use('/api/sdis', sdisRoutes);
app.use('/api/exports', exportRoutes);

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok', timestamp: new Date().toISOString(), uptime: process.uptime(), version: '4.0.0',
    sources: { nasaFirms: !!process.env.FIRMS_API_KEY, copernicus: !!process.env.COPERNICUS_API_KEY, meteoFrance: !!process.env.METEO_FRANCE_API_KEY },
  });
});

const exportsDir = path.join(__dirname, '../exports');
if (!fs.existsSync(exportsDir)) fs.mkdirSync(exportsDir, { recursive: true });
app.use('/exports', express.static(exportsDir));

app.use(errorHandler);

app.listen(PORT, () => {
  logger.info(`🔥 FireMaps Backend v4 sur le port ${PORT}`);
});
