import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import compression from 'compression';
import hpp from 'hpp';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import morgan from 'morgan';

import asyncWrapper from './middlewares/asyncWrapper.js';
import notFoundHandler from './middlewares/notFound.js';
import errorHandler from './middlewares/errorHandler.js';
import healthRouter from './routes/health.js';
import apiV1Router from './routes/api/v1/index.js';
import envLoader from './utils/envLoader.js';
import { stream } from './config/logger.js';

// Load environment variables early
envLoader();

const app = express();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── Security & Performance Middlewares ─────────────────────────────────

// Set security HTTP headers
app.use(helmet());

// Enable CORS
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  credentials: true,
}));

// Global Rate Limiting
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 100 : 10000, // Higher limit in development
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests from this IP, please try again later.',
});
app.use('/api/', globalLimiter);

// Parse JSON bodies
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Prevent HTTP Parameter Pollution
app.use(hpp());

// Response compression
app.use(compression());

// Cookie parser
app.use(cookieParser());

// HTTP request logger using Winston
const isProd = process.env.NODE_ENV === 'production';
app.use(morgan(isProd ? 'combined' : 'dev', { stream }));

// ── Documentation ──────────────────────────────────────────────────────

try {
  const swaggerDocument = YAML.load(path.join(__dirname, '../docs/swagger.yaml'));
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
} catch (error) {
  console.error('Swagger YAML file not found or invalid.');
}

// ── Routes ─────────────────────────────────────────────────────────────

// Health check endpoint
app.use('/api/v1', healthRouter);

// Versioned API routes
app.use('/api/v1', apiV1Router);

// 404 handler
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

export default app;
