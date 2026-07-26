// Standalone backend bootstrap for Playwright E2E runs (client-ng/e2e/).
// Unlike index.ts (real Atlas DB, purge job, reminder scheduler), this
// starts the real Express app against a throwaway in-memory MongoDB and
// seeds a single login-ready user - no external services, no side effects.
process.env.TOKEN_SECRET = process.env.TOKEN_SECRET ?? 'e2e-secret-key';
process.env.CLIENT_URL = process.env.CLIENT_URL ?? 'http://localhost:4200';
process.env.PORT = process.env.PORT ?? '4000';

import app from './app';
import UserModel from './models/user.model';
import { Role } from './constants';
import { connectTestDb } from './utils/testDb/testDb.utils';

export const E2E_USER = {
  email: 'e2e@test.com',
  password: 'e2e-password',
};

async function main(): Promise<void> {
  await connectTestDb();
  await UserModel.create({
    username: 'e2e_admin',
    email: E2E_USER.email,
    password: E2E_USER.password,
    roles: [Role.ADMIN],
  });

  app.listen(process.env.PORT, () => {
    console.log(`E2E server listening on port ${process.env.PORT}`);
  });
}

main();
