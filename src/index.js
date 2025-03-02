import initDatabaseConnection from './db/initDatabaseConection.js';
import setupServer from './server.js';

const bootstrap = async () => {
  await initDatabaseConnection();
  setupServer();
};

bootstrap();
