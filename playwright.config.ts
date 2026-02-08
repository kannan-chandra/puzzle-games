import { defineConfig } from '@playwright/test';

const port = 4173;
const serveRoot = process.env.PW_SERVE_ROOT || 'dist';
const baseURL = process.env.PW_BASE_URL || `http://127.0.0.1:${port}/puzzle-games/`;

export default defineConfig({
  testDir: 'tests/integration',
  timeout: 30_000,
  retries: process.env.CI ? 1 : 0,
  use: {
    baseURL,
    headless: true,
  },
  webServer: process.env.PW_BASE_URL
    ? undefined
    : {
        command: `node ./node_modules/http-server/bin/http-server ${serveRoot} -p ${port} -a 127.0.0.1 -c-1`,
        url: `http://127.0.0.1:${port}/puzzle-games/`,
        timeout: 120_000,
        reuseExistingServer: !process.env.CI,
      },
});
