import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*.integration.test.ts"],
    env: { API_URL: process.env["API_URL"] ?? "http://localhost:8000" },
    fileParallelism: false,
    testTimeout: 30_000,
  },
});
