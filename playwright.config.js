import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/browser',
  fullyParallel: false,
  workers: 1,
  timeout: 30000,
  use: {
    baseURL: 'http://127.0.0.1:5173',
    launchOptions: {
      executablePath: process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    },
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'mobile', testIgnore: '**/responsive.spec.js', use: { ...devices['iPhone 13'], defaultBrowserType: 'chromium' } },
    { name: 'desktop', testIgnore: '**/responsive.spec.js', use: { viewport: { width: 1440, height: 1000 } } },
    { name: 'responsive', testMatch: '**/responsive.spec.js', use: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, reducedMotion: 'reduce' } },
  ],
  webServer: { command: 'npm run dev -- --host 127.0.0.1', url: 'http://127.0.0.1:5173', reuseExistingServer: true, timeout: 30000 },
})
