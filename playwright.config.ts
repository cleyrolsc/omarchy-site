import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/browser",
  fullyParallel: true,
  workers: 2,
  timeout: 30_000,
  use: {
    baseURL: "http://127.0.0.1:4322",
    viewport: { width: 1280, height: 800 },
    reducedMotion: "reduce",
    trace: "retain-on-failure",
  },
  webServer: [
    {
      command: "npm run preview -- --host 127.0.0.1 --port 4322",
      url: "http://127.0.0.1:4322",
      reuseExistingServer: !process.env.CI,
    },
    {
      command:
        "python3 -m http.server 6007 --bind 127.0.0.1 --directory storybook-static",
      url: "http://127.0.0.1:6007",
      reuseExistingServer: !process.env.CI,
    },
  ],
});
