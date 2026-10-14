import app from './app';
import { env } from './config';
import { redis } from './config/redis';
import { prisma } from './config/prisma';

const startServer = async () => {
  try {
    // Attempt Redis connection
    try {
      await redis.connect();
    } catch {
      console.warn('⚠️ Redis not available at startup. Will retry automatically.');
    }

    const server = app.listen(env.PORT, () => {
      console.log(`
🚀 ========================================================
   FLUX BACKEND SERVER STARTED SUCCESSFULLY
   --------------------------------------------------------
   📡 Environment : ${env.NODE_ENV}
   🌐 Port        : ${env.PORT}
   🔗 API Prefix  : ${env.API_PREFIX}
   🛡️  CORS Origin : ${env.CLIENT_ORIGIN}
   ⚡ Health Check: http://localhost:${env.PORT}/health
======================================================== 🚀
      `);
    });

    // Graceful Shutdown handlers
    const shutdown = async (signal: string) => {
      console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);
      server.close(async () => {
        console.log('🔒 HTTP server closed.');
        try {
          await prisma.$disconnect();
          console.log('📦 Database connections closed.');
          redis.disconnect();
          console.log('⚡ Redis connection closed.');
        } catch (err) {
          console.error('Error during shutdown:', err);
        }
        process.exit(0);
      });

      // Force shutdown after 10 seconds
      setTimeout(() => {
        console.error('⚠️ Could not close connections in time, forcefully shutting down.');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
