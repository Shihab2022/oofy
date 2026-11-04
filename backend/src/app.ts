import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { env } from './lib/env';
import { generalLimiter } from './middleware/rateLimiter';
import { errorHandler } from './middleware/error';
import apiRouter from './routes/v1';

export function createApp() {
  const app = express();

  app.set('trust proxy', 1);

  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      contentSecurityPolicy: false,
    }),
  );
  app.use(cors({ origin: env.FRONTEND_URL, credentials: true }));
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  app.use(generalLimiter);

  app.get('/health', (_req, res) => {
    res.json({ ok: true, service: 'oofy-api', env: env.NODE_ENV });
  });

  app.use('/api/v1', apiRouter);

  app.use(errorHandler);

  return app;
}
