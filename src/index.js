import initDatabaseConnection from './db/initDatabaseConection.js';
import setupServer from './server.js';

import { createDirIfNotExists } from './utils/createDirIfNotExists.js';
import { TEMPLATES_DIR, UPLOAD_DIR } from './constants/index.js';

const bootstrap = async () => {
  await initDatabaseConnection();
  await createDirIfNotExists(TEMPLATES_DIR);
  await createDirIfNotExists(UPLOAD_DIR);
  setupServer();
};

void bootstrap();
