import { defineConfig, devices } from '@playwright/test';
import { config } from './src/config/env';
import { timeouts } from './src/config/timeouts';

const browser = {
  ...devices['Desktop Chrome'],
  baseURL: config.baseUrl,
  channel: config.channel,
  headless: config.headless,
  locale: config.locale,
  timezoneId: config.timezoneId,
  viewport: { width: 1440, height: 900 },
  actionTimeout: timeouts.action,
  navigationTimeout: timeouts.navigation,
};

export default defineConfig({
  timeout: timeouts.test,
  expect: { timeout: timeouts.expect },
  fullyParallel: false,
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: [
    ['list'],
    ['html', { open: 'never' }],
    ['junit', { outputFile: 'reports/junit.xml' }],
    [
      'allure-playwright',
      {
        resultsDir: 'allure-results',
        environmentInfo: {
          browser: config.channel ?? 'chromium',
          baseUrl: config.baseUrl,
          locale: config.locale,
          profile: config.profile,
        },
      },
    ],
  ],
  use: {
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    { name: 'unit', testDir: 'tests/unit' },
    {
      name: 'offline',
      testDir: 'tests/e2e',
      testMatch: 'bot-check.spec.ts',
      use: { ...devices['Desktop Chrome'], baseURL: config.baseUrl, locale: config.locale },
    },
    {
      name: 'setup',
      testDir: 'tests',
      testMatch: 'auth.setup.ts',
      use: { ...browser, trace: 'off', video: 'off', screenshot: 'off' },
    },
    {
      name: 'e2e',
      testDir: 'tests/e2e',
      testIgnore: 'bot-check.spec.ts',
      dependencies: ['setup'],
      use: browser,
    },
  ],
});
