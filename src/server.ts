import { app } from './app';
import { env } from './config/env';

const server = app.listen(env.port, () => {
  console.log(`Server is running on port ${env.port}`);
});

const shutdown = (signal: NodeJS.Signals): void => {
  console.log(`Received ${signal}. Shutting down server...`);

  server.close(() => {
    console.log('HTTP server closed.');
    process.exit(0);
  });
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
