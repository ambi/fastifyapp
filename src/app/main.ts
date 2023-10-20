import { Users } from '../id/repositories/users.js';
import { createApp, defaultConfig } from './app.js';
import { createTestData } from './test-data.js';

async function main() {
  const cfg = defaultConfig;
  const users = new Users();
  const app = await createApp(true, cfg, users);

  await createTestData(users);

  app.listen({ port: cfg.port }, (err, address) => {
    if (err) throw err;
    app.log.info(`Server is now listening on ${address}:${cfg.port}`);
  });
}

main().catch(console.error);
