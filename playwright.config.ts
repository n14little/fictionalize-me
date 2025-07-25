import { defineConfig, devices } from '@playwright/test';
import * as dotenv from 'dotenv';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

/**
 * Playwright configuration for the journal app
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',

  // Maximum time one test can run
  timeout: 30 * 1000,

  // Global setup to start the Next.js server
  globalSetup: './tests/global-setup.ts',

  use: {
    // Base URL for all tests - points to local Next.js dev server
    baseURL: 'http://localhost:3000',

    // Capture screenshot on failure
    screenshot: 'only-on-failure',

    // Record trace for failed tests
    trace: 'on-first-retry',

    // Record video for failed tests
    video: 'on-first-retry',
  },

  // Run tests in different browser configurations
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 13'] },
    },
  ],
});
