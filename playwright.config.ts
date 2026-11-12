import { defineConfig, devices } from "@playwright/test";

const FAKE_URL = "http://localhost:4010";
const PREVIEW_PORT = 4173;

export default defineConfig({
  testDir: "e2e",
  fullyParallel: false,
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: `http://localhost:${PREVIEW_PORT}`,
    locale: "de-AT",
    trace: "retain-on-failure",
  },
  projects: [
    { name: "iphone", use: { ...devices["iPhone 15"], locale: "de-AT" } },
    { name: "android", use: { ...devices["Pixel 7"], locale: "de-AT" } },
  ],
  webServer: [
    {
      command: "npx tsx tools/fake-anthropic/server.ts",
      url: `${FAKE_URL}/__last-request`,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: `npx vite build && npx vite preview --port ${PREVIEW_PORT} --strictPort`,
      env: { VITE_ANTHROPIC_BASE_URL: FAKE_URL, BASE_PATH: "/schulguide/" },
      url: `http://localhost:${PREVIEW_PORT}/schulguide/`,
      reuseExistingServer: !process.env.CI,
      timeout: 180_000,
    },
  ],
});
