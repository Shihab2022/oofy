import './lib/env'; // validates environment variables and exits if invalid
import { createApp } from './app';
import { env } from './lib/env';

const app = createApp();

const server = app.listen(env.PORT, () => {
  console.log(`🚀 OOFY API running on http://localhost:${env.PORT} (${env.NODE_ENV})`);
});

process.on('unhandledRejection', (err: unknown) => {
  console.error('❌ Unhandled rejection:', err);
  process.exit(1);
});

export default app;
