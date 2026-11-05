import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 60_000,
  use: { baseURL: 'http://localhost:4173' },
  webServer: {
    command: 'npm run build:preview && npm run preview',
    url: 'http://localhost:4173',
    // Không dùng lại server cũ: trên Windows server preview có thể sót lại và phục vụ bản build cũ mà test vẫn đạt.
    reuseExistingServer: false,
    timeout: 180_000,
  },
  projects: [
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
  ],
});
