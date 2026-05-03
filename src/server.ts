import app from './app';
import { connectDB } from './config/db';
import { connectRedis } from './config/redis';
import { runMigrations } from './migrations/init';
import { env } from './config/env';

const start = async (): Promise<void> => {
  await connectDB();
  await connectRedis();
  await runMigrations();

  app.listen(parseInt(env.PORT), () => {
    console.log(`Server running on port ${env.PORT} in ${env.NODE_ENV} mode`);
    console.log(`Health check: http://localhost:${env.PORT}/health`);
  });
};

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
