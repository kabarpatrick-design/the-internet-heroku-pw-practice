import{defineConfig, devices}from "@playwright/test"
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI? 2 : 0,
  workers: process.env.CI? 2 : undefined,
  timeout: 60_000,
  expect: {timeout:10_000},
  reporter: [['list'],['html', {open: 'never'}]],
  use: {
    //Override with BASE_URL = http://localhost:5000 to test local copy of the site
    baseURL: process.env.BASE_URL ?? 'http://the-internet.herokuapp.com',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  },
  projects: [
    {name: 'chromium', use: { ...devices['Desktop Chrome']}},
    {name: 'firefox', use: { ...devices['Desktop Firefox']}},
    {name: 'webkit', use: { ...devices['Desktop Safari']}},
  ],

  //fullyParallel: true — allows individual tests, including tests in the same file, to run in parallel.
  //workers: 4 — allows Playwright to use up to four worker processes to run tests concurrently.
  
});