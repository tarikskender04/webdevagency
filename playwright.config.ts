import { defineConfig } from '@playwright/test';
import { existsSync } from 'node:fs';
const localChrome = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  workers: 1,
  timeout: 45000,
  use: {
    baseURL: 'http://127.0.0.1:4322',
    headless: true,
    launchOptions: { ...(existsSync(localChrome) ? { executablePath: localChrome } : {}) },
    trace: 'retain-on-failure',
  },
  webServer: { command: 'npm run preview -- --host 127.0.0.1 --port 4322 --ignore-lock', url: 'http://127.0.0.1:4322', reuseExistingServer: !process.env.CI },
});
