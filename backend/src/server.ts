import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { notFoundHandler, errorMiddleware } from './middlewares/error.middleware';
import { seedAdmin } from './controllers/auth.controller';

import authRoutes from './routes/admin.auth.routes';
import productRoutes from './routes/product.routes';
import categoryRoutes from './routes/category.routes';
import orderRoutes from './routes/order.routes';
import adminRoutes from './routes/admin.routes';
import settingsRoutes from './routes/settings.routes';
import contactRoutes from './routes/contact.routes';

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || '*', credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', apiLimiter);

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'oofy-backend' });
});

app.use('/api/admin/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin/settings', settingsRoutes);
app.use('/api/contact', contactRoutes);

app.use(notFoundHandler);
app.use(errorMiddleware);

const PORT = Number(process.env.PORT) || 5000;

async function bootstrap() {
  // Seed admin user (safe to run if tables exist; skipped if migrations not yet run)
  try {
    await seedAdmin();
    console.log('✅ Admin user seeded');
  } catch (err: any) {
    if (err.code === 'P2021') {
      console.log('⚠️  Database tables not found. Run: npx prisma migrate deploy');
    } else {
      console.error('❌ Seed failed:', err.message);
    }
  }

  app.listen(PORT, () => {
    console.log(`OOFY backend running on port ${PORT}`);
  });
}

bootstrap().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

export default app;
