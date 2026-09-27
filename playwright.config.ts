import { defineConfig, devices } from "@playwright/test";

const port = 3100;
const baseURL = `http://localhost:${port}`;

export default defineConfig({
  testDir: "./e2e",
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: "list",
  use: { baseURL, trace: "on-first-retry" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: `next dev --port ${port}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
  },
});
