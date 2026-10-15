import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { env } from './config';
import { errorHandler, AppError } from './middlewares/error.middleware';
import { createRateLimiter } from './middlewares/rateLimiter.middleware';
import authRoutes from './modules/auth/auth.routes';
import financeRoutes from './modules/finance/finance.routes';
import tasksRoutes from './modules/tasks/tasks.routes';
import notesRoutes from './modules/notes/notes.routes';

const app = express();

// 1. HTTP Security Headers (Helmet)
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'"],
        frameAncestors: ["'none'"],
      },
    },
    hsts: {
      maxAge: 63072000,
      includeSubDomains: true,
      preload: true,
    },
    frameguard: { action: 'deny' },
    noSniff: true,
  })
);

// 2. Strict Cross-Origin Resource Sharing (CORS)
app.use(
  cors({
    origin: env.CLIENT_ORIGIN,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);

// 3. Request Parsers with Payload Limits (Anti-DOS)
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true, limit: '100kb' }));
app.use(cookieParser(env.COOKIE_SECRET));

// 4. Global API Rate Limiting (120 req / minute)
app.use(createRateLimiter('general', 120, 60));

// 5. Health Check Endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: env.NODE_ENV,
  });
});

// 6. API Route Handlers
app.get(`${env.API_PREFIX}`, (_req: Request, res: Response) => {
  res.status(200).json({
    message: 'Welcome to Flux Personal Productivity & Financial Workspace API',
    version: '1.0.0',
    documentation: '/api/v1/docs',
  });
});

app.use(`${env.API_PREFIX}/auth`, authRoutes);
app.use(`${env.API_PREFIX}/finance`, financeRoutes);
app.use(`${env.API_PREFIX}/tasks`, tasksRoutes);
app.use(`${env.API_PREFIX}/notes`, notesRoutes);

// 7. Catch-all Unhandled Routes (404)
app.all('*', (req: Request, _res: Response, next) => {
  next(new AppError(`Cannot ${req.method} ${req.originalUrl} - Route not found`, 404));
});

// 8. Global Centralized Error Handler
app.use(errorHandler);

export default app;
