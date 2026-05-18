import { defineConfig } from "playwright/test";

export default defineConfig({
  testDir: "src",
  timeout: 60_000,
  use: {
    screenshot: "only-on-failure"
  }
});
