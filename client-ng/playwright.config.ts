import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:4201',
    trace: 'on-first-retry',
    // The app falls back to navigator.language when no language preference
    // is stored yet (see language.service.ts) - pin French so the test
    // doesn't depend on the runner's system locale.
    locale: 'fr-FR',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    {
      command: 'npx ts-node e2eServer.ts',
      cwd: '../server',
      port: 4001,
      reuseExistingServer: false,
      timeout: 60_000,
    },
    {
      command: 'npx ng serve --port 4201 --proxy-config proxy.conf.e2e.json',
      url: 'http://localhost:4201',
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
    },
  ],
});
