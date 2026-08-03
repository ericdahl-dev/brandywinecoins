import { defineConfig, devices } from '@playwright/test';

// Shares the dev server with the local preview. Next refuses to run two dev
// servers from one directory, so tests reuse whatever is already on :3000 and
// only start their own when nothing is running.
// localhost, not 127.0.0.1: the dev server binds IPv6, and the v4 address
// answers 500, which would make Playwright's reuse probe miss a live server
// and then fail to bind the occupied port.
const PORT = 3000;
const baseURL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'github' : [['list']],
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    // CI has already run `next build`, so test the artifact that deploys rather
    // than a dev compile. Most of this suite is layout and computed style --
    // precisely what a dev build can get right while the production one does
    // not, through a different CSS module order or a dropped rule.
    command: process.env.CI
      ? `npx next start --port ${PORT}`
      : `npx next dev --port ${PORT}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
